import mitt from 'mitt'

const emitter = mitt()

export default {
  $emit: (type, ...payload) => emitter.emit(type, payload.length <= 1 ? payload[0] : payload),
  $on: (type, handler) => emitter.on(type, handler),
  $off: (type, handler) => emitter.off(type, handler),
}
