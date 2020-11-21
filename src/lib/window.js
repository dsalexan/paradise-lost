import { useMemo } from 'react'

export default function useWindow(name) {
  useMemo(() => {
    return window[name]
  })
}
