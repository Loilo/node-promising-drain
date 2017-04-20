const mitt = require('mitt')

/**
 * A class to queue asynchronous functions
 */
class Drain {
  constructor () {
    this._queue = []
    this._emitter = mitt.__esModule ? mitt.default() : mitt()
    this._draining = false
  }

  on (event, handler) {
    this._emitter.on(event, handler)
    return this
  }

  once (event, handler) {
    const handlerProxy = (...args) => {
      handler(...args)
      this._emitter.off(event, handlerProxy)
    }
    this._emitter.on(event, handlerProxy)
    return this
  }

  off (event, handler) {
    this._emitter.off(event, handler)
    return this
  }

  pour (callback) {
    const timestamp = 'Performance' in window && 'performance' in window && window.performance instanceof window.Performance
      ? performance.now()
      : Date.now()
    const id = String(timestamp + Math.random() * 1000000) // good enough

    let remaining = this._queue.push({ id, callback })

    const executed = new Promise((resolve, reject) => {
      const checkDrip = evt => {
        remaining--

        if (evt.id === id) {
          this.off('drip', checkDrip)
          this.off('drained', checkDrained)
          resolve()
        }
      }

      const checkDrained = () => {
        this.off('drip', checkDrip)
        this.off('drained', checkDrained)
        reject()
      }

      this.on('drip', checkDrip)
      this.on('drained', checkDrained)
    })

    if (this._queue.length === 1) this._drain()
    return executed
  }

  clear () {
    this._queue.splice(this._draining ? 1 : 0)
    this._emitter.emit('drained')
    return this
  }

  get corked () {
    return this._corked
  }

  get remaining () {
    return this._queue.length
  }

  cork () {
    if (this._corked) return

      this._corked = true
    this._emitter.emit('cork')
    return this
  }

  uncork () {
    if (!this._corked) return
      this._corked = false
    this._emitter.emit('uncork')
    if (this._queue.length) this._drain()
      return this
  }

  _drain () {
    this._draining = true

    Promise
    .resolve(this._queue[0].callback())
    .catch(err => {
      this._emitter.emit('error', err)
    })
    .then(result => {
      const { id, callback } = this._queue.shift()

      this._emitter.emit('drip', { result, callback, id })

      if (this._queue.length) {
        if (!this._corked) {
          setTimeout(() => this._drain(), 0)
        }
      } else {
        this._draining = false
        this._emitter.emit('drained')
      }
    })
  }
}

module.exports = Drain