import { flatMap, toPairs } from 'lodash'
import { isObservable } from 'rxjs'

export default function toPairsDeepObservable(obj, pk = []) {
  return flatMap(toPairs(obj), ([k, v]) =>
    !isObservable(v) ? toPairsDeepObservable(v, [...pk, k]) : [[[...pk, k].join('.'), v]]
  )
}
