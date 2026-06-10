import { Input, Scene } from 'phaser'
import Axolotl from '@/models/sprites/axolotl'
import { throttle } from 'lodash-es'
import PacketClientSceneBrawlBombHit from '@/models/packets/packet-client-scene-brawl-bomb-hit'
import PacketClientSceneBrawlDodge from '@/models/packets/packet-client-scene-brawl-dodge'
import PacketClientSceneBrawlPunch from '@/models/packets/packet-client-scene-brawl-punch'
import PacketClientSceneMovement from '@/models/packets/packet-client-scene-movement'
import PacketLabels from '@/constants/packet-labels'
import PacketServerSceneData from '@/models/packets/packet-server-scene-data'
import PacketServerSceneMovement from '@/models/packets/packet-server-scene-movement'
import SceneKeys from '@/constants/scene-keys'
import SceneUtils from '@/models/scenes/scene-utils'
import store from '@/services/store'

const PUNCH_COOLDOWN_MS = 500
const BOMB_FALL_SPEED = 250         // px/s
const BOMB_COLLIDE_DIST = 38         // px
const SPAWN_POSITIONS = [200, 600, 1000]
const DODGE_DURATION_MS = 500       // doit coller avec BrawlDodgeDurationMs côté serveur
const DODGE_COOLDOWN_MS = 8000      // idem
const CAMERA_ZOOM = 0.75            // dézoom 25 % pour voir plus de terrain

// Trois terrains style Smash Bros, exprimés en blocs [x, y, w, h, color].
// La scène fait 1200×600 px et a un sol implicite supplémentaire pour
// éviter qu'un axolotl ne tombe dans le vide hors arène.
// Sol étendu sur toute la largeur du monde (-100 → 1300) pour qu'aucun
// axolotl ne tombe dans le vide entre les bords de la plateforme et
// l'enceinte. Les plateformes intermédiaires sont assez espacées pour
// nécessiter le double-jump.
const TERRAINS = [
  // 0. Battlefield : sol + deux mini plateformes + une au sommet.
  {
    name: 'Battlefield',
    color: 0x0e2950,
    platforms: [
      [-100, 500, 1400, 30, 0x6b4423],
      [220, 360, 200, 18, 0x6b4423],
      [780, 360, 200, 18, 0x6b4423],
      [500, 220, 200, 18, 0x6b4423],
    ],
  },
  // 1. Final Destination : une seule longue plateforme suspendue.
  {
    name: 'Final Destination',
    color: 0x14082b,
    platforms: [
      [-100, 460, 1400, 40, 0x3a2c8a],
    ],
  },
  // 2. Stairs : escalier asymétrique, terrain incliné.
  {
    name: 'Stairs',
    color: 0x0a3a2a,
    platforms: [
      [-100, 540, 1400, 30, 0x3a8a6b],
      [120, 440, 280, 18, 0x3a8a6b],
      [440, 360, 280, 18, 0x3a8a6b],
      [760, 280, 280, 18, 0x3a8a6b],
    ],
  },
]

export default class GameBrawlScene extends Scene {

  constructor() {
    super({
      key: SceneKeys.GAME_BRAWL,
      physics: {
        arcade: {
          debug: false,
          gravity: { y: 1400 },     // gravité agressive : retombée nerveuse
        },
      },
    })

    this.axolotlsMap = new Map()
    this.bombSprites = new Map()
    this.hpBars = new Map()
    this.deadOverlays = new Map()
    this.dodgeWaves = new Map()
    this.dodgeCooldowns = new Map()
    // Bombes pour lesquelles on a déjà envoyé BOMB_HIT au serveur : on ne
    // recrée pas le sprite tant que le serveur ne nous confirme pas la
    // disparition (cf. ping-pong décrit dans updateBombs).
    this.dispatchedBombHits = new Set()
    // Cibles d'interpolation pour les axolotls distants (lissage 80 ms
    // pour masquer la latence des SERVER_SCENE_MOVEMENT 50 ms throttlés).
    this.remoteTargets = new Map()
    this.gameData = null
    this.delay = 0
    this.lastPunchAt = 0
    this.lastDodgeRequestedAt = 0
    this.iAmParticipant = false
    this.lastDirectionRight = true
  }

  create() {
    this.sceneWidth = 1200
    this.sceneHeight = 600

    if (import.meta.env.DEV) {
      window.__brawlScene = this
    }

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight + 200)
    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.setZoom(CAMERA_ZOOM)
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Souris : clic gauche = esquive surf, clic droit = punch.
    // (Le menu contextuel du navigateur est déjà bloqué par Game.vue via
    // preventRightClick sur window.)
    this.input.mouse.disableContextMenu()
    this.input.on('pointerdown', (pointer) => {
      // pointer.button : 0 = gauche, 1 = milieu, 2 = droit (plus fiable
      // que rightButtonDown() qui interroge l'état courant des boutons).
      if (pointer.button === 2) {
        this.doPunch()
      } else if (pointer.button === 0) {
        this.doDodge()
      }
    })

    // --- Background (oversized pour couvrir la zone visible même quand
    // la caméra est dézoomée à 0.75 et qu'elle est clampée à un bord de
    // l'arène).
    const bgW = this.sceneWidth + 1200
    const bgH = this.sceneHeight + 1200
    this.bgRect = this.add.rectangle(this.sceneWidth / 2, this.sceneHeight / 2, bgW, bgH, 0x000000)
    this.platforms = this.physics.add.staticGroup()
    this.terrainBuilt = false

    // Animation de la vague d'esquive (loop sur les 4 frames).
    this.anims.create({
      key: 'dodge-wave-roll',
      frames: this.anims.generateFrameNumbers('dodge-wave', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    })

    this.throttledMovement = throttle(this.broadcastMovement.bind(this), 50)
  }

  buildTerrain(terrainId) {
    if (this.terrainBuilt) return
    this.terrainBuilt = true
    const terrain = TERRAINS[terrainId] || TERRAINS[0]
    this.bgRect.setFillStyle(terrain.color)

    // Quelques étoiles pour de l'ambiance.
    for (let i = 0; i < 50; i++) {
      this.add.circle(
          Math.random() * this.sceneWidth,
          Math.random() * this.sceneHeight * 0.6,
          1.2,
          0xffffff,
          0.4,
      )
    }

    // Étiquette du terrain.
    this.add.text(this.sceneWidth / 2, 24, terrain.name, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0)

    for (const [x, y, w, h, color] of terrain.platforms) {
      const rect = this.add.rectangle(x + w / 2, y + h / 2, w, h, color)
          .setStrokeStyle(2, 0x000000)
      this.physics.add.existing(rect, true)
      this.platforms.add(rect)
    }

    // Mes joueurs : si je suis participant, on me spawn maintenant.
    this.maybeSpawnLocalAxolotl()
  }

  spawnIndexFor(uuid) {
    const idx = this.gameData?.players?.indexOf(uuid) ?? 0
    return SPAWN_POSITIONS[idx % SPAWN_POSITIONS.length]
  }

  // Remplace les positions par défaut du pseudo et du triangle pour
  // qu'ils apparaissent au-dessus de la barre de vie tout en respectant
  // la distance pseudo ↔ triangle d'origine (25 px).
  //
  // Géométrie d'origine sur l'Axolotl :
  //   pseudo   centre Y = body.y - 28
  //   triangle pointe Y = body.y - 3       (juste au-dessus du sprite)
  //   écart                  25 px
  //
  // Dans Brawl, la barre de vie est centrée à body.y - 16 (back de
  // hauteur 8 → couvre body.y - 20 à body.y - 12). On glisse le tout :
  //   triangle pointe Y = body.y - 22      (juste au-dessus de la barre)
  //   pseudo   centre Y = body.y - 47      (= triangle - 25, écart
  //                                          identique à l'original)
  patchAxolotlNameOffset(axolotl) {
    const origName = axolotl.updateNamePosition.bind(axolotl)
    const origTri = axolotl.updateNameTrianglePosition.bind(axolotl)
    axolotl.updateNamePosition = (x, _y) => origName(x, axolotl.body ? axolotl.body.y - 47 : _y)
    axolotl.updateNameTrianglePosition = (x, _y) => origTri(x, axolotl.body ? axolotl.body.y - 22 : _y)
  }

  maybeSpawnLocalAxolotl() {
    if (this.axolotl || !this.gameData) return
    if (!this.gameData.players.includes(store.state.client.uuid)) {
      // Spectateur : pas d'axolotl, juste une caméra fixe au centre.
      this.cameras.main.centerOn(this.sceneWidth / 2, this.sceneHeight / 2)
      return
    }

    this.iAmParticipant = true
    this.axolotl = new Axolotl(
        this,
        this.spawnIndexFor(store.state.client.uuid),
        300,
        'axolotl',
        store.state.client.name,
        store.state.client.spriteColor,
    )
    this.tuneBrawlAxolotl(this.axolotl)
    this.patchAxolotlNameOffset(this.axolotl)
    this.axolotlsMap.set(store.state.client.uuid, this.axolotl)
    this.physics.add.collider(this.axolotl, this.platforms)
    this.cameras.main.startFollow(this.axolotl, true, 0.1, 0.1)

    // État du double-jump local : réinitialisé à 2 à chaque atterrissage.
    this.jumpsRemaining = 2
  }

  ensureRemoteAxolotl(uuid, player) {
    if (this.axolotlsMap.has(uuid)) return
    const sprite = new Axolotl(
        this,
        this.spawnIndexFor(uuid),
        300,
        'axolotl',
        player.name,
        player.spriteColor,
    )
    this.tuneBrawlAxolotl(sprite)
    this.patchAxolotlNameOffset(sprite)
    // Remote : pas de gravité ni de collider, la position est purement
    // pilotée par les SERVER_SCENE_MOVEMENT (sinon le sprite local
    // tomberait entre deux paquets serveur et ferait des yo-yo).
    if (sprite.body) {
      sprite.body.setAllowGravity(false)
      sprite.body.setVelocity(0, 0)
      sprite.body.moves = false
    }
    this.axolotlsMap.set(uuid, sprite)
  }

  // Ajustements communs aux axolotls de la Bagarre : déplacement plus
  // nerveux (speedFactor 1.8) et body de collision rétréci pour ne plus
  // s'accrocher aux bords des plateformes (cause du bug de collision
  // signalé sur la plateforme principale).
  tuneBrawlAxolotl(sprite) {
    if (!sprite) return
    sprite.setSpeedFactor(1.8)
    if (sprite.body) {
      const w = (sprite.body.width ?? 100) * 0.55
      const h = sprite.body.height ?? 86
      sprite.body.setSize(w, h, false)
      // Recadre l'offset horizontalement pour que le body reste centré
      // sur le sprite (sinon l'axolotl glisse latéralement au touch).
      sprite.body.setOffset((sprite.width - w) / 2, 0)
    }
  }

  refreshRemoteAxolotls() {
    const lobby = store.state.lobby
    if (!lobby || !this.gameData) return
    for (const uuid of this.gameData.players) {
      if (uuid === store.state.client.uuid) continue
      const player = lobby.clients?.[uuid]
      if (player) this.ensureRemoteAxolotl(uuid, player)
    }
  }

  // Met à jour la barre de vie au-dessus de chaque participant, et
  // remonte le label du pseudo au-dessus de la barre (sinon ils se
  // superposent, le pseudo étant à y-28 et la barre à y-16 par défaut).
  updateHpBars() {
    if (!this.gameData) return
    const initialHp = this.gameData.initialHp || 5

    for (const uuid of this.gameData.players) {
      const sprite = this.axolotlsMap.get(uuid)
      if (!sprite || !sprite.body) continue

      const hp = this.gameData.hps?.[uuid] ?? 0
      const cap = this.gameData.hpCap ?? initialHp

      let bar = this.hpBars.get(uuid)
      if (!bar) {
        bar = {
          back: this.add.rectangle(0, 0, 64, 8, 0x000000, 0.7).setDepth(30),
          fill: this.add.rectangle(0, 0, 0, 6, 0x33ff33).setDepth(31).setOrigin(0, 0.5),
          capMark: this.add.rectangle(0, 0, 2, 10, 0xffaa00).setDepth(32),
        }
        this.hpBars.set(uuid, bar)
      }
      const x = sprite.body.x + sprite.body.width / 2
      const y = sprite.body.y - 16
      bar.back.setPosition(x, y).setVisible(true)
      const width = Math.max(0, Math.min(60, 60 * (hp / initialHp)))
      bar.fill.setPosition(x - 30, y).setVisible(hp > 0)
      bar.fill.width = width
      bar.fill.setFillStyle(hp >= 3 ? 0x33ff33 : hp === 2 ? 0xffd33b : 0xff4d4d)
      // Repère du cap actuel (orange).
      if (cap < initialHp) {
        bar.capMark.setPosition(x - 30 + 60 * (cap / initialHp), y).setVisible(true)
      } else {
        bar.capMark.setVisible(false)
      }

      // Le décalage du pseudo (au-dessus de la barre) est appliqué via
      // patchAxolotlNameOffset() au moment du spawn de chaque axolotl,
      // donc rien à faire ici.
    }
  }

  // Synchronise l'effet visuel d'esquive (axolotl translucide + planche
  // d'eau qui passe sous lui) et l'indicateur de cooldown bleu, pour
  // chaque participant.
  updateDodgeVisuals() {
    if (!this.gameData) return

    for (const uuid of this.gameData.players) {
      const sprite = this.axolotlsMap.get(uuid)
      if (!sprite || !sprite.body) continue

      const dodging = !!this.gameData.dodging?.[uuid]
      const hp = this.gameData.hps?.[uuid] ?? 0

      // Translucidité de l'axolotl.
      sprite.setAlpha(dodging ? 0.4 : (hp > 0 ? 1 : 0.7))

      // Vague de surf animée sous l'axolotl pendant l'esquive (sprite
      // 4 frames généré par scripts/generate-sprites.py).
      let wave = this.dodgeWaves.get(uuid)
      if (dodging) {
        const wx = sprite.body.x + sprite.body.width / 2
        const wy = sprite.body.y + sprite.body.height - 8
        if (!wave) {
          wave = this.add.sprite(wx, wy, 'dodge-wave')
              .setDepth(2)
              .setAlpha(0.95)
          wave.play('dodge-wave-roll')
          this.dodgeWaves.set(uuid, wave)
        }
        wave.setPosition(wx, wy)
        // La vague suit la direction du surfeur.
        wave.setFlipX(sprite.direction === 'left')
      } else if (wave) {
        wave.destroy()
        this.dodgeWaves.delete(uuid)
      }

      // Indicateur de cooldown : arc bleu qui se remplit, à droite de
      // la barre de vie.
      let gfx = this.dodgeCooldowns.get(uuid)
      if (!gfx) {
        gfx = this.add.graphics().setDepth(33)
        this.dodgeCooldowns.set(uuid, gfx)
      }
      gfx.clear()
      const cx = sprite.body.x + sprite.body.width / 2 + 40
      const cy = sprite.body.y - 16
      const now = Date.now()
      const readyAt = this.gameData.dodgeReadyAt?.[uuid] ?? 0
      const remaining = Math.max(0, readyAt - now)
      const progress = Math.min(1, 1 - remaining / DODGE_COOLDOWN_MS)
      // Anneau gris sombre en fond.
      gfx.lineStyle(2, 0x0a2538, 0.9)
      gfx.strokeCircle(cx, cy, 6)
      if (progress >= 1) {
        // Prêt : disque bleu plein.
        gfx.fillStyle(0x4aa8ff, 1)
        gfx.fillCircle(cx, cy, 5)
        gfx.lineStyle(2, 0xa6dcff, 1)
        gfx.strokeCircle(cx, cy, 6)
      } else {
        // En cooldown : portion bleue qui grossit dans le sens horaire.
        gfx.fillStyle(0x4aa8ff, 0.95)
        gfx.slice(cx, cy, 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false)
        gfx.fillPath()
      }
    }
  }

  // Affiche un KO gris sur les éliminés.
  updateDeathOverlays() {
    if (!this.gameData) return
    for (const uuid of this.gameData.players) {
      const hp = this.gameData.hps?.[uuid] ?? 0
      const sprite = this.axolotlsMap.get(uuid)
      if (!sprite) continue
      let overlay = this.deadOverlays.get(uuid)
      if (hp <= 0) {
        if (!overlay) {
          overlay = this.add.text(0, 0, 'KO', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
          }).setOrigin(0.5, 0.5).setDepth(40)
          this.deadOverlays.set(uuid, overlay)
        }
        if (sprite.body) {
          overlay.setPosition(sprite.body.x + sprite.body.width / 2, sprite.body.y + sprite.body.height / 2)
          overlay.setVisible(true)
        }
        sprite.setTint(0x666666)
      } else if (overlay) {
        overlay.setVisible(false)
        sprite.clearTint()
      }
    }
  }

  // Synchronise les sprites de bombes avec data.bombs.
  updateBombs(delta) {
    if (!this.gameData) return
    const serverBombs = this.gameData.bombs || {}

    // Nettoie dispatchedBombHits dès que le serveur a confirmé la
    // suppression : sans ça, une bombe spawnée plus tard avec un nouvel
    // uuid n'aurait pas de problème mais le Set grandirait sans limite.
    for (const key of this.dispatchedBombHits) {
      if (!serverBombs[key]) this.dispatchedBombHits.delete(key)
    }

    // Crée les nouvelles (sauf si on a déjà envoyé un BOMB_HIT pour : la
    // SCENE_DATA serveur peut encore arriver avec la bombe le temps
    // que le hit soit traité, cause du spam de collisions / latence).
    for (const [key, bomb] of Object.entries(serverBombs)) {
      if (this.dispatchedBombHits.has(key)) continue
      if (!this.bombSprites.has(key)) {
        const visual = this.add.container(bomb.x, -40)
        const body = this.add.circle(0, 0, 14, 0x111111).setStrokeStyle(2, 0xffaa00)
        const fuse = this.add.rectangle(0, -16, 3, 10, 0xffd700)
        const spark = this.add.circle(0, -22, 3, 0xff5500)
        visual.add([body, fuse, spark])
        visual.setDepth(15)
        this.bombSprites.set(key, { container: visual, key })
      }
    }

    // Supprime celles qui n'existent plus côté serveur
    for (const [key, sprite] of this.bombSprites.entries()) {
      if (!serverBombs[key]) {
        sprite.container.destroy()
        this.bombSprites.delete(key)
      }
    }

    // Anime la chute + collision avec mon propre axolotl.
    const fallStep = (BOMB_FALL_SPEED * delta) / 1000
    for (const [key, sprite] of this.bombSprites.entries()) {
      sprite.container.y += fallStep

      // Collision avec MON axolotl seulement (un seul client signale par bombe).
      if (this.iAmParticipant && this.axolotl && this.axolotl.body && (this.gameData.hps?.[store.state.client.uuid] ?? 0) > 0) {
        const dx = sprite.container.x - (this.axolotl.body.x + this.axolotl.body.width / 2)
        const dy = sprite.container.y - (this.axolotl.body.y + this.axolotl.body.height / 2)
        if (Math.sqrt(dx * dx + dy * dy) < BOMB_COLLIDE_DIST) {
          // Marque la bombe comme dispatched AVANT le envoi pour bloquer
          // toute recréation dans le prochain SCENE_DATA en attente.
          this.dispatchedBombHits.add(key)
          store.dispatch('sendPacket', new PacketClientSceneBrawlBombHit(key))
          this.flashBombExplosion(sprite.container.x, sprite.container.y)
          sprite.container.destroy()
          this.bombSprites.delete(key)
        }
      }

      // Hors écran (touché le sol sans toucher personne) : on laisse pour
      // l'instant ; le serveur ne sait pas si la bombe a fini sa chute.
      if (sprite.container.y > this.sceneHeight + 60) {
        sprite.container.destroy()
        this.bombSprites.delete(key)
      }
    }
  }

  flashBombExplosion(x, y) {
    const flash = this.add.circle(x, y, 10, 0xffe066, 1).setDepth(50)
    this.tweens.add({
      targets: flash,
      radius: 60,
      alpha: 0,
      duration: 350,
      onComplete: () => flash.destroy(),
    })
  }

  // Demande au serveur une esquive : cooldown 8 s, durée d'invincibilité
  // 500 ms. Le serveur valide et broadcast Dodging[uuid]=true ; les
  // visuels (axolotl translucide + vague) sont synchronisés via
  // updateDodgeVisuals.
  doDodge() {
    if (!this.iAmParticipant) return
    const uuid = store.state.client.uuid
    if ((this.gameData?.hps?.[uuid] ?? 0) <= 0) return
    const now = Date.now()
    const readyAt = this.gameData?.dodgeReadyAt?.[uuid] ?? 0
    if (now < readyAt) return
    if (now - this.lastDodgeRequestedAt < 400) return  // anti spam local
    this.lastDodgeRequestedAt = now
    store.dispatch('sendPacket', new PacketClientSceneBrawlDodge())
  }

  doPunch() {
    if (!this.iAmParticipant || !this.axolotl || !this.axolotl.body) return
    if ((this.gameData?.hps?.[store.state.client.uuid] ?? 0) <= 0) return
    const now = this.time.now
    if (now - this.lastPunchAt < PUNCH_COOLDOWN_MS) return
    this.lastPunchAt = now

    const x = this.axolotl.body.x + this.axolotl.body.width / 2
    const y = this.axolotl.body.y + this.axolotl.body.height / 2
    const right = this.lastDirectionRight
    store.dispatch('sendPacket', new PacketClientSceneBrawlPunch(x, y, right))

    this.animatePunch(this.axolotl, right)
    if (import.meta.env.DEV) {
      window.__lastPunch = { x, y, right, at: Date.now() }
    }
  }

  // Joue l'animation de coup de poing sur un sprite : pose punch dessinée
  // dans le spritesheet (frame 8/9) + lunge + "POW!" au point d'impact.
  animatePunch(sprite, directionRight) {
    if (!sprite || !sprite.body) return
    const dirSign = directionRight ? 1 : -1

    sprite.playPunch(directionRight ? 'right' : 'left')

    this.tweens.add({
      targets: sprite,
      x: sprite.x + 16 * dirSign,
      duration: 110,
      yoyo: true,
    })

    const x = sprite.body.x + sprite.body.width / 2
    const y = sprite.body.y + sprite.body.height / 2
    const bam = this.add.text(x + 58 * dirSign, y - 24, 'POW!', {
      fontSize: '22px',
      color: '#ffe066',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5).setDepth(27)
    this.tweens.add({
      targets: bam,
      y: bam.y - 14,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 450,
      onComplete: () => bam.destroy(),
    })
  }

  // Rejoue l'animation de punch d'un adversaire quand le serveur diffuse
  // un nouveau lastPunch dans SCENE_DATA.
  playRemotePunch(lastPunch) {
    if (!lastPunch || !lastPunch.uuid) return
    if (lastPunch.atMs === this.lastSeenPunchAt) return
    this.lastSeenPunchAt = lastPunch.atMs
    if (lastPunch.uuid === store.state.client.uuid) return  // déjà joué localement

    const sprite = this.axolotlsMap.get(lastPunch.uuid)
    if (sprite) {
      this.animatePunch(sprite, lastPunch.directionRight)
    }
  }

  // Reçoit une position d'axolotl distant : au lieu d'appliquer brutalement
  // (setPosition), on stocke une cible vers laquelle on va lerper dans
  // update() sur ~80 ms. Sans ça, chaque paquet provoque un saut visible
  // qui ressemble à du lag, surtout quand le throttle client est à 50 ms
  // et le RTT autour de 100 ms.
  handleRemoteMovement(packet) {
    const uuid = store.state.client.uuid
    if (!packet || packet.clientUuid === uuid) return
    const axolotl = this.axolotlsMap.get(packet.clientUuid)
    if (!axolotl) return

    this.remoteTargets.set(packet.clientUuid, {
      x: packet.x,
      y: packet.y,
      receivedAt: this.time.now,
      direction: packet.direction,
      jumping: packet.jumping,
      walking: packet.walking,
    })
    // Anime tout de suite (pose, sens) : seules les positions sont lissées.
    axolotl.playAnimations(packet.direction, packet.jumping, packet.walking)
  }

  // Lerp progressif des axolotls distants vers leur dernière cible
  // serveur. Fenêtre de 80 ms ≈ throttle (50 ms) + un peu de marge.
  interpolateRemoteAxolotls(delta) {
    const blendWindow = 80
    for (const [uuid, target] of this.remoteTargets.entries()) {
      const axolotl = this.axolotlsMap.get(uuid)
      if (!axolotl) {
        this.remoteTargets.delete(uuid)
        continue
      }
      const t = Math.min(1, delta / blendWindow)
      const nx = axolotl.x + (target.x - axolotl.x) * t
      const ny = axolotl.y + (target.y - axolotl.y) * t
      axolotl.setPosition(nx, ny)
      axolotl.updateNamePosition(nx, ny - 71)
      axolotl.updateNameTrianglePosition(nx + 10, ny - 46)
      // On arrête le lerp quand on est à <1 px (sinon dérive infinitésimale).
      if (Math.abs(target.x - nx) < 1 && Math.abs(target.y - ny) < 1) {
        axolotl.setPosition(target.x, target.y)
        this.remoteTargets.delete(uuid)
      }
    }
  }

  broadcastMovement() {
    if (!this.iAmParticipant || !this.axolotl) return
    const coords = this.axolotl.getChangedCoordinates()
    if (coords) {
      store.dispatch('sendPacket', new PacketClientSceneMovement(
          coords,
          this.axolotl.getMotion(),
          SceneKeys.GAME_BRAWL,
      ))
    }
  }

  handlePacket(packet) {
    store.dispatch('handlePacket', packet)

    switch (packet.label) {
      case PacketLabels.SERVER_SCENE_DATA:
        new PacketServerSceneData(packet).receive(SceneKeys.GAME_BRAWL, p => {
          if (!p || !p.data) return
          this.gameData = p.data
          if (!this.terrainBuilt) this.buildTerrain(this.gameData.terrainId)
          this.refreshRemoteAxolotls()
          this.playRemotePunch(this.gameData.lastPunch)
        })
        break
      case PacketLabels.SERVER_SCENE_MOVEMENT:
        new PacketServerSceneMovement(packet).receive(
            SceneKeys.GAME_BRAWL,
            p => this.handleRemoteMovement(p),
        )
        break
      case PacketLabels.SERVER_COUNTDOWN:
        this.delay = packet.delay
        break
    }
  }

  preload() {
    store.state.webSocket.onmessage = (payload) => {
      try {
        this.handlePacket(JSON.parse(payload.data))
      } catch (ignored) {
        // ignore parse errors
      }
    }

    SceneUtils.preloadAxolotls(this)

    // Vague d'esquive : 4 frames 100x40 générées par
    // scripts/generate-sprites.py.
    this.load.spritesheet('dodge-wave', '../assets/sprites/waves/wave.png', {
      frameWidth: 100,
      frameHeight: 40,
    })

    this.cursors = this.input.keyboard.createCursorKeys()
    this.cursors.KeyQ = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.Q)
    this.cursors.KeyA = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.A)
    this.cursors.KeyD = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.D)
    this.cursors.KeyF = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.F)
    // E ou Shift gauche : esquive (raccourci clavier en miroir du clic
    // gauche pour les joueurs qui préfèrent le clavier).
    this.cursors.KeyE = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.E)
    this.cursors.LShift = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SHIFT)
  }

  update(time, delta) {
    if (this.iAmParticipant && this.axolotl) {
      const hp = this.gameData?.hps?.[store.state.client.uuid] ?? 0
      if (hp > 0) {
        this.axolotl.update(time, delta)
        if (this.axolotl.direction === 'right') this.lastDirectionRight = true
        else if (this.axolotl.direction === 'left') this.lastDirectionRight = false
        this.throttledMovement()

        // Double-jump : Axolotl ne traite que le saut au sol. On consomme
        // un saut supplémentaire en l'air sur JustDown de Space.
        const body = this.axolotl.body
        if (body) {
          if (body.onFloor()) {
            this.jumpsRemaining = 2
          } else if (Input.Keyboard.JustDown(this.cursors.space) && this.jumpsRemaining > 0 && this.jumpsRemaining < 2) {
            body.setVelocityY(-380)
            this.jumpsRemaining -= 1
            this.spawnDoubleJumpPuff()
          } else if (Input.Keyboard.JustDown(this.cursors.space) && this.jumpsRemaining === 2) {
            // Premier saut : Axolotl l'a déjà appliqué (vélocité -250).
            // On boost pour matcher la nervosité du jeu, et on décompte.
            body.setVelocityY(-420)
            this.jumpsRemaining = 1
          }
        }

        // Punch : clic droit (cf. pointerdown) ou F au clavier. Pas
        // Space pour éviter de confondre avec le saut.
        if (Input.Keyboard.JustDown(this.cursors.KeyF)) {
          this.doPunch()
        }
        // Dodge : clic gauche (cf. pointerdown) ou E / Shift au clavier.
        if (Input.Keyboard.JustDown(this.cursors.KeyE) || Input.Keyboard.JustDown(this.cursors.LShift)) {
          this.doDodge()
        }
      }
    }

    this.interpolateRemoteAxolotls(delta)
    this.updateBombs(delta)

    // HUD (barres de vie + cooldown surf + KO) : 30 Hz au lieu de 60.
    // Le `updateDodgeVisuals()` redessine un Graphics par joueur avec
    // slice()+fillPath() à chaque appel, soit la moitié du budget frame
    // pour 3 participants. À 30 Hz visuellement indiscernable.
    if (!this.lastHudAt || time - this.lastHudAt >= 33) {
      this.lastHudAt = time
      this.updateHpBars()
      this.updateDodgeVisuals()
      this.updateDeathOverlays()
    }
  }

  // Petit nuage circulaire sous les pattes pour souligner le 2e saut.
  spawnDoubleJumpPuff() {
    if (!this.axolotl || !this.axolotl.body) return
    const cx = this.axolotl.body.x + this.axolotl.body.width / 2
    const cy = this.axolotl.body.y + this.axolotl.body.height - 4
    const puff = this.add.circle(cx, cy, 6, 0xffffff, 0.85)
        .setStrokeStyle(2, 0xaad8ff)
        .setDepth(4)
    this.tweens.add({
      targets: puff,
      scaleX: 2.6,
      scaleY: 1.4,
      alpha: 0,
      duration: 320,
      onComplete: () => puff.destroy(),
    })
  }

}
