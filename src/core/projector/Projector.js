import * as THREE from 'three'

import { geoEquirectangular, geoOrthographic } from 'd3'
import { isArray } from 'lodash'

const DEGREE = 180 / Math.PI
export default class Projector {
  constructor({ type, gizmoSize, radius } = {}) {
    this.type = type
    this.gizmoSize = gizmoSize

    this.equirectangular = geoEquirectangular().scale(1).rotate([90, 0]).center([0, 0]).translate([0, 0])
    this.orthographic = geoOrthographic().scale(1).rotate([0, 0]).center([0, 0]).translate([0, 0])
  }

  get radius() {
    return this.type.value === 'Orthographic' ? 1.007 : 1
  }

  get relativeSize() {
    return this.type.value === 'Orthographic' ? 1 : 1 / 3
  }

  get side() {
    return this.type.value === 'Orthographic' ? THREE.FrontSide : THREE.BackSide
  }

  get y() {
    return this.type.value === 'Orthographic' ? 0 : 1
  }

  sphericalToCartesian({ r, ϕ, θ }) {
    let x = Math.cos(θ) * Math.sin(ϕ)
    let y = Math.sin(θ) * Math.sin(ϕ)
    let z = Math.cos(ϕ)

    return { x, y, z }
  }

  project(spherical) {
    // if (this.type.value === 'Orthographic') {
    return {
      ϕ: ((spherical[1] + 90) * Math.PI) / 180,
      θ: (spherical[0] * Math.PI) / 180,
    }
  }

  translateToTexture(spherical, res) {
    const inDegree = {
      θ: spherical.θ * DEGREE,
      ϕ: spherical.ϕ * DEGREE,
    }
    return {
      x: Math.floor(((inDegree.θ + 180) % 360) * (res / 100)),
      y: Math.floor(((inDegree.ϕ + 90) % 180) * (res / 100)),
    }
  }

  translateFromTexture(cartesian2d) {
    const θ = cartesian2d.x - Math.PI
    return {
      θ: θ <= 0 ? θ + Math.PI * 2 : θ,
      ϕ: cartesian2d.y,
    }
  }

  shader() {
    // position.x === ϕ
    // position.y === θ
    if (this.type.value === 'Orthographic') {
      // ([-180, 180], [-90, 90])
      return `
        vec3 spherialInRadians = spherical * RAD + vec3(0, PI / 2., 0.);

        projectedPosition = vec3(
          cos(spherialInRadians.x) * sin(spherialInRadians.y),
          cos(spherialInRadians.y) * -1.,
          sin(spherialInRadians.x) * sin(spherialInRadians.y) * -1.
        ) * radius;
      `
    } else {
      return `
        projectedPosition = vec3(
          spherical.y - PI,
          0.0,
          spherical.x - PI / 2.0
        ) * radius;
      `
    }
  }
}
