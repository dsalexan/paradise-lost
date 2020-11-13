import { localStorage as storage } from './storage'

import { useEffect, useState } from 'react'
import useHasMounted from './hasMounted'

export default function useStoredState(key, defaultValue) {
  const hasMounted = useHasMounted()

  const [value, setValue] = useState(() => {
    const stickyValue = hasMounted ? storage.get(key) : null
    return stickyValue !== null ? stickyValue : defaultValue
  })

  useEffect(() => {
    if (!hasMounted) return

    const stickyValue = storage.get(key)
    if (stickyValue !== null) setValue(stickyValue)
  }, [hasMounted])

  useEffect(() => {
    if (hasMounted) storage.set(key, value)
  }, [value])

  return [value, setValue]
}
