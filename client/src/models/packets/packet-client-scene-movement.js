import PacketLabels from '../../constants/packet-labels'

export default class PacketClientSceneMovement {

  constructor({x, y, vx, vy, ax, ay, r}, {direction, jumping, walking}, sceneKey) {
    this.label = PacketLabels.CLIENT_SCENE_MOVEMENT
    this.coordinates = {}
    this.coordinates.x = x || null
    this.coordinates.y = y || null
    this.coordinates.vx = vx || null
    this.coordinates.vy = vy || null
    this.coordinates.ax = ax || null
    this.coordinates.ay = ay || null
    this.coordinates.r = r || null
    this.motion = {}
    this.motion.direction = direction || null
    this.motion.jumping = jumping || null
    this.motion.walking = walking || null
    this.sceneKey = sceneKey || null
  }

}
