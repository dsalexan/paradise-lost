/* eslint-disable camelcase */
import { map, reduce } from 'lodash'

// eslint-disable-next-line max-params
function findClosest_recursive(array, target, iteratee = (x) => x, _start, _end) {
  if (_start > _end) return array[_end]

  const mid = Math.floor((_start + _end) / 2)

  if (iteratee(array[mid]) === target) return array[mid]

  if (iteratee(array[mid]) > target) return findClosest_recursive(array, target, iteratee, _start, mid - 1)
  else return findClosest_recursive(array, target, iteratee, mid + 1, _end)
}

export default function findClosest(array, target, iteratee = (x) => x) {
  return findClosest_recursive(array, target, iteratee, 0, array.length - 1)
}
