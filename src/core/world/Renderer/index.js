/* eslint-disable camelcase */
/* eslint-disable max-depth */
import { flatten, get, invert, last, sortBy, sum, zip } from 'lodash'
import { BehaviorSubject, merge, interval } from 'rxjs'
import { debounce } from 'rxjs/operators'
import { subscribeOn } from 'rxjs/operators'

import * as THREE from 'three'
import { ConvexHull } from '../../three/math/ConvexHull'
import { ConvexBufferGeometry } from '../../three/geometries/ConvexBufferGeometry'
import chroma from 'chroma-js'
import { geoVoronoi } from '../../../lib/d3-geo-voronoi'

function PERFORMANCE() {
  return JSON.parse(window.localStorage.getItem('store/control/performance/world'))
}

// chroma(i % 360, 0.4, 0.7, 'hsl').hex()
// function color(r) {
//   const rgb = chroma(r % 360, 0.4, 0.7, 'hsl').rgb()

//   return rgb.map((c) => parseInt(c, 16) / 255)
// }
let _randomColor = []
function color(index) {
  if (!_randomColor[index]) {
    _randomColor[index] = [0.5 + Math.random() * 0.5, 0.6 + Math.random() * 0.3, 0.5 + Math.random() * 0.5]
  }
  return _randomColor[index]
}

export default class Renderer {
  constructor(world, projector) {
    this.world = world
    this.projector = projector

    this.cloudSiteGeometry = new BehaviorSubject(null)
    this.cloudSiteMesh = null

    this.tesselatedCloudCentersGeometry = new BehaviorSubject(null)
    this.tesselatedCloudCentersMesh = null
    this.tesselatedSphereGeometry = new BehaviorSubject(null)
    this.tesselatedSphereMesh = null
  }

  buildCloudSiteGeometry() {
    const vertices = this.world.cartesian
    const radius = this.world.radius.value

    if (!vertices) return this.cloudSiteGeometry.next(null)

    PERFORMANCE() && console.time('World/Renderer/buildCloudSiteGeometry') // COMMENT
    const buffer = []
    for (let i = 0; i < vertices.length; i++) {
      const p = vertices[i]
      buffer.push(p.x * radius, p.y * radius, p.z * radius)
    }

    var geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer), 3))
    // if (triangles) geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))

    // if (triangles) geometry.setIndex(Array.from(triangles)) // add three.js index to the existing geometry
    geometry.computeVertexNormals()
    PERFORMANCE() && console.timeEnd('World/Renderer/buildCloudSiteGeometry') // COMMENT

    this.cloudSiteGeometry.next(geometry)
  }

  // 0x99ccff
  buildCloudSiteMesh({ color = 0x000000 } = {}) {
    if (!this.cloudSiteGeometry.value || !this.world.visibility.cloud.value) return (this.cloudSiteMesh = null)

    PERFORMANCE() && console.time('World/Renderer/buildCloudSiteMesh') // COMMENT
    const size = this.projector.gizmoSize.value

    const cloud = new THREE.Points(
      this.cloudSiteGeometry.value,
      new THREE.PointsMaterial({ color, size, alphaTest: 0.5 })
    )
    this.cloudSiteMesh = cloud
    PERFORMANCE() && console.timeEnd('World/Renderer/buildCloudSiteMesh') // COMMENT
  }

  buildTesselatedCloudCentersGeometry() {
    const toRAD = Math.PI / 180

    const tesselation = this.world.tesselation
    const radius = this.world.radius.value
    if (!tesselation) return

    PERFORMANCE() && console.time('World/Renderer/buildTesselatedCloudCentersGeometry') // COMMENT
    const size = 3 * tesselation.delaunay.centers.length
    const centers = new Float32Array(size)
    let index = 0
    for (let i = 0; i < tesselation.delaunay.centers.length; i++) {
      const center = tesselation.delaunay.centers[i]

      const { x, y, z } = this.projector.sphericalToCartesian({
        ϕ: (center[1] + 90) * toRAD,
        θ: center[0] * toRAD,
      })

      centers[index++] = x * radius
      centers[index++] = y * radius
      centers[index++] = z * radius
    }

    var geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(centers), 3))
    PERFORMANCE() && console.timeEnd('World/Renderer/buildTesselatedCloudCentersGeometry') // COMMENT

    this.tesselatedCloudCentersGeometry.next(geometry)
  }

  buildTesselatedCloudCentersMesh({ color = 0x99ccff } = {}) {
    if (!this.tesselatedCloudCentersGeometry.value || !this.world.visibility.centers.value)
      return (this.tesselatedCloudCentersMesh = null)

    PERFORMANCE() && console.time('World/Renderer/buildTesselatedCloudCentersMesh') // COMMENT
    const size = this.projector.gizmoSize.value

    const cloud = new THREE.Points(
      this.tesselatedCloudCentersGeometry.value,
      new THREE.PointsMaterial({ color, size, alphaTest: 0.5 })
    )
    this.tesselatedCloudCentersMesh = cloud
    PERFORMANCE() && console.timeEnd('World/Renderer/buildTesselatedCloudCentersMesh') // COMMENT
  }

  buildTesselatedSphereGeometry() {
    const toRAD = Math.PI / 180

    const tesselation = this.world.tesselation
    const centers = get(this.world.tesselation, 'delaunay.centers')
    const radius = this.world.radius.value
    if (!tesselation) return

    const SITES = tesselation.valid
    const POLYGONS = tesselation.delaunay.polygons
    const colorScheme = get(this.world.colors.value, this.world.visibility.color.value, null) || color
    console.log('color scheme', this.world.colors.value, this.world.visibility.color.value)

    PERFORMANCE() && console.time('World/Renderer/buildTesselatedSphereGeometry') // COMMENT

    let A1 = 0,
      A2 = 0,
      A3 = 0,
      A4 = 0,
      A5 = 0,
      A6 = 0,
      A7 = 0,
      A8 = 0

    // console.time('    buildTesselatedSphereGeometry/calculate ArraySize') // COMMENT MANUAL
    const size = 3 * 3 * sum(flatten(POLYGONS.map((p) => p.length)))
    let vertices = new Float32Array(size),
      colors = new Float32Array(size),
      vs = [],
      cs = []
    // console.timeEnd('    buildTesselatedSphereGeometry/calculate ArraySize') // COMMENT MANUAL

    let vertices_index = 0,
      colors_index = 0

    POLYGONS.map((ts, r) => {
      // const a2 = performance.now() // COMMENT MANUAL
      // let sphericalInDegree_OG = ts.map((index) => this.world.tesselation.delaunay.centers[index])
      // sphericalInDegree_OG = [...sortBy(sphericalInDegree_OG, (_, i) => -i), last(sphericalInDegree_OG)]

      const sphericalInDegree = []
      for (let i = ts.length - 1; i >= 0; i--) {
        sphericalInDegree.push(centers[ts[i]])
      }
      sphericalInDegree.push(sphericalInDegree[0])
      // A2 += performance.now() - a2 // COMMENT MANUAL

      // const a3 = performance.now() // COMMENT MANUAL
      // const trianglesSphericalInDegree = flatten(
      //   zip(sphericalInDegree.slice(0, -1), sphericalInDegree.slice(1)).map(([a, b]) => [SITES[r], b, a])
      // )
      // TODO: decrease execution of 600~700ms (with 400k)
      const trianglesSphericalInDegree = []

      for (let i = 0; i < sphericalInDegree.length - 1; i++) {
        trianglesSphericalInDegree.push(...[SITES[r], sphericalInDegree[i + 1], sphericalInDegree[i]])
      }
      // A3 += performance.now() - a3 // COMMENT MANUAL

      // const a4 = performance.now() // COMMENT MANUAL
      // TODO: remake delaunay shit to not need this degree shit
      const cartesian = []
      for (let i = 0; i < trianglesSphericalInDegree.length; i++) {
        const [θ, ϕ] = trianglesSphericalInDegree[i]
        cartesian.push(
          this.projector.sphericalToCartesian({
            ϕ: (ϕ + 90) * toRAD,
            θ: θ * toRAD,
          })
        )
      }

      // const spherical = trianglesSphericalInDegree.map(([θ, ϕ]) => ({
      //   ϕ: (ϕ + 90) * toRAD,
      //   θ: θ * toRAD,
      // }))

      // const cartesian = spherical.map(({ θ, ϕ }) => this.projector.sphericalToCartesian({ ϕ, θ }))

      // A4 += performance.now() - a4 // COMMENT MANUAL

      // const a1 = performance.now() // COMMENT MANUAL
      // vs.push(...flatten(cartesian.map(({ x, y, z }) => [x, y, z])))
      // cs.push(...flatten(cartesian.map(() => color([r, SITES.length]))))

      for (let i = 0; i < cartesian.length; i++) {
        // vertices.push(cartesian[i].x, cartesian[i].y, cartesian[i].z)
        // colors.push(color(r))
        vertices[vertices_index++] = cartesian[i].x * radius
        vertices[vertices_index++] = cartesian[i].y * radius
        vertices[vertices_index++] = cartesian[i].z * radius

        const c = colorScheme(r)
        colors[colors_index++] = c[0]
        colors[colors_index++] = c[1]
        colors[colors_index++] = c[2]
      }
      // A1 += performance.now() - a1 // COMMENT MANUAL
    })

    // console.log('    buildTesselatedSphereGeometry/indexes in polygon -> centers', A2) // COMMENT MANUAL
    // console.log('    buildTesselatedSphereGeometry/zip mess to get duples', A3) // COMMENT MANUAL
    // console.log('    buildTesselatedSphereGeometry/d3 spherical => cartesian', A4) // COMMENT MANUAL
    // console.log('    buildTesselatedSphereGeometry/push to flat array', A1) // COMMENT MANUAL

    // vertices = new Float32Array(vs)
    // colors = new Float32Array(cs)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    // geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

    PERFORMANCE() && console.timeEnd('World/Renderer/buildTesselatedSphereGeometry') // COMMENT
    // geometry.computeVertexNormals()

    this.tesselatedSphereGeometry.next(geometry)
  }

  buildTesselatedSphereMesh() {
    const mesh = new THREE.Mesh(
      this.tesselatedSphereGeometry.value,
      new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, wireframe: false }) //vertexColors: THREE.VertexColors
    )

    this.tesselatedSphereMesh = mesh
  }

  render(engine) {
    this.subscribe(engine)

    const self = this
    const o = engine.observables
    const helper_visibilityMesh = (mesh, visible, buildFunction) => {
      if (o.removeOnHide.value) {
        if (!visible) {
          engine.scene.remove(mesh)
          mesh = null
        } else buildFunction.call(self)
      }

      if (mesh) mesh.visible = visible
    }

    // CLOUD SITE
    this.world.visibility.cloud.subscribe((visible) =>
      helper_visibilityMesh(this.cloudSiteMesh, visible, this.buildCloudSiteGeometry)
    )
    this.cloudSiteGeometry.subscribe((geometry) => {
      const visible = this.world.visibility.cloud.value

      const shouldRemove = !visible && o.removeOnHide.value

      engine.scene.remove(this.cloudSiteMesh)

      if (!geometry) return
      if (shouldRemove) this.cloudSiteGeometry.next(null)

      this.buildCloudSiteMesh()
      const mesh = this.cloudSiteMesh
      if (mesh) {
        mesh.visible = visible
        engine.scene.add(this.cloudSiteMesh)
      }
    })

    // TESSELATION CENTERS CLOUD
    this.world.visibility.centers.subscribe((visible) =>
      helper_visibilityMesh(this.tesselatedCloudCentersMesh, visible, this.buildTesselatedCloudCentersGeometry)
    )
    this.tesselatedCloudCentersGeometry.subscribe((geometry) => {
      const visible = this.world.visibility.centers.value

      const shouldRemove = !visible && o.removeOnHide.value

      engine.scene.remove(this.tesselatedCloudCentersMesh)
      if (!geometry) return
      if (shouldRemove) this.tesselatedCloudCentersGeometry.next(null)

      this.buildTesselatedCloudCentersMesh()
      const mesh = this.tesselatedCloudCentersMesh
      if (mesh) {
        mesh.visible = visible
        engine.scene.add(mesh)
      }
    })

    // TESSELATION POLYHEADRON
    this.world.visibility.regions.subscribe((visible) =>
      helper_visibilityMesh(this.tesselatedSphereMesh, visible, this.buildTesselatedSphereGeometry)
    )
    this.tesselatedSphereGeometry.subscribe((geometry) => {
      const visible = this.world.visibility.regions.value

      const shouldRemove = !visible && o.removeOnHide.value

      engine.scene.remove(this.tesselatedSphereMesh)
      if (!geometry) return
      if (shouldRemove) this.tesselatedSphereGeometry.next(null)

      this.buildTesselatedSphereMesh()
      const mesh = this.tesselatedSphereMesh
      if (mesh) {
        mesh.visible = visible
        engine.scene.add(mesh)
      }
    })
  }

  subscribe(engine) {
    const o = engine.observables

    // filling buffer vertices [{x, y, z}, {x, y, z}, {x, y, z}] -> (X, Y, Z, Z, Y, Z, ...., Y, Z)
    merge(this.world._cartesian, this.world.radius, this.projector.gizmoSize)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        if (!this.world.visibility.cloud.value && o.removeOnHide.value) return

        this.buildCloudSiteGeometry() // after change, rebuild sphere base geometry
      })

    merge(this.world.radius, this.world._tesselation)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        const tesselation = this.world._tesselation.value

        if (!tesselation) return
        if (!(!this.world.visibility.centers.value && o.removeOnHide.value)) this.buildTesselatedCloudCentersGeometry()
      })

    merge(this.world.radius, this.world._tesselation, this.world.visibility.color, this.world.colors)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        const tesselation = this.world._tesselation.value

        if (!tesselation) return
        if (!(!this.world.visibility.regions.value && o.removeOnHide.value)) this.buildTesselatedSphereGeometry()
      })
  }
}
