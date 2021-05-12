export default {
  createBackground(scene, key, texture, count, scrollFactor, depth) {
    this.createBackgroundPositioned(scene, scene.scale.height, key, texture, count, scrollFactor, depth)
  },

  createBackgroundPositioned(scene, y, key, texture, count, scrollFactor, depth) {
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
          .setScrollFactor(scrollFactor, 1)

      if (depth) {
        image.setDepth(depth)
      }

      x += image.width
      scene.backgroundTextures[key].push(image)
    }
  }
}
