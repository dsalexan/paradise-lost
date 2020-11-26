/* eslint-disable camelcase */
/* eslint-disable max-depth */
import { at, flatten, get, invert, last, sortBy, sum, zip } from 'lodash'
import { BehaviorSubject, merge, interval } from 'rxjs'
import { debounce } from 'rxjs/operators'
import { subscribeOn } from 'rxjs/operators'

import chroma from 'chroma-js'

import * as THREE from 'three'
import { set } from 'lodash/fp'

function PERFORMANCE(override = true) {
  return override && JSON.parse(window.localStorage.getItem('store/control/performance'))
}

export default class Renderer {
  constructor(tectonics, projector) {
    this.tectonics = tectonics
    this.projector = projector

    this.cloudSiteGeometry = new BehaviorSubject(null)
    this.cloudSiteMesh = null
  }

  get world() {
    return this.tectonics.world
  }

  buildCloudSiteGeometry() {
    const sites = [...this.tectonics.sites.primary.value, ...this.tectonics.sites.secondary.value]
    const radius = this.world.radius.value * this.projector.radius

    if (!sites.length) return this.cloudSiteGeometry.next(null)

    PERFORMANCE() && console.time('World/Renderer/buildCloudSiteGeometry') // COMMENT
    const vertices = at(this.world.spherical, sites)

    const buffer = []
    for (let i = 0; i < vertices.length; i++) {
      const p = this.projector.project(vertices[i])
      buffer.push(p.x * radius, p.y * radius, p.z * radius + 1)
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
  buildCloudSiteMesh({ color = 0xff0000 } = {}) {
    if (!this.cloudSiteGeometry.value || !this.tectonics.visibility.cloud.value) return (this.cloudSiteMesh = null)

    PERFORMANCE() && console.time('World/Renderer/buildCloudSiteMesh') // COMMENT
    const size = this.projector.gizmoSize.value * this.projector.relativeSize

    const cloud = new THREE.Points(
      this.cloudSiteGeometry.value,
      new THREE.PointsMaterial({ color, size, alphaTest: 0.5 })
    )
    this.cloudSiteMesh = cloud
    PERFORMANCE() && console.timeEnd('World/Renderer/buildCloudSiteMesh') // COMMENT
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
    this.tectonics.visibility.cloud.subscribe((visible) =>
      helper_visibilityMesh(this.cloudSiteMesh, visible, this.buildCloudSiteGeometry)
    )
    this.cloudSiteGeometry.subscribe((geometry) => {
      const visible = this.tectonics.visibility.cloud.value

      const shouldRemove = !visible && o.removeOnHide.value

      engine.scene.remove(this.cloudSiteMesh)

      if (!geometry) return
      if (shouldRemove) this.cloudSiteGeometry.next(null)

      this.buildCloudSiteMesh()
      const mesh = this.cloudSiteMesh
      if (mesh) {
        mesh.visible = visible
        // engine.scene.add(this.cloudSiteMesh)
      }
    })
  }

  subscribe(engine) {
    const o = engine.observables

    merge(this.tectonics.sites.primary, this.tectonics.sites.secondary, this.projector.gizmoSize, this.projector.type)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        if (!this.tectonics.visibility.cloud.value && o.removeOnHide.value) return

        this.buildCloudSiteGeometry() // after change, rebuild sphere base geometry
      })

    // merge(this.world.radius, this.world._tesselation)
    //   .pipe(debounce(() => interval(50)))
    //   .subscribe(() => {
    //     const tesselation = this.world._tesselation.value
    //     const radius = this.world.radius.value

    //     if (!tesselation) return
    //     if (!(!this.world.visibility.centers.value && o.removeOnHide.value)) this.buildTesselatedCloudCentersGeometry()
    //     if (!(!this.world.visibility.regions.value && o.removeOnHide.value)) this.buildTesselatedSphereGeometry()
    //   })
  }
}
