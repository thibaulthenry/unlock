import SpriteColors from '@/constants/sprite-colors'
import store from '@/services/store'

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

  // Charge l'ensemble des spritesheets d'axolotls (un par sprite color).
  // Utilisé par les scènes qui rendent dynamiquement plusieurs joueurs
  // (Floating Islands notamment).
  preloadAxolotls(scene) {
    for (const color of SpriteColors) {
      scene.load.spritesheet(
          `axolotl-${color}`,
          `../assets/sprites/axolotls/axolotl-${color}.png`,
          { frameWidth: 100, frameHeight: 86 },
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

  // Ancienne API utilisée par lobby-scene et pre-game-scene : pas de filtre,
  // pas d'effet de focus, seulement create/destroy sur diff.
  updateSprites(spritesMap, createSprite) {
    const lobby = store.state.lobby

    if (lobby) {
      const lobbyPlayersMap = lobby.getPlayersMap()
      this.updateMap(lobbyPlayersMap, spritesMap, createSprite)
    }
  },

  // Nouvelle API utilisée par Floating Islands : un prédicat de création
  // (par uuid) et un prédicat de filtrage des joueurs (par player).
  updatePlayersSprites(spritesMap, createSpriteFunction, createSpritePredicate, playersFilterPredicate) {
    const lobby = store.state.lobby

    if (lobby) {
      const lobbyPlayersMap = lobby.getPlayersMap(playersFilterPredicate)
      this.updateMap(lobbyPlayersMap, spritesMap, createSpriteFunction, createSpritePredicate)
    }
  },
}
