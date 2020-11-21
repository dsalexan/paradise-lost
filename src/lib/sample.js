import { sortBy, sortedIndex } from 'lodash'
import seedrandom from 'seedrandom'

/* eslint-disable max-depth */
export default function sample(population, k, { seed } = {}) {
  const rng = seedrandom(seed)

  /*
      Chooses k unique random elements from a population sequence or set.

      Returns a new list containing elements from the population while
      leaving the original population unchanged.  The resulting list is
      in selection order so that all sub-slices will also be valid random
      samples.  This allows raffle winners (the sample) to be partitioned
      into grand prize and second place winners (the subslices).

      Members of the population need not be hashable or unique.  If the
      population contains repeats, then each occurrence is a possible
      selection in the sample.

      To choose a sample in a range of integers, use range as an argument.
      This is especially fast and space efficient for sampling from a
      large population:   sample(range(10000000), 60)

      Sampling without replacement entails tracking either potential
      selections (the pool) in a list or previous selections in a set.

      When the number of selections is small compared to the
      population, then tracking selections is efficient, requiring
      only a small set and an occasional reselection.  For
      a larger number of selections, the pool tracking method is
      preferred since the list takes less space than the
      set and it doesn't suffer from frequent reselections.
  */

  if (!Array.isArray(population)) throw new TypeError('Population must be an array.')
  var n = population.length
  if (k < 0 || k > n) throw new RangeError('Sample larger than population or is negative')

  var remaining = Array.from(population)
  var result = new Array(k)
  var indexToRemove = new Array(k)
  var setsize = 21 // size of a small set minus size of an empty list

  if (k > 5) setsize += Math.pow(4, Math.ceil(Math.log(k * 3, 4)))

  if (n <= setsize) {
    // An n-length list is smaller than a k-length set
    var pool = population.slice()
    for (var i = 0; i < k; i++) {
      // invariant:  non-selected at [0,n-i)
      var j = (rng.quick() * (n - i)) | 0
      result[i] = pool[j]
      pool[j] = pool[n - i - 1] // move non-selected item into vacancy
    }
  } else {
    var selected = new Set()
    for (var i = 0; i < k; i++) {
      var j = (rng.quick() * n) | 0
      while (selected.has(j)) {
        j = (rng.quick() * n) | 0
      }
      selected.add(j)
      result[i] = population[j]

      const index = sortedIndex(indexToRemove, j)
      indexToRemove.splice(k - 1 - index, 0, j)
    }
  }

  indexToRemove.map((index) => {
    remaining.splice(index, 1)
  })

  return { result, remaining }
}
