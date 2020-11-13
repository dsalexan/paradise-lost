import { useCallback, useEffect, useMemo, useRef } from 'react'

export default function useStateFromObservable(observable) {
  const subscription = useRef(null)
  const valueRef = useRef(observable.value)

  useEffect(() => {
    subscription.current = observable.subscribe((newValue) => {
      console.log('SUBSCRIPTION RECEIVED NEW VALUE', newValue)
      valueRef.current = newValue
    })

    return () => subscription.current.unsubscribe()
  }, [observable])

  const value = useMemo(() => {
    console.log('VALUE REF CHANGED')
    return valueRef.current
  }, [valueRef])

  const setValue = useCallback(
    (value) => {
      console.log('SETTING NEW VALUE', value)
      observable.next(value)
    },
    [observable]
  )

  return [value, setValue]
}
