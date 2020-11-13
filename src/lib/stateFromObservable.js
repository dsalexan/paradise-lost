import { merge, interval } from 'rxjs'
import { debounce as rxjs_debounce } from 'rxjs/operators'
import { flatten, get, isArray } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import BehaviourSubject from '../lib/rxjs/StorableSubject'

export default function useStateFromObservable(_observable, format, { debounce } = {}) {
  const observable = useMemo(() => {
    if (!debounce) return merge(...flatten([_observable]))
    else return merge(...flatten([_observable])).pipe(rxjs_debounce(() => interval(debounce)))
  }, [_observable, debounce])

  const subscription = useRef(null)
  const [v, setV] = useState(format ? format(_observable) : get(observable, 'value'))

  useEffect(() => {
    subscription.current && subscription.current.unsubscribe()
    subscription.current = null

    if (!observable) return

    const isBehaviour = observable instanceof BehaviourSubject

    if (!isBehaviour && !format) return

    subscription.current = observable.subscribe((newValue) => {
      if (!format) return setV(newValue)

      setV(format(_observable))
    })

    return () => subscription.current && subscription.current.unsubscribe()
  }, [observable])

  const setValue = useCallback(
    (value) => {
      if (!observable) return
      observable.next(value)
    },
    [observable]
  )

  return [v, setValue]
}
