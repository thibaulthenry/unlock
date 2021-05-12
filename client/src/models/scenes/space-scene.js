import {Scene} from 'phaser'
import PacketClientSpaceSceneMovement from '../packets/packet-client-space-scene-movement'
import PacketLabels from '../../constants/packet-labels'
import PacketServerSpaceSceneMovement from '../packets/packet-server-space-scene-movement'
// import SceneKeys from '../../constants/scene-keys'
import store from '../../services/store'

export default class SpaceScene extends Scene {

  players = new Set()

  constructor() {
    super({
      key: 'SpaceScene',
      physics: {
        arcade: {
          debug: false,
          gravity: {
            y: 0
          }
        }
      }
    })
  }

  preload() {
    this.load.image('ship', '../assets/spaceShips_001.png')
    this.load.image('otherPlayer', '../assets/enemyBlack5.png')
  }

  create() {
    store.state.webSocket.onmessage = (payload) => {
      try {
        this.handlePacket(JSON.parse(payload.data))
      } catch (ignored) {}
    }

    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' })
    this.otherPlayers = this.physics.add.group()

    this.cursors = this.input.keyboard.createCursorKeys()


    this.addPlayer({x: 100, y: 100, team: 'red'})
    this.players.add(store.state.client?.uuid)
  }

  update() {
    if (store.state.lobby?.clients) {
      Object.keys(store.state.lobby?.clients).forEach(uuid => {
        if (!this.players.has(uuid)) {
          this.players.add(uuid)
          this.addOtherPlayers({x: 200, y:250, team:'blue', clientUuid: uuid})
        }
      })
    }

    this.blueScoreText.setText('Blue: ' + this.lobby)

    if (this.ship) {
      if (this.cursors.left.isDown) {
        this.ship.setAngularVelocity(-300)
      } else if (this.cursors.right.isDown) {
        this.ship.setAngularVelocity(300)
      } else {
        this.ship.setAngularVelocity(0)
      }

      if (this.cursors.up.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation + 1.5, 300, this.ship.body.acceleration)
      } else {
        this.ship.setAcceleration(0)
      }

      this.physics.world.wrap(this.ship, 0)
    }

    let x = this.ship.x
    let y = this.ship.y
    let r = this.ship.rotation
    if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.r)) {
      store.dispatch('sendPacket', new PacketClientSpaceSceneMovement(x, y, r))
    }

    this.ship.oldPosition = {x, y, r}
  }

  addPlayer(playerInfo) {
    this.ship = this.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40)

    if (playerInfo.team === 'blue') {
      this.ship.setTint(0x0000ff)
    } else {
      this.ship.setTint(0xff0000)
    }

    this.ship.setDrag(100)
    this.ship.setAngularDrag(100)
    this.ship.setMaxVelocity(200)
  }

  addOtherPlayers(playerInfo) {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40)

    if (playerInfo.team === 'blue') {
      otherPlayer.setTint(0x0000ff)
    } else {
      otherPlayer.setTint(0xff0000)
    }
    otherPlayer.clientUuid = playerInfo.clientUuid
    this.otherPlayers.add(otherPlayer)
  }

  handlePacket(packet) {
    store.dispatch('handlePacket', packet)

    switch (packet.label) {
      case PacketLabels.SERVER_SPACE_SCENE_MOVEMENT:
        new PacketServerSpaceSceneMovement(packet).receive(this.otherPlayers)
    }
  }

}
