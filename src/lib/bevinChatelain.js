/* eslint-disable max-depth */
export function transformLongitude(P, Q) {
  const RADIANS = Math.PI / 180

  if (P.λ === 90) return Q.ϕ
  else {
    const Qϕ = Q.ϕ * RADIANS
    const Pϕ = P.ϕ * RADIANS
    const Qλ = Q.λ * RADIANS
    const Pλ = P.λ * RADIANS

    const t = Math.sin(Qϕ - Pϕ) * Math.cos(Qλ)
    const b = Math.sin(Qλ) * Math.cos(Pλ) - Math.cos(Qλ) * Math.sin(Pλ) * Math.cos(Qϕ - Pϕ)
    return Math.atan2(t, b) * (180 / Math.PI)
  }
}

export function side(Cϕ, Dϕ) {
  let dϕ = Dϕ - Cϕ
  if (dϕ >= 180) dϕ -= 360
  else if (dϕ <= -180) dϕ += 360

  if (dϕ > 0 && dϕ !== 180) return -1
  // D is WEST of C
  else if (dϕ < 0 && dϕ !== -180) return +1
  // D is EAST of C
  else return 0 // D north/south of C
}

/**
 *
 * @param {{λ,ϕ}[]} V polygon points array {λ,ϕ}[]
 * @param {{λ,ϕ}} X internal point {λ,ϕ}
 * @param {{λ,ϕ}} P unknown point {λ,ϕ}
 */
export function isInsidePolygon(V, X, P) {
  // λ lat
  // ϕ lon

  // =============
  // DefSPolyBndry
  // =============

  const tVϕ = []
  for (let i = 0; i < V.length; i++) {
    tVϕ.push(transformLongitude(X, V[i]))

    const prev = i > 0 ? i - 1 : V.length - 1

    if (V[i].λ === V[prev].λ && V[i].ϕ === V[prev].ϕ) {
      console.log('There are 2 equal vertices inside polygon', { i, prev })
      return 3
    }

    if (tVϕ[i] === tVϕ[prev]) {
      console.log(
        'There are 2 vertices with the same great circle',
        { i, prev },
        { tVϕ_i: tVϕ[i], tVϕ_prev: tVϕ[prev] }
      )
      return 3
    }

    if (V[i].λ === -V[prev].λ) {
      let dϕ = V[i].ϕ - V[prev].ϕ
      if (dϕ > 180) dϕ -= 360
      else if (dϕ < -180) dϕ -= 360 // TODO: isso ta certo????? tava dϕ -= 360

      if (dϕ === 180 || dϕ === -180) {
        console.log('There are 2 antipodal vertices inside polygon', { i, prev }, { i: V[i], prev: V[prev] })
        return 3
      }
    }
  }

  // =============
  // LctPtRelBndry
  // =============

  // 0  P is outside S
  // 1  P is inside S
  // 2  P on boundary of S
  // 3  implies user error (P is antipodal to X)

  if (P.λ === X.λ) {
    let dϕ = P.ϕ - X.ϕ

    if (dϕ < -180) dϕ += 360
    else if (dϕ > 180) dϕ -= 360

    if (dϕ === 180 || dϕ === -180) {
      console.log('P is antipodal to X')
      return 3
    }
  }

  let icross = 0

  if (P.λ === X.λ && P.ϕ === X.ϕ) return 1 // P === X, P is inside S daaahn

  const tPϕ = transformLongitude(X, P)

  for (let i = 0; i < V.length; i++) {
    const next = (i + 1) % V.length

    const A = V[i]
    const tAϕ = tVϕ[i]

    const B = V[next]
    const tBϕ = tVϕ[next]

    let isStrike = 0
    if (tPϕ === tAϕ) isStrike = 1
    else {
      const ABside = side(tAϕ, tBϕ)
      const APside = side(tAϕ, tPϕ)
      const PBside = side(tPϕ, tBϕ)

      if (APside === ABside && PBside === ABside) isStrike = 1
    }

    if (isStrike === 1) {
      if (P.λ === A.λ && P.ϕ === A.ϕ) return 2 // P lies on a vertex of S

      const t2Xϕ = transformLongitude(A, X)
      const t2Bϕ = transformLongitude(A, B)
      const t2Pϕ = transformLongitude(A, P)

      if (t2Pϕ === t2Bϕ) return 2
      /// P lies on side of S
      else {
        const BXside = side(t2Bϕ, t2Xϕ)
        const BPside = side(t2Bϕ, t2Pϕ)

        if (BXside === -BPside) icross++
      }
    }
  }

  if (icross % 2 === 0) return 1 // P is inside S

  return 0 // P is outside S
}
