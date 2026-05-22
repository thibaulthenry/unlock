import { Input, Scene } from 'phaser'
import Axolotl from '@/models/sprites/axolotl'
import { throttle } from 'lodash-es'
import PacketClientSceneHotPotatoTag from '@/models/packets/packet-client-scene-hot-potato-tag'
import PacketClientSceneMovement from '@/models/packets/packet-client-scene-movement'
import PacketLabels from '@/constants/packet-labels'
import PacketServerSceneData from '@/models/packets/packet-server-scene-data'
import PacketServerSceneMovement from '@/models/packets/packet-server-scene-movement'
import SceneKeys from '@/constants/scene-keys'
import SceneUtils from '@/models/scenes/scene-utils'
import store from '@/services/store'

// ┌────────────────────────────────────────────────────────────────────┐
// │ Map (1200×600)                                                     │
// │                                                                    │
// │      ┌────────┐                          ┌────────┐                │
// │      │ pipe A1│                          │ pipe B1│                │
// │  ────┴─────── (top platform) ───────────┴────────────              │
// │                                                                    │
// │                ┌────────┐         ┌────────┐                       │
// │                │ pipe B2│         │ pipe A2│                       │
// │  ── (mid L) ───┴────────         ┴────────── (mid R) ───           │
// │                                                                    │
// │                                                                    │
// │  ────────────────── (ground, full width) ───────────────────       │
// └────────────────────────────────────────────────────────────────────┘
//
// Pipes :
//  A1 (top, x=300) ←→ A2 (mid R, x=900)
//  B1 (top, x=900) ←→ B2 (mid L, x=300)
//
// Le porteur de bombe est rendu avec un cercle rouge + minuteur au-dessus
// de la tête. Sur collision entre le porteur (= moi) et un autre axolotl,
// on émet CLIENT_SCENE_HOT_POTATO_TAG. Sur overlap avec un tuyau, on est
// téléporté à l'autre extrémité de la paire (cooldown 600 ms pour
// éviter les boucles).
export default class GameHotPotatoScene extends Scene {

  constructor() {
    super({
      key: SceneKeys.GAME_HOT_POTATO,
      physics: {
        arcade: {
          debug: false,
          gravity: { y: 700 },
        },
      },
    })

    this.axolotlsMap = new Map()
    this.pipes = []
    this.lastTeleportAt = 0
    this.lastTagAttemptAt = 0
    this.holderUuid = null
    this.delay = 0
  }

  // Position de spawn déterministe basée sur l'UUID, pour que les joueurs
  // ne soient pas superposés au début d'une manche.
  spawnXFor(uuid) {
    let hash = 0
    for (let i = 0; i < uuid.length; i++) hash = (hash + uuid.charCodeAt(i)) | 0
    const positions = [120, 320, 560, 760, 980, 220, 460, 660, 860, 1080]
    return positions[Math.abs(hash) % positions.length]
  }

  create() {
    this.sceneWidth = 1200
    this.sceneHeight = 600

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight)

    // --- Background (dégradé bleu nuit + sol)
    this.add.rectangle(this.sceneWidth / 2, this.sceneHeight / 2, this.sceneWidth, this.sceneHeight, 0x0a1a3a)
        .setScrollFactor(0)
    for (let i = 0; i < 40; i++) {
      this.add.circle(Math.random() * this.sceneWidth, Math.random() * this.sceneHeight * 0.7, 1.2, 0xffffff, 0.6)
    }

    // --- Plateformes (statiques)
    this.platforms = this.physics.add.staticGroup()
    this.createPlatform(0, 540, this.sceneWidth, 60, 0x8b5a2b)            // sol
    this.createPlatform(150, 380, 400, 20, 0x6b4423)                       // mid gauche
    this.createPlatform(650, 380, 400, 20, 0x6b4423)                       // mid droite
    this.createPlatform(200, 200, 800, 20, 0x6b4423)                       // top

    // --- Tuyaux
    //   id, x, y, w, h, pairId
    this.createPipe('A1', 280, 170, 40, 50, 'A2', 0x2ecc71)
    this.createPipe('A2', 900, 350, 40, 50, 'A1', 0x2ecc71)
    this.createPipe('B1', 900, 170, 40, 50, 'B2', 0xe67e22)
    this.createPipe('B2', 280, 350, 40, 50, 'B1', 0xe67e22)

    // --- Axolotl local
    this.axolotl = new Axolotl(
        this,
        this.spawnXFor(store.state.client.uuid),
        450,
        'axolotl',
        store.state.client.name,
        store.state.client.spriteColor,
    )
    this.axolotlsMap.set(store.state.client.uuid, this.axolotl)

    this.physics.add.collider(this.axolotl, this.platforms)

    // Téléport au contact d'un tuyau (avec cooldown).
    this.pipes.forEach(pipe => {
      this.physics.add.overlap(this.axolotl, pipe.body, () => this.tryTeleport(pipe))
    })

    // --- Bombe : cercle rouge + texte de countdown, ré-attaché au porteur
    //     à chaque frame via update().
    this.bombSprite = this.add.circle(0, 0, 18, 0xff2a2a)
        .setStrokeStyle(3, 0xffe066)
        .setDepth(20)
        .setVisible(false)
    this.bombCore = this.add.circle(0, 0, 8, 0x000000)
        .setDepth(21)
        .setVisible(false)
    this.bombFuse = this.add.rectangle(0, 0, 3, 12, 0xffaa00)
        .setDepth(22)
        .setVisible(false)
    this.bombText = this.add.text(0, 0, '', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setDepth(23).setVisible(false)

    // --- Caméra
    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.startFollow(this.axolotl, true, 0.1, 0.1)
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // --- Sync joueurs distants
    this.time.addEvent({
      callback: this.updatePlayersSprites,
      callbackScope: this,
      delay: 500,
      loop: true,
    })

    // Listener countdown pour afficher les secondes restantes.
    this.throttledMovement = throttle(this.broadcastMovement.bind(this), 50)
  }

  createPlatform(x, y, w, h, color) {
    const rect = this.add.rectangle(x + w / 2, y + h / 2, w, h, color)
        .setStrokeStyle(2, 0x000000)
    this.physics.add.existing(rect, true)
    this.platforms.add(rect)
  }

  createPipe(id, x, y, w, h, pairId, color) {
    const body = this.add.rectangle(x + w / 2, y + h / 2, w, h, color)
        .setStrokeStyle(3, 0x222222)
    this.physics.add.existing(body, true)
    // Petit liseré clair pour la "bouche" du tuyau.
    this.add.rectangle(x + w / 2, y + 4, w + 4, 4, 0xffffff, 0.6)
    this.pipes.push({ id, body, x, y, pairId })
    // Étiquette
    this.add.text(x + w / 2, y - 14, id, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5)
  }

  tryTeleport(pipe) {
    const now = this.time.now
    if (now - this.lastTeleportAt < 600) return
    const pair = this.pipes.find(p => p.id === pipe.pairId)
    if (!pair) return
    this.lastTeleportAt = now
    // Sort par-dessus le tuyau jumeau, vélocité réinitialisée.
    this.axolotl.body.setVelocity(0, 0)
    this.axolotl.setPosition(pair.x + 20, pair.y - 20)
    this.cameras.main.flash(150, 80, 200, 255)
  }

  broadcastMovement() {
    const coords = this.axolotl.getChangedCoordinates()
    if (coords) {
      store.dispatch('sendPacket', new PacketClientSceneMovement(
          coords,
          this.axolotl.getMotion(),
          SceneKeys.GAME_HOT_POTATO,
      ))
    }
  }

  // Quand JE suis le porteur, détecte la collision avec un autre axolotl
  // et envoie un tag (cooldown local 200 ms entre tentatives).
  tryTag() {
    if (this.holderUuid !== store.state.client.uuid) return
    const now = this.time.now
    if (now - this.lastTagAttemptAt < 200) return

    for (const [uuid, other] of this.axolotlsMap.entries()) {
      if (uuid === store.state.client.uuid) continue
      if (!other.body) continue

      const dx = this.axolotl.x - other.x
      const dy = this.axolotl.y - other.y
      if (Math.sqrt(dx * dx + dy * dy) < 60) {
        this.lastTagAttemptAt = now
        store.dispatch('sendPacket', new PacketClientSceneHotPotatoTag(uuid))
        break
      }
    }
  }

  updateBombVisual() {
    if (!this.holderUuid) {
      this.bombSprite.setVisible(false)
      this.bombCore.setVisible(false)
      this.bombFuse.setVisible(false)
      this.bombText.setVisible(false)
      return
    }
    const holder = this.axolotlsMap.get(this.holderUuid)
    if (!holder || !holder.body) {
      this.bombSprite.setVisible(false)
      this.bombCore.setVisible(false)
      this.bombFuse.setVisible(false)
      this.bombText.setVisible(false)
      return
    }
    const x = holder.body.x + holder.body.width / 2
    const y = holder.body.y - 28
    this.bombSprite.setPosition(x, y).setVisible(true)
    this.bombCore.setPosition(x, y).setVisible(true)
    this.bombFuse.setPosition(x, y - 22).setVisible(true)
    this.bombText.setPosition(x + 22, y - 24)
        .setText(String(this.delay))
        .setVisible(this.delay > 0)
  }

  updatePlayersSprites() {
    SceneUtils.updateSprites(this.axolotlsMap, player => new Axolotl(
        this,
        this.spawnXFor(player.uuid),
        450,
        'axolotl',
        player.name,
        player.spriteColor,
    ))
    this.children.bringToTop(this.axolotl)
    this.children.bringToTop(this.axolotl.axolotlName)
    this.children.bringToTop(this.axolotl.axolotlNameTriangle)
  }

  handlePacket(packet) {
    store.dispatch('handlePacket', packet)

    switch (packet.label) {
      case PacketLabels.SERVER_SCENE_DATA:
        new PacketServerSceneData(packet).receive(SceneKeys.GAME_HOT_POTATO, p => {
          if (p && p.data && p.data.holderUuid) {
            this.holderUuid = p.data.holderUuid
          }
        })
        break
      case PacketLabels.SERVER_SCENE_MOVEMENT:
        new PacketServerSceneMovement(packet).receive(
            SceneKeys.GAME_HOT_POTATO,
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
  }

  update(time, delta) {
    this.axolotl.update(time, delta)

    this.tryTag()
    this.updateBombVisual()
    this.throttledMovement()
  }

}
