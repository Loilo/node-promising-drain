const mitt = require('mitt')

/**
 * A class to queue asynchronous functions
 */
class Drain {
  constructor () {
    this._queue = []
    this._emitter = mitt()
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
    this._queue.push(callback)

    if (this._queue.length === 1) this._drain()
  }
  
  clear () {
    this._queue.splice(this._draining ? 1 : 0)
  }
  
  get corked () {
    return this._corked
  }
  
  get remaining () {
    return this._queue
  }
  
  cork () {
    if (this._corked) return
    
    this._corked = true
    this._emitter.emit('cork')
  }
  
  uncork () {
    if (!this._corked) return
    this._corked = false
    this._emitter.emit('uncork')
    if (this._queue.length) this._drain()
  }
  
  _drain () {
    this._draining = true

    Promise
      .resolve(this._queue[0]())
      .catch(err => {
        this._emitter.emit('error', err)
      })
      .then(result => {
        this._queue.shift()

        this._emitter.emit('drip', result)

        if (this._queue.length) {
          if (!this._corked) {
            this._drain()
          }
        } else {
          this._draining = false
          this._emitter.emit('drained')
        }
      })
  }
}

module.exports = Drain