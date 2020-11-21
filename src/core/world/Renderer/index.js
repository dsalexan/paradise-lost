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
  return JSON.parse(window.localStorage.getItem('store/control/performance'))
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

    this.tesselationCloudCentersGeometry = new BehaviorSubject(null)
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

  buildCloudSiteMesh({ color = 0x99ccff } = {}) {
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

  buildTesselatedSphereGeometry() {
    const toRAD = Math.PI / 180

    const tesselation = this.world.tesselation

    const SITES = tesselation.valid
    const POLYGONS = tesselation.delaunay.polygons

    PERFORMANCE() && console.time('World/Renderer/buildTesselatedSphereGeometry') // COMMENT

    let A1 = 0,
      A2 = 0,
      A3 = 0,
      A4 = 0,
      A5 = 0,
      A6 = 0,
      A7 = 0,
      A8 = 0

    PERFORMANCE() && console.time('    buildTesselatedSphereGeometry/calculate ArraySize') // COMMENT
    const size = 3 * 3 * sum(flatten(POLYGONS.map((p) => p.length)))
    const vertices = new Float32Array(size),
      colors = new Float32Array(size)
    PERFORMANCE() && console.timeEnd('    buildTesselatedSphereGeometry/calculate ArraySize') // COMMENT

    let vertices_index = 0,
      colors_index = 0
    for (let r = 0; r < POLYGONS.length; r++) {
      const a2 = performance.now()
      const sphericalInDegree = []
      for (let i = 0; i < POLYGONS[r].length; i++) {
        sphericalInDegree.push(tesselation.delaunay.centers[POLYGONS[r][i]])
      }
      sphericalInDegree.push(tesselation.delaunay.centers[POLYGONS[r][POLYGONS[r].length - 1]])

      // let sphericalInDegree = POLYGONS[r].map((index) => tesselation.delaunay.centers[index])
      // sphericalInDegree = [...sortBy(sphericalInDegree, (_, i) => -i), last(sphericalInDegree)]
      A2 += performance.now() - a2

      const a3 = performance.now()
      const trianglesSphericalInDegree = []

      for (let i = 0; i < sphericalInDegree.length - 1; i++) {
        trianglesSphericalInDegree.push([SITES[r], sphericalInDegree[i + 1], sphericalInDegree[i]])
      }

      // const trianglesSphericalInDegree = flatten(
      //   zip(sphericalInDegree.slice(0, -1), sphericalInDegree.slice(1)) //
      //     .map(([a, b]) => [SITES[r], b, a])
      // )

      A3 += performance.now() - a3

      const a4 = performance.now()
      const spherical = []
      for (let i = 0; i < trianglesSphericalInDegree.length; i++) {
        const [θ, ϕ] = trianglesSphericalInDegree[i]
        spherical.push({
          ϕ: (ϕ + 90) * toRAD,
          θ: θ * toRAD,
        })
      }

      // const spherical = trianglesSphericalInDegree.map(([θ, ϕ]) => ({
      //   ϕ: (ϕ + 90) * toRAD,
      //   θ: θ * toRAD,
      // }))
      A4 += performance.now() - a4

      const a5 = performance.now()
      const cartesian = spherical.map(({ θ, ϕ }) => this.projector.sphericalToCartesian({ ϕ, θ }))
      A5 += performance.now() - a5

      // vertices.push(...flatten(cartesian.map(({ x, y, z }) => [x, y, z])))
      // colors.push(...flatten(cartesian.map(() => color([r, SITES.length]))))

      const a1 = performance.now()
      for (let i = 0; i < cartesian.length; i++) {
        // vertices.push(cartesian[i].x, cartesian[i].y, cartesian[i].z)
        // colors.push(color(r))
        vertices[vertices_index++] = cartesian[i].x
        vertices[vertices_index++] = cartesian[i].y
        vertices[vertices_index++] = cartesian[i].z

        const c = color(r)
        colors[colors_index++] = c[0]
        colors[colors_index++] = c[1]
        colors[colors_index++] = c[2]
      }
      A1 += performance.now() - a1
    }

    console.log('    buildTesselatedSphereGeometry/indexes in polygon -> centers', A2)
    console.log('    buildTesselatedSphereGeometry/zip mess to get duples', A3)
    console.log('    buildTesselatedSphereGeometry/d3 spherical => real spherical', A4)
    console.log('    buildTesselatedSphereGeometry/spherical -> cartesian', A5)
    console.log('    buildTesselatedSphereGeometry/push to flat array', A1)

    // PERFORMANCE() && console.time('    buildTesselatedSphereGeometry/parsin float32Arrays') // COMMENT

    PERFORMANCE() && console.time('    buildTesselatedSphereGeometry/THREE.BufferGeometry') // COMMENT

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    // geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

    PERFORMANCE() && console.timeEnd('    buildTesselatedSphereGeometry/THREE.BufferGeometry') // COMMENT

    PERFORMANCE() && console.timeEnd('World/Renderer/buildTesselatedSphereGeometry') // COMMENT
    // geometry.computeVertexNormals()

    this.tesselatedSphereGeometry.next(geometry)
  }

  buildTesselatedSphereMesh() {
    const mesh = new THREE.Mesh(
      this.tesselatedSphereGeometry.value,
      new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, wireframe: false }) //
    )

    this.tesselatedSphereMesh = mesh
  }

  render(engine) {
    this.subscribe(engine)

    const o = engine.observables
    const helper_visibilityMesh = (mesh, visible) => {
      if (o.removeOnHide.value) {
        if (!visible) {
          engine.scene.remove(this.cloudSiteMesh)
          this.cloudSiteMesh = null
        } else this.buildCloudSiteGeometry()
      }

      if (this.cloudSiteMesh) this.cloudSiteMesh.visible = visible
    }

    // CLOUD SITE
    this.world.visibility.cloud.subscribe((visible) => helper_visibilityMesh(this.cloudSiteMesh, visible))
    this.cloudSiteGeometry.subscribe((geometry) => {
      const visible = this.world.visibility.cloud.value
      const mesh = this.cloudSiteMesh

      const shouldRemove = !visible && o.removeOnHide.value

      engine.scene.remove(mesh)

      if (!geometry) return
      if (shouldRemove) this.cloudSiteGeometry.next(null)

      this.buildCloudSiteMesh()
      if (mesh) {
        mesh.visible = visible
        engine.scene.add(this.cloudSiteMesh)
      }
    })

    // TESSELATION POLYHEADRON
    this.world.visibility.regions.subscribe((visible) => helper_visibilityMesh(this.tesselatedSphereMesh, visible))
    this.tesselatedSphereGeometry.subscribe((geometry) => {
      // const visible = this.world.visibility.regions.value
      // const mesh = this.tesselatedSphereMesh
      // const shouldRemove = !visible && o.removeOnHide.value
      // engine.scene.remove(mesh)
      // if (!geometry) return
      // if (shouldRemove) this.tesselatedSphereGeometry.next(null)
      // this.buildTesselatedSphereMesh()
      // if (mesh) {
      //   this.mesh.visible = visible
      //   engine.scene.add(mesh)
      // }
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
        const radius = this.world.radius.value

        if (!tesselation) return
        if (!this.world.visibility.regions.value && o.removeOnHide.value) return

        this.buildTesselatedSphereGeometry()
      })
  }
}
