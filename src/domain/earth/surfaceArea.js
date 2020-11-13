import axios from 'axios'
import { isEmpty, sortBy } from 'lodash'
import { useEffect, useMemo, useState } from 'react'

import { BehaviorSubject } from 'rxjs'

import csv from '../../lib/csv'
import StorableSubject from '../../lib/rxjs/StorableSubject'

async function surface_area() {
  const file = await axios.get('/countries_surface_area.csv')

  const array = csv(file.data, ',')
  const [header, ...rows] = array.slice(4)

  const columns = header
    .map((name, index) => [name, index])
    .filter(([name]) => ['Country Name', '2018'].includes(name))
    .map(([name, index]) => index)

  const subset = rows
    .map((row) => {
      const newRow = row.filter((_, index) => columns.includes(index))
      newRow[1] = parseFloat(newRow[1])
      return newRow
    })
    .filter(([name, area]) => !isEmpty(name) && !isNaN(area))

  const sortedSubset = sortBy(subset, ([name, area]) => area)

  return sortedSubset
}

export default function useSurfaceArea() {
  const observable = useMemo(() => new BehaviorSubject(null), [])

  useEffect(() => {
    let isSubscribed = true

    surface_area().then((list) => isSubscribed && observable.next(list))

    return () => (isSubscribed = false)
  }, [observable])

  return observable
}
