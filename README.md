# Promising Drain

> A little queue for executing Promise-returning asynchronous functions in order


## Installation
Get it like:
```bash
npm install --save promising-drain
```

## Usage
To chain functions, do this:
```javascript
const Drain = require('promising-drain')

const drain = new Drain()

drain.pour(asyncFunction1)
drain.pour(asyncFunction2)
```

The drain will instantly start dripping and execute `asyncFunction2` as soon as `asynFunction1` finishes.

The `pour()` method also returns a promise that will resolve then the function has been executed and be rejected if it definitely won't (e.g. the queue is cleared beforehand).

**Hint:** Your functions are expected to return promises. They'll be wrapped in `Promise.resolve` though, meaning that you can also use synchronous functions returning anything else if you need to.


### Pause / resume the drain
You can cork the drain to prevent queued functions from running.

```javascript
drain.cork()
```

And uncork it to resume.
```javascript
drain.uncork()
```

### Clear the drain
Flush all functions from the drain:
```javascript
drain.clear()
```

### Get queue information
Check the number of remaining functions in the drain:
```javascript
drain.remaining.length === someNumber
```

See if the drain is currently corked:
```javascript
drain.corked === true
```

## Events
This module emits some events that may be listened to via the infamous `.on()`, `.once()` and `.off()` method.

### `drip`
The module fires a `drip` event whenever the currently executed function finishes.

The parameter passed to the listeners will be an object containing a `result` property that is the resolved result of the function.

### `error`
An `error` event gets emitted when a function in the drain throws an exception.

The exception object will be passed as a parameter to listener functions.

### `drained`
When the queue is empty, a `drained` event is triggered.

### `cork`
The `cork` event is fired whenever the drain is being corked.

### `uncork`
The `uncork` event is triggered when the drain gets uncorked.