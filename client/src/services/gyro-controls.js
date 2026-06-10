// Gestion des contrôles mobiles via gyroscope + accéléromètre + touch.
//
// Modèle d'entrée :
//   - tilt latéral du téléphone   → ArrowLeft / ArrowRight  (déplacement)
//   - secousse (shake)            → Space                   (saut)
//   - tap simple sur le canvas    → KeyF                    (punch en Brawl)
//   - double tap sur le canvas    → KeyE                    (esquive en Brawl)
//
// Le module dispatch des KeyboardEvent synthétiques sur window. Toutes les
// scènes Phaser (Axolotl + Brawl/HotPotato) les captent comme du vrai
// clavier → aucune modification du code des scènes n'est requise pour les
// flèches/Space. Seul Brawl reçoit un petit patch pour ignorer le
// pointerdown natif (déjà géré ici via tap/doubleTap).

const STORAGE_KEY = 'gyroPreference'  // 'enabled' | 'disabled' | null

// Constantes de réactivité — ajustées après tests sur iPhone SE et Pixel.
const TILT_DEADZONE_DEG = 5            // sous ce seuil, considéré au repos
const TILT_THROTTLE_MS = 33            // 30 Hz, suffit largement
const SHAKE_THRESHOLD_MS2 = 14         // m/s² ; un flick volontaire fait 20+
const SHAKE_COOLDOWN_MS = 400          // anti-spam saut
const DOUBLE_TAP_WINDOW_MS = 280       // au-dessus, c'est un simple tap

function getOrientationAngle() {
  if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.angle === 'number') {
    return screen.orientation.angle
  }
  // Fallback iOS Safari historique (déprécié mais encore présent).
  return typeof window.orientation === 'number' ? window.orientation : 0
}

class GyroControls {
  constructor() {
    this.active = false
    this.gameContainer = null
    this.neutralAngle = null
    this.lastTilt = null              // 'left' | 'right' | null
    this.lastShakeAt = 0
    this.lastTapAt = 0
    this.pendingTapTimer = null
    this.lastTiltDispatchAt = 0
  }

  static getPreference() {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch (ignored) {
      return null
    }
  }

  static setPreference(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch (ignored) {
      // Mode privé ou stockage désactivé : on tolère.
    }
  }

  static isSupported() {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
  }

  // iOS 13+ exige une permission explicite, déclenchée depuis un gesture
  // utilisateur. Sur les autres plateformes, l'écoute est libre.
  static needsExplicitPermission() {
    return typeof DeviceOrientationEvent !== 'undefined'
        && typeof DeviceOrientationEvent.requestPermission === 'function'
  }

  static async requestPermissions() {
    let oriOk = true
    let motOk = true
    if (typeof DeviceOrientationEvent !== 'undefined'
        && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        oriOk = (await DeviceOrientationEvent.requestPermission()) === 'granted'
      } catch (ignored) {
        oriOk = false
      }
    }
    if (typeof DeviceMotionEvent !== 'undefined'
        && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        motOk = (await DeviceMotionEvent.requestPermission()) === 'granted'
      } catch (ignored) {
        motOk = false
      }
    }
    return oriOk && motOk
  }

  async enable(gameContainerEl) {
    if (this.active) return true
    if (!GyroControls.isSupported()) return false

    this.gameContainer = gameContainerEl || document
    this.neutralAngle = null
    this.lastTilt = null
    this.lastShakeAt = 0
    this.lastTapAt = 0

    this._onOri = this._onDeviceOrientation.bind(this)
    this._onMot = this._onDeviceMotion.bind(this)
    this._onTouchStart = this._onTouchStartCapture.bind(this)
    this._onTouchEnd = this._onTouchEndCapture.bind(this)

    window.addEventListener('deviceorientation', this._onOri)
    window.addEventListener('devicemotion', this._onMot)
    this.gameContainer.addEventListener('touchstart', this._onTouchStart, { capture: true, passive: false })
    this.gameContainer.addEventListener('touchend', this._onTouchEnd, { capture: true, passive: false })

    // Flag global lu par les scènes Phaser pour désactiver le pointerdown
    // natif (sinon un tap déclenche à la fois notre punch ET la dodge
    // historique cliée sur le bouton gauche).
    window.__gyroActive = true
    this.active = true
    return true
  }

  disable() {
    if (!this.active) return
    window.removeEventListener('deviceorientation', this._onOri)
    window.removeEventListener('devicemotion', this._onMot)
    if (this.gameContainer) {
      this.gameContainer.removeEventListener('touchstart', this._onTouchStart, { capture: true })
      this.gameContainer.removeEventListener('touchend', this._onTouchEnd, { capture: true })
    }
    this._releaseAllKeys()
    if (this.pendingTapTimer) {
      clearTimeout(this.pendingTapTimer)
      this.pendingTapTimer = null
    }
    window.__gyroActive = false
    this.active = false
  }

  // Recalibre la position neutre du téléphone à l'instant t — utile quand
  // l'utilisateur change de posture (assis → debout) sans relancer la
  // session.
  recalibrate() {
    this.neutralAngle = null
    this._releaseAllKeys()
  }

  _releaseAllKeys() {
    if (this.lastTilt === 'left') this._dispatchKey('ArrowLeft', 'keyup')
    if (this.lastTilt === 'right') this._dispatchKey('ArrowRight', 'keyup')
    this.lastTilt = null
  }

  _dispatchKey(code, type) {
    const ev = new KeyboardEvent(type, { code, key: code, bubbles: true })
    window.dispatchEvent(ev)
  }

  _pressAndReleaseKey(code, releaseAfterMs = 60) {
    this._dispatchKey(code, 'keydown')
    setTimeout(() => this._dispatchKey(code, 'keyup'), releaseAfterMs)
  }

  // ---- Tilt → flèches ----

  _onDeviceOrientation(event) {
    const now = performance.now()
    if (now - this.lastTiltDispatchAt < TILT_THROTTLE_MS) return
    this.lastTiltDispatchAt = now

    // Sélection de l'axe horizontal effectif selon l'orientation écran :
    // en portrait gamma fait ce qu'on veut, en paysage il faut suivre beta
    // avec un signe qui dépend du sens de rotation.
    const angle = getOrientationAngle()
    let raw
    if (angle === 90) raw = -event.beta
    else if (angle === -90 || angle === 270) raw = event.beta
    else raw = event.gamma

    if (raw == null || Number.isNaN(raw)) return

    if (this.neutralAngle === null) {
      this.neutralAngle = raw
      return
    }

    const delta = raw - this.neutralAngle
    let nextTilt = null
    if (delta > TILT_DEADZONE_DEG) nextTilt = 'right'
    else if (delta < -TILT_DEADZONE_DEG) nextTilt = 'left'

    if (nextTilt === this.lastTilt) return

    if (this.lastTilt === 'left') this._dispatchKey('ArrowLeft', 'keyup')
    if (this.lastTilt === 'right') this._dispatchKey('ArrowRight', 'keyup')
    if (nextTilt === 'left') this._dispatchKey('ArrowLeft', 'keydown')
    if (nextTilt === 'right') this._dispatchKey('ArrowRight', 'keydown')
    this.lastTilt = nextTilt
  }

  // ---- Shake → Space (jump) ----

  _onDeviceMotion(event) {
    // On utilise acceleration (sans gravité) : plus net pour détecter une
    // secousse volontaire, indépendant de l'orientation.
    const a = event.acceleration
    if (!a) return
    const x = a.x || 0
    const y = a.y || 0
    const z = a.z || 0
    const mag = Math.sqrt(x * x + y * y + z * z)
    if (mag < SHAKE_THRESHOLD_MS2) return
    const now = performance.now()
    if (now - this.lastShakeAt < SHAKE_COOLDOWN_MS) return
    this.lastShakeAt = now
    this._pressAndReleaseKey('Space', 80)
  }

  // ---- Tap / double tap → KeyF / KeyE ----

  _onTouchStartCapture(event) {
    // preventDefault sur touchstart empêche le navigateur d'émettre les
    // pointer events correspondants → Phaser ne reçoit plus le tap, on
    // contrôle 100 % la dispatch.
    event.preventDefault()
  }

  _onTouchEndCapture(event) {
    event.preventDefault()
    const now = performance.now()

    if (now - this.lastTapAt < DOUBLE_TAP_WINDOW_MS) {
      // Double tap → DODGE. On annule le single tap encore en attente.
      if (this.pendingTapTimer) {
        clearTimeout(this.pendingTapTimer)
        this.pendingTapTimer = null
      }
      this._pressAndReleaseKey('KeyE', 60)
      this.lastTapAt = 0
      return
    }

    this.lastTapAt = now
    // On attend la fenêtre de double tap avant de confirmer un single tap,
    // sinon un double tap rapide déclencherait quand même un punch parasite.
    this.pendingTapTimer = setTimeout(() => {
      this._pressAndReleaseKey('KeyF', 60)
      this.pendingTapTimer = null
    }, DOUBLE_TAP_WINDOW_MS)
  }
}

// Singleton — un seul GyroControls actif à la fois.
let instance = null

export function getGyroControls() {
  if (!instance) instance = new GyroControls()
  return instance
}

export default GyroControls
