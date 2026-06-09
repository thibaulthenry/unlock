import { Input, Scene } from 'phaser'
import Axolotl from '@/models/sprites/axolotl'
import { throttle } from 'lodash-es'
import PacketClientSceneBrawlBombHit from '@/models/packets/packet-client-scene-brawl-bomb-hit'
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

// Trois terrains style Smash Bros, exprimés en blocs [x, y, w, h, color].
// La scène fait 1200×600 px et a un sol implicite supplémentaire pour
// éviter qu'un axolotl ne tombe dans le vide hors arène.
const TERRAINS = [
  // 0. Battlefield : sol + deux mini plateformes + une au sommet.
  {
    name: 'Battlefield',
    color: 0x0e2950,
    platforms: [
      [50, 500, 1100, 30, 0x6b4423],
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
      [120, 460, 960, 40, 0x3a2c8a],
    ],
  },
  // 2. Stairs : escalier asymétrique, terrain incliné.
  {
    name: 'Stairs',
    color: 0x0a3a2a,
    platforms: [
      [50, 540, 1100, 30, 0x3a8a6b],
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
          gravity: { y: 800 },
        },
      },
    })

    this.axolotlsMap = new Map()
    this.bombSprites = new Map()
    this.hpBars = new Map()
    this.deadOverlays = new Map()
    this.gameData = null
    this.delay = 0
    this.lastPunchAt = 0
    this.iAmParticipant = false
    this.lastDirectionRight = true
  }

  create() {
    this.sceneWidth = 1200
    this.sceneHeight = 600

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight + 200)
    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Le terrain est dessiné une fois qu'on connaît terrainId (via le
    // premier SERVER_SCENE_DATA). En attendant, fond neutre.
    this.bgRect = this.add.rectangle(this.sceneWidth / 2, this.sceneHeight / 2, this.sceneWidth, this.sceneHeight, 0x000000)
        .setScrollFactor(0)
    this.platforms = this.physics.add.staticGroup()
    this.terrainBuilt = false

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
    this.axolotlsMap.set(store.state.client.uuid, this.axolotl)
    this.physics.add.collider(this.axolotl, this.platforms)
    this.cameras.main.startFollow(this.axolotl, true, 0.1, 0.1)
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
    this.physics.add.collider(sprite, this.platforms)
    this.axolotlsMap.set(uuid, sprite)
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

  // Met à jour la barre de vie au-dessus de chaque participant.
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
    }
  }

  // Affiche un X gris sur les KO.
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

    // Crée les nouvelles
    for (const [key, bomb] of Object.entries(serverBombs)) {
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
          // Émet le hit et supprime localement (le serveur supprimera aussi).
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

    // ANIMATION : petit "lunge" de l'axolotl + cercle de choc devant lui.
    const dirSign = right ? 1 : -1
    this.tweens.add({
      targets: this.axolotl,
      x: this.axolotl.x + 18 * dirSign,
      duration: 80,
      yoyo: true,
    })
    const fistX = x + 50 * dirSign
    const fist = this.add.circle(fistX, y - 4, 8, 0xffffff)
        .setStrokeStyle(3, 0xff4040)
        .setDepth(25)
    const bam = this.add.text(fistX, y - 24, 'POW!', {
      fontSize: '18px',
      color: '#ffe066',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setDepth(26)
    this.tweens.add({
      targets: [fist, bam],
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 280,
      onComplete: () => {
        fist.destroy()
        bam.destroy()
      },
    })
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
        })
        break
      case PacketLabels.SERVER_SCENE_MOVEMENT:
        new PacketServerSceneMovement(packet).receive(
            SceneKeys.GAME_BRAWL,
            p => SceneUtils.handleServerAxolotlMovement(p, this.axolotlsMap),
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

    this.cursors = this.input.keyboard.createCursorKeys()
    this.cursors.KeyQ = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.Q)
    this.cursors.KeyA = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.A)
    this.cursors.KeyD = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.D)
    this.cursors.KeyF = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.F)
  }

  update(time, delta) {
    if (this.iAmParticipant && this.axolotl) {
      const hp = this.gameData?.hps?.[store.state.client.uuid] ?? 0
      if (hp > 0) {
        this.axolotl.update(time, delta)
        if (this.axolotl.direction === 'right') this.lastDirectionRight = true
        else if (this.axolotl.direction === 'left') this.lastDirectionRight = false
        this.throttledMovement()

        if (Input.Keyboard.JustDown(this.cursors.space) || Input.Keyboard.JustDown(this.cursors.KeyF)) {
          this.doPunch()
        }
      }
    }

    this.updateBombs(delta)
    this.updateHpBars()
    this.updateDeathOverlays()
  }

}
