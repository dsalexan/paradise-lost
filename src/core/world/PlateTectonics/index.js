import { flatten, get, range, at, sample as _sample, set, sortBy, zip, debounce as _debounce } from 'lodash'
import { set as fp_set } from 'lodash/fp'
import { v4 as uuid } from 'uuid'

import seedrandom from 'seedrandom'
import chroma from 'chroma-js'

import World from '../World'
import Renderer from './Renderer'

import sample from '../../../lib/sample'
import { BehaviorSubject, interval, merge } from 'rxjs'

import { debounce } from 'rxjs/operators'

function PERFORMANCE() {
  return JSON.parse(window.localStorage.getItem('store/control/performance/tectonics'))
}

class PlateTectonics {
  /**
   *
   * @param {World} world
   */
  constructor(world, { seeds, sites, visible } = {}, projector) {
    this.world = world

    this.seeds = {
      plates: seeds.plates,
      sites: seeds.sites,
    }
    this.visibility = visible

    this.sites = {
      total: sites,
      primary: new BehaviorSubject([]),
      secondary: new BehaviorSubject([]),
    }

    this.plates = new BehaviorSubject(null)
    this.plateByRegion = [] // index to return PLATE based on REGION
    this.indexByPlate = []

    // RENDER
    this.renderer = new Renderer(this, projector)

    this.subscribe()
  }

  get enabled() {
    return get(this.world, 'enabled', true)
  }

  clear() {
    this.sites.primary.next([])
    this.sites.secondary.next([])

    this.plates.next(null)
    this.plateByRegion = []
    this.indexByPlate = []
  }

  // TODO: contour
  // TODO: flood-and-fill of plates by weight (generate randomly)

  randomizeSites(force = false) {
    if (!this.enabled && !force) return

    let availableRegions = range(0, this.world.regions.length)

    if (this.world.regions.length < this.sites.total.primary.value) return
    if (this.sites.total.primary.value <= 0) return

    const _primary = sample(availableRegions, this.sites.total.primary.value, {
      seed: this.seeds.sites.value,
    })
    availableRegions = _primary.remaining

    this.sites.primary.next(_primary.result)
  }

  generatePlates(force) {
    if (!this.enabled && !force) return

    const seed = this.seeds.plates.value
    const regions = this.world.regions

    const rng = seedrandom(seed)

    // index to correlate PLATE to insertion index
    let indexByPlate = []

    // index do correlate REGION to PLATE
    let r_plate = new Int32Array(regions.length)
    r_plate.fill(-1)

    let plate_r = this.sites.primary.value
    let queue = Array.from(plate_r)
    // site is parte of plate
    queue.map((r, i) => {
      r_plate[r] = r
      indexByPlate[r] = i
    })
    for (let r of queue) {
      r_plate[r] = r
    }

    let out_r = []

    /* In Breadth First Search (BFS) the queue will be all elements in
       queue[queue_out ... queue.length-1]. Pushing onto the queue
       adds an element to the end, increasing queue.length. Popping
       from the queue removes an element from the beginning by
       increasing queue_out.

       To add variety, use a random search instead of a breadth first
       search. The frontier of elements to be expanded is still
       queue[queue_out ... queue.length-1], but pick a random element
       to pop instead of the earliest one. Do this by swapping
       queue[pos] and queue[queue_out].
    */

    for (let queue_out = 0; queue_out < queue.length; queue_out++) {
      const frontier_regions = queue.length - queue_out
      let randomly_selected_regions = (rng.quick() * frontier_regions) | 0

      // randomly_selected_regions = (Store.stats.random.value * frontier_regions) | 0

      let pos = queue_out + randomly_selected_regions
      let current_r = queue[pos]
      queue[pos] = queue[queue_out]

      if (current_r !== undefined) {
        // out_r = this.world.neighborhood({ region: current_r })
        // this.world.mesh.value.r_circulate_r(out_r, current_r)
        const neighborhood = regions[current_r].properties.neighbours

        // eslint-disable-next-line max-depth
        for (let neighbor_r of neighborhood) {
          // eslint-disable-next-line max-depth
          if (r_plate[neighbor_r] === -1) {
            r_plate[neighbor_r] = r_plate[current_r]
            queue.push(neighbor_r)
          }
        }
      }
    }

    // TODO: Assign a random movement vector for each plate
    let plate_vec = []
    // for (let center_r of plate_r) {
    //   let neighbor_r = mesh.r_circulate_r([], center_r)[0]

    //   let p0 = r_xyz.slice(3 * center_r, 3 * center_r + 3),
    //     p1 = r_xyz.slice(3 * neighbor_r, 3 * neighbor_r + 3)

    //   plate_vec[center_r] = vec3.normalize([], vec3.subtract([], p1, p0))
    // }

    this.plateByRegion = r_plate
    this.indexByPlate = indexByPlate
    this.plates.next(plate_r)

    console.log({ plates: plate_r, plateByRegion: r_plate, plate_vec, indexByPlate })
  }

  generate(force = false) {
    this.generatePlates(force)
    // TODO: generate litosphere
  }

  subscribe() {
    // UPDATE SITES -> GENERATE PLATES
    merge(this.sites.primary, this.sites.secondary)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        if (!this.world.tesselation || !this.world.spherical.length) return

        this.generate() // max 7ms
      })

    // UPDATE PLATES -> UPDATE COLOR INDEX AT WORLD
    merge(this.plates)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        if (!this.plates.value) return

        const numPlates = this.plates.value.length

        const _colors = []
        const regionColorByPlate = (i) => {
          const plate = this.plateByRegion[i]
          if (_colors[plate] === undefined) {
            _colors[plate] = chroma((this.indexByPlate[plate] / numPlates) * 360, 0.4, 0.7, 'hsl')
              .rgb()
              .map((c) => c / 255)
          }
          return _colors[plate]
        }

        this.world.colors.next(set(this.world.colors.value, 'tectonics', regionColorByPlate))
      })
  }

  render(engine) {
    this.renderer.render(engine)
  }

  save() {
    return {
      sites: {
        primary: this.sites.primary.value,
        secondary: this.sites.secondary.value,
      },
      plates: this.plates.value,
      plateByRegion: this.plateByRegion,
      indexByPlate: this.indexByPlate,
    }
  }

  load(data) {
    this.sites.primary.next(get(data, 'sites.primary', []))
    this.sites.secondary.next(get(data, 'sites.secondary', []))

    this.plates.next(get(data, 'plates', []))
    this.plateByRegion = get(data, 'plateByRegion', [])
    this.indexByPlate = get(data, 'indexByPlate', [])

    // this.generate(true)
  }
}

export default PlateTectonics
