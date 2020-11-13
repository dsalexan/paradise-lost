// import debug from 'debug'

// const namespaces = {}

// export default function reactDebug(namespace, ...message) {
//     const ctx = namespaces[namespace] || (namespaces[namespace] = debug(namespace))
//     ctx(message.join('  '))
// }

export function build(debug) {
  if (!debug.namespaces) debug.namespaces = {}

  // INJECT ERROR NAMESPACE
  debug.error = function () {
    const oldLog = debug.log
    debug.log = console.error.bind(console)
    debug.apply(debug, arguments)
    debug.log = oldLog
  }

  // INJECT GENERIC NAMESPACE
  debug.x = function () {
    const namespace = [].shift.apply(arguments)

    if (!debug.namespaces[namespace]) {
      debug.namespaces[namespace] = build(debug.extend(namespace))
    }

    if (arguments.length === 0) return debug.namespaces[namespace]

    debug.namespaces[namespace].apply(debug.namespaces[namespace], arguments)
  }

  return debug
}
