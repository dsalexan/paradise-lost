import { useRef, useCallback } from 'react'

export default function useGetLatest(obj) {
  const ref = useRef()
  ref.current = obj

  return useCallback(() => ref.current, [])
}
