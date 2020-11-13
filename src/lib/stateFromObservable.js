import { merge } from 'rxjs'
import { get, isArray } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import BehaviourSubject from '../lib/rxjs/StorableSubject'

export default function useStateFromObservable(_observable, format) {
  const observable = useMemo(() => merge(_observable), [_observable])
  const subscription = useRef(null)
  const [v, setV] = useState(format ? format(_observable) : get(observable, 'value'))

  useEffect(() => {
    subscription.current && subscription.current.unsubscribe()
    subscription.current = null

    if (!observable) return

    const isBehaviour = observable instanceof BehaviourSubject

    if (!isBehaviour) return

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
