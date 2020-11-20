/* eslint-disable camelcase */
/* eslint-disable max-depth */
import { flatten, get, invert, last, sortBy, zip } from 'lodash'
import { BehaviorSubject, merge, interval } from 'rxjs'
import { debounce } from 'rxjs/operators'
import { subscribeOn } from 'rxjs/operators'

import * as THREE from 'three'
import { ConvexHull } from '../../three/math/ConvexHull'
import { ConvexBufferGeometry } from '../../three/geometries/ConvexBufferGeometry'
import chroma from 'chroma-js'

// chroma(i % 360, 0.4, 0.7, 'hsl').hex()
function color([r, total] = []) {
  const c = 0xffffff * ((r + 1) / total)
  const rgb = (color | 0)
    .toString(16)
    .padStart(6, '0')
    .match(/.{2}/g)
    .map((c) => parseInt(c, 16) / 255)

  return rgb
}

export default class Renderer {
  constructor(world, projector) {
    this.world = world
    this.projector = projector

    this.cloudSiteGeometry = new BehaviorSubject(null)
    this.cloudSiteMesh = null

    this.tesselationCloudCentersGeometry = null
    this.tesselationGeometry = null
    this.tesselationMesh = new BehaviorSubject(null)

    this.subscribe()
  }

  buildCloudSiteGeometry() {
    const vertices = get(this.world._vertices.value, 'cartesian', null)
    const radius = this.world.radius.value

    if (!vertices) return this.cloudSiteGeometry.next(null)

    console.time('World/Renderer/buildCloudSiteGeometry')
    const buffer = flatten(vertices.map((p) => [p.x * radius, p.y * radius, p.z * radius]))

    var geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer), 3))
    // if (triangles) geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))

    // if (triangles) geometry.setIndex(Array.from(triangles)) // add three.js index to the existing geometry
    geometry.computeVertexNormals()

    this.cloudSiteGeometry.next(geometry)
    console.timeEnd('World/Renderer/buildCloudSiteGeometry')
  }

  buildCloudSiteMesh({ color = 0x99ccff } = {}) {
    if (!this.cloudSiteGeometry.value || !this.world.visibility.cloud.value) return (this.cloudSiteMesh = null)

    console.time('World/Renderer/buildCloudSiteMesh')
    const size = this.projector.gizmoSize.value

    const cloud = new THREE.Points(
      this.cloudSiteGeometry.value,
      new THREE.PointsMaterial({ color, size, alphaTest: 0.5 })
    )
    this.cloudSiteMesh = cloud
    console.timeEnd('World/Renderer/buildCloudSiteMesh')
  }

  buildTesselationGeometry() {
    const toRAD = Math.PI / 180

    const SITES = this.world.tesselation.valid
    const POLYGONS = this.world.tesselation.delaunay.polygons

    const vertices = [],
      colors = []
    POLYGONS.map((ts, r) => {
      let sphericalInDegree = ts.map((index) => this.world.tesselation.delaunay.centers[index])
      sphericalInDegree = [...sortBy(sphericalInDegree, (_, i) => -i), last(sphericalInDegree)]

      const trianglesSphericalInDegree = flatten(
        zip(sphericalInDegree.slice(0, -1), sphericalInDegree.slice(1)).map(([a, b]) => [SITES[r], b, a])
      )

      const spherical = trianglesSphericalInDegree.map(([θ, ϕ]) => ({
        ϕ: (ϕ + 90) * toRAD,
        θ: θ * toRAD,
      }))
      const cartesian = spherical.map(({ θ, ϕ }) => this.projector.sphericalToCartesian({ ϕ, θ }))

      vertices.push(...flatten(cartesian.map(({ x, y, z }) => [x, y, z])))
      colors.push(...flatten(cartesian.map(() => color([r, SITES.length]))))
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))
    // geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

    // geometry.computeVertexNormals()

    this.tesselationGeometry = geometry
  }

  buildTesselatedSphere() {
    const mesh = new THREE.Mesh(
      this.tesselationGeometry,
      new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, wireframe: false }) //
    )

    this.tesselationMesh.next(mesh)
  }

  render(engine) {
    const o = engine.observables
    const helper_visibilityMesh = (mesh, visible) => {
      if (this.cloudSiteMesh) {
        if (o.removeOnHide.value) {
          if (!visible) engine.scene.remove(this.cloudSiteMesh)
          else this.buildCloudSiteGeometry()
        } else this.cloudSiteMesh.visible = visible
      }
    }

    this.world.visibility.cloud.subscribe((visible) => helper_visibilityMesh(this.cloudSiteMesh, visible))
    this.cloudSiteGeometry.subscribe(() => {
      engine.scene.remove(this.cloudSiteMesh)
      this.buildCloudSiteMesh()
      this.cloudSiteMesh && engine.scene.add(this.cloudSiteMesh)
    })
  }

  subscribe() {
    // filling buffer vertices [{x, y, z}, {x, y, z}, {x, y, z}] -> (X, Y, Z, Z, Y, Z, ...., Y, Z)
    merge(this.world._vertices, this.world.radius, this.projector.gizmoSize)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        this.buildCloudSiteGeometry() // after change, rebuild sphere base geometry
      })

    // merge(this.world.radius, this.world._tesselation)
    //   .pipe(debounce(() => interval(50)))
    //   .subscribe(() => {
    //     const tesselation = this.world._tesselation.value
    //     const radius = this.world.radius.value

    //     if (!tesselation) return

    //     this.buildTesselatedSphere()
    //   })
  }
}
