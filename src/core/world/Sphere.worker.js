/* eslint-disable max-params */
import * as Comlink from 'comlink'

function calcSpherical({ i: _i, n, N, random, jitter }) {
  const spherical = []

  let s = 3.6 / Math.sqrt(N)

  for (let i = _i; i < n; i++) {
    let k = i + 0.5

    let ϕ = Math.acos(1.0 - (2.0 * k) / N) // lat
    let θ = Math.PI * (1 + Math.sqrt(5)) * k // lon

    ϕ += random[i].ϕ * jitter * s
    θ += random[i].θ * jitter * s

    spherical.push({ ϕ: ϕ % (Math.PI * 2), θ: θ % (Math.PI * 2), r: 1 })
  }

  return spherical
}

function calcCartesian({ spherical }) {
  const cartesian = []

  for (let i = 0; i < spherical.length; i++) {
    const { θ, ϕ } = spherical[i]

    let x = Math.cos(θ) * Math.sin(ϕ)
    let y = Math.sin(θ) * Math.sin(ϕ)
    let z = Math.cos(ϕ)

    cartesian.push({ x, y, z })
  }

  return cartesian
}

// self.addEventListener(
//   'message',
//   function (e) {
//     let fn = () => {}
//     if (e.data.name === 'calcSpherical') fn = calcSpherical
//     else if (e.data.name === 'calcCartesian') fn = calcCartesian

//     const result = fn(e.data.data)
//     self.postMessage(result)
//   },
//   false
// )

Comlink.expose({
  calcCartesian,
  calcSpherical,
})
