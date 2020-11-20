import { at, get } from 'lodash'
import * as THREE from 'three'
import * as d3 from 'd3'
import Stats from 'stats.js'

import { merge, interval } from 'rxjs'
import { debounce } from 'rxjs/operators'

import CameraController from './CameraController'

function statValue(string) {
  return ['FPS', 'ms', 'MB'].findIndex((v) => v === string)
}

class Three {
  constructor(observables = {}) {
    this.observables = observables

    // CANVAS
    this.canvas = document.getElementById('three')
    const width = window.innerWidth
    const height = window.innerHeight

    // SCENE
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x222222)

    // CAMERA
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 30000)
    // camera.position.set(0, 0, 100)
    this.camera.position.set(0, 100, 0)
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))

    this.camera.updateProjectionMatrix()

    // RENDERER
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      // antialias: false,
      // alpha: false
    })
    this.renderer.setSize(width, height)

    // CAMERA CONTROLS
    this.controls = new CameraController(this.camera, this.renderer.domElement)

    // CLOCK
    this.clock = new THREE.Clock()

    // Setup stats.js
    this.stats = new Stats()
    this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    this.stats.dom.style.cssText = 'position: fixed; right: 0; bottom: 0; z-index: 500;'
    document.body.appendChild(this.stats.dom)
  }

  watch(paths = []) {
    const observables = at(this.observables ?? {}, paths)
    if (observables.length === 0) return { subscribe: () => {} }

    return merge(...observables).pipe(debounce(() => interval(50)))
  }

  // NOTE: Level of detail https://threejs.org/examples/webgl_lod.html
  init() {
    this.subscribe()

    // const grid = new THREE.PolarGridHelper(10, 8, 10, 10 * 8)
    // grid._name = 'grid'
    // this.scene.add(grid)

    // The X axis is red. The Y axis is green. The Z axis is blue.
    const axesHelper = new THREE.AxesHelper(10)
    this.scene.add(axesHelper)

    var radius = 10
    var latSegments = 18 // 10° increments
    var longSegments = 36 // 10° increments

    var geometry = new THREE.SphereBufferGeometry(radius, longSegments, latSegments)
    var material = new THREE.MeshBasicMaterial({
      color: 0x888888,
      wireframe: true,
    })

    var sphere = new THREE.Mesh(geometry, material)
    this.scene.add(sphere)
  }

  subscribe() {
    const { fog, background, stats } = this.observables

    // merge([fog.color, fog.near, fog.far])
    //   .pipe(debounce(() => interval(50)))
    //   .subscribe(() => {
    //     this.scene.fog = new THREE.Fog(fog.color.value, fog.near.value, fog.far.value)
    //   })

    background.subscribe((bg) => (this.scene.background = new THREE.Color(bg)))
  }
}

export default Three
