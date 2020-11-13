import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import { useStore } from '../../components/Store'

import toPairsDeepObservable from '../../lib/lodash/toPairsDeepObservable'

export default () => {
  const { control, seeds } = useStore()

  control.save.subscribe((event) => {
    const data = {
      timestamp: new Date(),
      name: control.name.value,
      world: null,
      seeds: toPairsDeepObservable(seeds)
        .filter(([k, subject]) => !['history', 'locked'].includes(k) && k.substr(0, 6) !== 'locked')
        .map(([k, subject]) => [k, subject.value]),
    }

    control.state.next(data)
  })

  return <div>Home Page</div>
}
