import { range } from 'lodash'
import seedrandom from 'seedrandom'

export function fibonacci(N, jitter, seed) {
  const rng = seedrandom(seed)

  const cartesian = []
  const spherical = []

  const random = range(0, N).map((i) => ({
    ϕ: rng.quick() * 2 - 1,
    θ: rng.quick() * 2 - 1,
  }))

  let offset = 2.0 / N
  let increment = Math.PI * (3.0 - Math.sqrt(5.0))
  let s = 3.6 / Math.sqrt(N)

  let h = 1.0 - offset / 2.0
  for (let i = 0; i < N; i++, h -= offset) {
    let k = i + 0.5
    let r = Math.sqrt(1.0 - h * h)

    let ϕ = Math.acos(1.0 - (2.0 * k) / N) // lat
    let θ = Math.PI * (1 + Math.sqrt(5)) * k // lon

    // jiterring stuff
    let latDecr = Math.max(-1, h - (offset * 2 * Math.PI * r) / s) // [-1, z - 2*PI*dz*r/s]

    ϕ += random[i].ϕ * jitter * s
    θ += random[i].θ * jitter * s

    let x = Math.cos(θ) * Math.sin(ϕ)
    let y = Math.sin(θ) * Math.sin(ϕ)
    let z = Math.cos(ϕ)

    cartesian.push({ x, y, z })
    spherical.push({ ϕ: ϕ % (Math.PI * 2), θ: θ % (Math.PI * 2), r: 1 })
  }

  return { cartesian, spherical }
}

export default { fibonacci }
