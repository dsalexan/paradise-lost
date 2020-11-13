import { isInteger } from 'lodash'

export function type(variable) {
  const _typeof = typeof variable
  // if (['object', 'function'].includes(_typeof)) {

  // }

  if (_typeof === 'number') {
    if (isInteger(variable)) return 'integer'
    else return 'float'
  }

  return _typeof
}
