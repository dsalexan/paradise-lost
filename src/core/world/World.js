import { merge, interval, BehaviorSubject } from 'rxjs'
import { debounce } from 'rxjs/operators'

import Renderer from './Renderer'

import Sphere from './Sphere'

import { geoVoronoi } from '../../lib/d3-geo-voronoi'
import { get } from 'lodash'

function PERFORMANCE() {
  return JSON.parse(window.localStorage.getItem('store/control/performance'))
}

class World {
  constructor(N, radius, { jitter, tesselation = {}, seed, visibility, projector } = {}) {
    // BASE SPHERE
    this.N = N
    this.radius = radius

    this.jitter = jitter
    this.centerMethod = tesselation.center

    this.seed = seed
    this.visibility = visibility

    this.enabled = true

    this._spherical = new BehaviorSubject(null)
    this._cartesian = new BehaviorSubject(null)
    this._tesselation = new BehaviorSubject(null)

    // render
    this.colors = new BehaviorSubject({
      tectonics: null,
    })
    this.renderer = new Renderer(this, projector)
  }

  get spherical() {
    return this._spherical.value
  }
  get cartesian() {
    return this._cartesian.value
  }

  get tesselation() {
    return this._tesselation.value
  }

  clear() {
    this._vertices.next(null)
    this._tesselation.next(null)
    console.log('CLEAR WORLD')
  }

  buildSphere(force = false) {
    if (!this.enabled && !force) return

    PERFORMANCE() && console.time('World/buildSphere') // COMMENT

    const { cartesian, spherical } = Sphere.fibonacci(this.N.value, this.jitter.value, this.seed.value)
    this._spherical.next(spherical)
    this._cartesian.next(cartesian)
    // cartesian.then((_cartesian) => this._cartesian.next(_cartesian)) // this._cartesian.next(cartesian)

    PERFORMANCE() && console.timeEnd('World/buildSphere') // COMMENT
  }

  buildTesselation(force = false) {
    if (!this.enabled && !force) return

    PERFORMANCE() && console.time('World/buildTesselation') // COMMENT
    const sphericalVerticesInDegree = this.spherical.map(({ r, ϕ, θ }) => [
      (θ * 180) / Math.PI,
      ϕ * (180 / Math.PI) - 90,
    ])
    this._tesselation.next(geoVoronoi()(sphericalVerticesInDegree, { center: this.centerMethod.value }))
    PERFORMANCE() && console.timeEnd('World/buildTesselation') // COMMENT
  }

  build(force = false) {
    this.buildSphere(force)
    this.buildTesselation(force)
  }

  render(engine) {
    this.renderer.render(engine)
  }

  save() {
    const toRAD = Math.PI / 180

    const sphericalVerticesInDegree = this.voronoi.diagram.value
      .polygons()
      .features.map((feature) => feature.properties.site)

    const spherical = sphericalVerticesInDegree.map(([θ, ϕ]) => ({
      ϕ: (ϕ + 90) * toRAD,
      θ: θ * toRAD,
    }))
    const cartesian = spherical.map(({ ϕ, θ }) => ({
      x: Math.cos(θ) * Math.sin(ϕ),
      y: Math.sin(θ) * Math.sin(ϕ),
      z: Math.cos(ϕ),
    }))

    return {
      N: this.N.value,
      radius: this.radius.value,
      jitter: this.jitter.value,

      vertices: {
        spherical,
        cartesian,
      },

      // tectonics: this.tectonics.save(), // TODO: save tectonics
    }
  }

  load(data) {
    this.enabled = false

    this.N.next(get(data, 'N', this.N.value))
    this.radius.next(get(data, 'radius', this.radius.value))
    this.jitter.next(get(data, 'jitter', this.jitter.value))

    this.vertices.next(get(data, 'vertices', null))

    this.buildVoronoi(true)

    // this.tectonics.load(get(data, 'tectonics')) // TODO: load tectonics

    setTimeout(() => {
      this.enabled = true
    }, 500)
  }
}

export default World
