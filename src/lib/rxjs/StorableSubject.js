import { BehaviorSubject } from 'rxjs'
import { localStorage } from '../storage'

class StorableSubject extends BehaviorSubject {
  constructor(initialValue, initialKey) {
    const _initialValue = initialKey ? localStorage.get(initialKey, initialValue) : initialValue
    super(_initialValue)

    this.__key = initialKey
  }

  next(value) {
    super.next(value)
    localStorage.set(this.__key, value)
  }
}

export default StorableSubject
