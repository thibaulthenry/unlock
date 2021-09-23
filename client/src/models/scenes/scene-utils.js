import SpriteColors from '../../constants/sprite-colors'
import store from '../../services/store'

export default {
  createBackground(scene, key, texture, count, scrollFactorX, scrollFactorY, depth) {
    this.createBackgroundPositioned(scene, scene.scale.height, key, texture, count, scrollFactorX, scrollFactorY, depth)
  },

  createBackgroundPositioned(scene, y, key, texture, count, scrollFactorX, scrollFactorY, depth) {
    if (!scene.backgroundTextures) {
      scene.backgroundTextures = {}
    }

    if (!scene.backgroundTextures[key]) {
      scene.backgroundTextures[key] = []
    }

    let x = 0

    for (let i = 0; i < count; i++) {
      const image = scene.add.image(x, y, texture)
          .setOrigin(0, 1)
          .setScrollFactor(scrollFactorX, scrollFactorY ? scrollFactorY : 1)

      if (depth) {
        image.setDepth(depth)
      }

      x += image.width
      scene.backgroundTextures[key].push(image)
    }
  },

  createBackgroundPreGame(scene) {
    this.createBackground(scene, 'dungeon-sky', 'dungeon-sky', 1, 0)
    this.createBackground(scene, 'dungeon-mountains', 'dungeon-mountains', 1, 0.25)
    this.createBackground(scene, 'dungeon-plateau', 'dungeon-plateau', 1, 0.6)
    this.createBackground(scene, 'dungeon-wall', 'dungeon-wall', 2, 1)
    this.createBackground(scene, 'dungeon-ceil', 'dungeon-ceil', 2, 1)
    this.createBackground(scene, 'dungeon-ground-bottom', 'dungeon-ground-bottom', 2, 1)
    this.createBackground(scene, 'dungeon-ground-middle-right-hole', 'dungeon-ground-middle-right-hole', 1, 1)
    this.createBackground(scene, 'dungeon-ground-middle', 'dungeon-ground-middle', 2, 1)
    this.createBackground(scene, 'dungeon-ground-top', 'dungeon-ground-top', 2, 1)
    this.createBackground(scene, 'dungeon-ground-hole', 'dungeon-ground-hole', 1, 1)
    this.createBackground(scene, 'dungeon-ground-trap', 'dungeon-ground-trap', 1, 1)
  },

  handleServerAxolotlMovement(packet, axolotlsMap) {
    const uuid = store.state.client.uuid

    for (let [clientUuid, axolotl] of axolotlsMap.entries()) {
      if (packet.clientUuid !== uuid && packet.clientUuid === clientUuid) {
        axolotl.setPosition(packet.x, packet.y)
        axolotl.updateNamePosition(packet.x, packet.y - 71)
        axolotl.updateNameTrianglePosition(packet.x + 10, packet.y - 46)
        axolotl.playAnimations(packet.direction, packet.jumping, packet.walking)
      }
    }
  },

  loadBackgroundPreGame(scene) {
    scene.load.image('dungeon-ceil', '../assets/scenes/pre-game/ceil.png')
    scene.load.image('dungeon-ground-bottom', '../assets/scenes/pre-game/ground_bottom.png')
    scene.load.image('dungeon-ground-hole', '../assets/scenes/pre-game/ground_hole.png')
    scene.load.image('dungeon-ground-middle', '../assets/scenes/pre-game/ground_middle.png')
    scene.load.image('dungeon-ground-middle-left-hole', '../assets/scenes/pre-game/ground_middle_left_hole.png')
    scene.load.image('dungeon-ground-middle-right-hole', '../assets/scenes/pre-game/ground_middle_right_hole.png')
    scene.load.image('dungeon-ground-top', '../assets/scenes/pre-game/ground_top.png')
    scene.load.image('dungeon-ground-trap', '../assets/scenes/pre-game/ground_trap.png')
    scene.load.image('dungeon-ground-trap-open', '../assets/scenes/pre-game/ground_trap_open.png')
    scene.load.image('dungeon-mountains', '../assets/scenes/pre-game/mountains.png')
    scene.load.image('dungeon-plateau', '../assets/scenes/pre-game/plateau.png')
    scene.load.image('dungeon-sky', '../assets/scenes/pre-game/sky.png')
    scene.load.image('dungeon-sign', '../assets/sprites/signs/sign.png')
    scene.load.image('dungeon-wall', '../assets/scenes/pre-game/wall.png')
  },

  preloadAxolotls(scene) {
    let color

    for (let i = 0; i < SpriteColors.length; i++) {
      color = SpriteColors[i]

      scene.load.spritesheet(
          `axolotl-${color}`,
          `../assets/sprites/axolotls/axolotl-${color}.png`,
          {frameWidth: 100, frameHeight: 86}
      )
    }
  },

  updateMap(copiedMap, updatedMap, createSpriteFunction, createSpritePredicate) {
    let safeCopiedMap = new Map()

    if (copiedMap instanceof Map) {
      safeCopiedMap = copiedMap
    } else if (typeof copiedMap === 'object') {
      Object.entries(copiedMap).forEach(([key, value]) => safeCopiedMap.set(key, value))
    } else {
      return
    }

    for (let key of updatedMap.keys()) {
      if (!safeCopiedMap.has(key)) {
        updatedMap.get(key).destroy()
        updatedMap.delete(key)
      }
    }

    safeCopiedMap.forEach((value, key) => {
      if (createSpritePredicate && !createSpritePredicate(key)) {
        return
      }

      if (updatedMap.has(key)) {
        updatedMap.get(key).alpha = value.focus === false ? 0.5 : 1
      } else {
        updatedMap.set(key, createSpriteFunction(value))
      }
    })
  },

  updatePlayersSprites(spritesMap, createSpriteFunction, createSpritePredicate, playersFilterPredicate) {
    const lobby = store.state.lobby

    if (lobby) {
      const lobbyPlayersMap = lobby.getPlayersMap(playersFilterPredicate)
      this.updateMap(lobbyPlayersMap, spritesMap, createSpriteFunction, createSpritePredicate)
    }
  }
}
