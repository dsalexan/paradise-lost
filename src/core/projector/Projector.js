import { isArray } from 'lodash'

export default class Projector {
  constructor({ type, gizmoSize } = {}) {
    this.type = type
    this.gizmoSize = gizmoSize
  }

  sphericalToCartesian({ r, ϕ, θ }) {
    let x = Math.cos(θ) * Math.sin(ϕ)
    let y = Math.sin(θ) * Math.sin(ϕ)
    let z = Math.cos(ϕ)

    return { x, y, z }
  }
}
