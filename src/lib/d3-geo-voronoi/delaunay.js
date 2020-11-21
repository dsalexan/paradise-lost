/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
/* eslint-disable max-depth */
//
// (c) 2019 Philippe Riviere
//
// https://github.com/Fil/
//
// This software is distributed under the terms of the MIT License

import { Delaunay } from 'd3-delaunay'
import { geoRotation, geoStereographic } from 'd3-geo'
import { extent } from 'd3-array'
import { asin, atan, atan2, cos, degrees, halfPi, max, min, pi, radians, sign, sin, sqrt, tan } from './math.js'
import {
  cartesianNormalize as normalize,
  cartesianCross as cross,
  cartesianDot as dot,
  cartesianAdd,
} from './cartesian.js'
import { cloneDeep } from 'lodash'

import * as Comlink from 'comlink'
const worker = new Worker('./worker', { name: 'worker', type: 'module' })
const delaunayWorker = Comlink.wrap(worker)

function PERFORMANCE() {
  return false && JSON.parse(window.localStorage.getItem('store/control/performance'))
}

// Converts 3D Cartesian to spherical coordinates (degrees).
function spherical(cartesian) {
  return [atan2(cartesian[1], cartesian[0]) * degrees, asin(max(-1, min(1, cartesian[2]))) * degrees]
}

// Converts spherical coordinates (degrees) to 3D Cartesian.
function cartesian(coordinates) {
  var lambda = coordinates[0] * radians,
    phi = coordinates[1] * radians,
    cosphi = cos(phi)
  return [cosphi * cos(lambda), cosphi * sin(lambda), sin(phi)]
}

// Spherical excess of a triangle (in spherical coordinates)
export function excess(triangle) {
  triangle = triangle.map((p) => cartesian(p))
  return dot(triangle[0], cross(triangle[2], triangle[1]))
}

export function geoDelaunay(points) {
  const DEBUG = false

  PERFORMANCE() && console.time('     geoDelaunay/geo_delaunay_from') // COMMENT
  const delaunay = geo_delaunay_from(points)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_delaunay_from') // COMMENT
  PERFORMANCE() && console.time('     geoDelaunay/geo_triangles') // COMMENT
  const triangles = geo_triangles(delaunay)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_triangles') // COMMENT
  PERFORMANCE() && console.time('     geoDelaunay/geo_edges') // COMMENT
  const edges = null //geo_edges(triangles, points)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_edges') // COMMENT
  PERFORMANCE() && console.time('     geoDelaunay/geo_neighbors') // COMMENT
  const neighbors = null // geo_neighbors(triangles, points.length)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_neighbors') // COMMENT
  PERFORMANCE() && console.time('     geoDelaunay/geo_find') // COMMENT
  const find = null // geo_find(neighbors, points)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_find') // COMMENT
  // Voronoi ; could take a center function as an argument
  PERFORMANCE() && console.time('     geoDelaunay/geo_circumcenters') // COMMENT
  const circumcenters = geo_circumcenters(triangles, points)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_circumcenters') // COMMENT
  PERFORMANCE() && console.time('     geoDelaunay/geo_polygons') // COMMENT
  const { polygons, centers } = geo_polygons(circumcenters, triangles, points)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_polygons') // COMMENT
  PERFORMANCE() && console.time('     geoDelaunay/geo_mesh') // COMMENT
  const mesh = geo_mesh(polygons)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_mesh') // COMMENT
  PERFORMANCE() && console.time('     geoDelaunay/geo_hull') // COMMENT
  const hull = null // geo_hull(triangles, points)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_hull') // COMMENT
  // Urquhart ; returns a function that takes a distance array as argument.
  PERFORMANCE() && console.time('     geoDelaunay/geo_urquhart') // COMMENT
  const urquhart = null // geo_urquhart(edges, triangles)
  PERFORMANCE() && console.timeEnd('     geoDelaunay/geo_urquhart') // COMMENT
  return {
    delaunay,
    edges,
    triangles,
    centers,
    neighbors,
    polygons,
    mesh,
    hull,
    urquhart,
    find,
  }
}

function geo_find(neighbors, points) {
  function distance2(a, b) {
    let x = a[0] - b[0],
      y = a[1] - b[1],
      z = a[2] - b[2]
    return x * x + y * y + z * z
  }

  return function find(x, y, next) {
    if (next === undefined) next = 0
    let cell,
      dist,
      found = next
    const xyz = cartesian([x, y])
    do {
      cell = next
      next = null
      dist = distance2(xyz, cartesian(points[cell]))
      neighbors[cell].forEach((i) => {
        let ndist = distance2(xyz, cartesian(points[i]))
        if (ndist < dist) {
          dist = ndist
          next = i
          found = i
          return
        }
      })
    } while (next !== null)

    return found
  }
}

function geo_delaunay_from(points) {
  if (points.length < 2) return {}

  PERFORMANCE() && console.time('          geo_delaunay_from/point to send to infinity') // COMMENT
  // find a valid point to send to infinity
  let pivot = 0
  while (isNaN(points[pivot][0] + points[pivot][1]) && pivot++ < points.length) {
    continue
  }
  PERFORMANCE() && console.timeEnd('          geo_delaunay_from/point to send to infinity') // COMMENT

  PERFORMANCE() && console.time('          geo_delaunay_from/stereographic projection') // COMMENT
  const r = geoRotation(points[pivot]),
    projection = geoStereographic()
      .translate([0, 0])
      .scale(1)
      .rotate(r.invert([180, 0]))
  points = points.map(projection)
  PERFORMANCE() && console.timeEnd('          geo_delaunay_from/stereographic projection') // COMMENT

  PERFORMANCE() && console.time('          geo_delaunay_from/zeros') // COMMENT
  const zeros = []
  let max2 = 1
  for (let i = 0, n = points.length; i < n; i++) {
    let m = points[i][0] ** 2 + points[i][1] ** 2
    if (!isFinite(m) || m > 1e32) zeros.push(i)
    else if (m > max2) max2 = m
  }

  const FAR = 1e6 * sqrt(max2)

  zeros.forEach((i) => (points[i] = [FAR, 0]))
  PERFORMANCE() && console.timeEnd('          geo_delaunay_from/zeros') // COMMENT

  // Add infinite horizon points
  points.push([0, FAR])
  points.push([-FAR, 0])
  points.push([0, -FAR])

  PERFORMANCE() && console.time('          geo_delaunay_from/delaunator') // COMMENT
  const delaunay = Delaunay.from(points)

  delaunay.projection = projection
  PERFORMANCE() && console.timeEnd('          geo_delaunay_from/delaunator') // COMMENT

  PERFORMANCE() && console.time('          geo_delaunay_from/clean up the triangulation') // COMMENT
  // clean up the triangulation
  const { triangles, halfedges, inedges } = delaunay
  const degenerate = []
  for (let i = 0, l = halfedges.length; i < l; i++) {
    if (halfedges[i] < 0) {
      const j = i % 3 == 2 ? i - 2 : i + 1
      const k = i % 3 == 0 ? i + 2 : i - 1
      const a = halfedges[j]
      const b = halfedges[k]
      halfedges[a] = b
      halfedges[b] = a
      halfedges[j] = halfedges[k] = -1
      triangles[i] = triangles[j] = triangles[k] = pivot
      inedges[triangles[a]] = a % 3 == 0 ? a + 2 : a - 1
      inedges[triangles[b]] = b % 3 == 0 ? b + 2 : b - 1
      degenerate.push(Math.min(i, j, k))
      i += 2 - (i % 3)
    } else if (triangles[i] > points.length - 3 - 1) {
      triangles[i] = pivot
    }
  }
  PERFORMANCE() && console.timeEnd('          geo_delaunay_from/clean up the triangulation') // COMMENT

  // there should always be 4 degenerate triangles
  // console.warn(degenerate);
  return delaunay
}

function geo_edges(triangles, points) {
  const _index = {}
  if (points.length === 2) return [[0, 1]]
  triangles.forEach((tri) => {
    if (tri[0] === tri[1]) return
    if (excess(tri.map((i) => points[i])) < 0) return
    for (let i = 0, j; i < 3; i++) {
      j = (i + 1) % 3
      _index[extent([tri[i], tri[j]]).join('-')] = true
    }
  })
  return Object.keys(_index).map((d) => d.split('-').map(Number))
}

function geo_triangles(delaunay) {
  const { triangles } = delaunay
  if (!triangles) return []

  const geo_triangles = []
  for (let i = 0, n = triangles.length / 3; i < n; i++) {
    const a = triangles[3 * i],
      b = triangles[3 * i + 1],
      c = triangles[3 * i + 2]
    if (a !== b && b !== c) {
      geo_triangles.push([a, c, b])
    }
  }
  return geo_triangles
}

function geo_circumcenters(triangles, points) {
  const a = []
  for (let i = 0; i < triangles.length; i++) {
    const t = triangles[i]
    const c = []
    for (let j = 0; j < t.length; j++) {
      c.push(points[j])
    }
    a.push([(c[0][0] + c[1][0] + c[2][0]) / 3, (c[0][1] + c[1][1] + c[2][1]) / 3])
  }
  return a

  // if (!use_centroids) {
  // return triangles.map((tri) => {
  //   const c = tri.map((i) => points[i]).map(cartesian),
  //     V = cartesianAdd(cartesianAdd(cross(c[1], c[0]), cross(c[2], c[1])), cross(c[0], c[2]))
  //   return spherical(normalize(V))
  // })
  /*} else {
    return triangles.map(tri => {
      return d3.geoCentroid({
        type: "MultiPoint",
        coordinates: tri.map(i => points[i])
      });
    });
  }*/
}

function geo_neighbors(triangles, npoints) {
  const neighbors = []
  triangles.forEach((tri, i) => {
    for (let j = 0; j < 3; j++) {
      const a = tri[j],
        b = tri[(j + 1) % 3],
        c = tri[(j + 2) % 3]
      neighbors[a] = neighbors[a] || []
      neighbors[a].push(b)
    }
  })

  // degenerate cases
  if (triangles.length === 0) {
    if (npoints === 2) {
      neighbors[0] = [1]
      neighbors[1] = [0]
    } else if (npoints === 1) neighbors[0] = []
  }

  return neighbors
}

function geo_polygons(circumcenters, triangles, points) {
  PERFORMANCE() && console.time('          geo_polygons/base fill polygons array') // COMMENT
  const polygons = []
  for (let i = 0; i < points.length; i++) {
    polygons[i] = []
  }
  PERFORMANCE() && console.timeEnd('          geo_polygons/base fill polygons array') // COMMENT

  const centers = circumcenters.slice()

  // supplementary centers for degenerate cases like n = 1,2,3
  const supplements = []

  PERFORMANCE() && console.time('          geo_polygons/triangles.length === 0') // COMMENT
  if (triangles.length === 0) {
    if (points.length < 2) return { polygons, centers }
    if (points.length === 2) {
      // two hemispheres
      const a = cartesian(points[0]),
        b = cartesian(points[1]),
        m = normalize(cartesianAdd(a, b)),
        d = normalize(cross(a, b)),
        c = cross(m, d)
      const poly = [m, cross(m, c), cross(cross(m, c), c), cross(cross(cross(m, c), c), c)]
        .map(spherical)
        .map(supplement)
      return polygons.push(poly), polygons.push(poly.slice().reverse()), { polygons, centers }
    }
  }
  PERFORMANCE() && console.timeEnd('          geo_polygons/triangles.length === 0') // COMMENT

  PERFORMANCE() && console.time(`          geo_polygons/t < triangles.length (${triangles.length})`) // COMMENT
  for (let t = 0; t < triangles.length; t++) {
    // NOTE: the internal loops goes kaduddle to improve performance (a lot btw)
    // for (let j = 0; j < 3; j++) {
    //

    let j = 0
    let a = triangles[t][j],
      b = triangles[t][(j + 1) % 3],
      c = triangles[t][(j + 2) % 3]

    polygons[a].push([b, c, t])

    j = 1
    a = triangles[t][j]
    b = triangles[t][(j + 1) % 3]
    c = triangles[t][(j + 2) % 3]

    polygons[a].push([b, c, t])

    j = 2
    a = triangles[t][j]
    b = triangles[t][(j + 1) % 3]
    c = triangles[t][(j + 2) % 3]

    polygons[a].push([b, c, t])

    //
    // }
  }
  PERFORMANCE() && console.timeEnd(`          geo_polygons/t < triangles.length (${triangles.length})`) // COMMENT

  PERFORMANCE() && console.time('          geo_polygons/reorder') // COMMENT
  // reorder each polygon
  const reordered = polygons.map((poly, a) => {
    // poly indexes
    //    0 3 0 == a
    //    0 3 1 == 0 0
    //    0 3 2 == 0 1

    const p = [poly[0][2]] // t
    let k = poly[0][1] // k = c
    for (let i = 1; i < poly.length; i++) {
      // look for b = k
      for (let j = 0; j < poly.length; j++) {
        if (poly[j][0] == k) {
          k = poly[j][1]
          p.push(poly[j][2])
          break
        }
      }
    }

    if (p.length > 2) {
      return p
    } else if (p.length == 2) {
      const R0 = o_midpoint(points[a], points[poly[0][0]], centers[p[0]]),
        R1 = o_midpoint(points[poly[0][1]], points[a], centers[p[0]])
      const i0 = supplement(R0),
        i1 = supplement(R1)
      return [p[0], i1, p[1], i0]
    }
  })
  PERFORMANCE() && console.timeEnd('          geo_polygons/reorder') // COMMENT

  function supplement(point) {
    let f = -1
    centers.slice(triangles.length, Infinity).forEach((p, i) => {
      if (p[0] === point[0] && p[1] === point[1]) f = i + triangles.length
    })
    if (f < 0) {
      f = centers.length
      centers.push(point)
    }
    return f
  }

  return { polygons: reordered, centers }
}

function o_midpoint(a, b, c) {
  a = cartesian(a)
  b = cartesian(b)
  c = cartesian(c)
  const s = sign(dot(cross(b, a), c))
  return spherical(normalize(cartesianAdd(a, b)).map((d) => s * d))
}

function geo_mesh(polygons) {
  const mesh = []
  polygons.forEach((poly) => {
    if (!poly) return
    let p = poly[poly.length - 1]
    for (let q of poly) {
      if (q > p) mesh.push([p, q])
      p = q
    }
  })
  return mesh
}

function geo_urquhart(edges, triangles) {
  return function (distances) {
    const _lengths = {},
      _urquhart = {}
    edges.forEach((edge, i) => {
      const u = edge.join('-')
      _lengths[u] = distances[i]
      _urquhart[u] = true
    })

    triangles.forEach((tri) => {
      let l = 0,
        remove = -1
      for (var j = 0; j < 3; j++) {
        let u = extent([tri[j], tri[(j + 1) % 3]]).join('-')
        if (_lengths[u] > l) {
          l = _lengths[u]
          remove = u
        }
      }
      _urquhart[remove] = false
    })

    return edges.map((edge) => _urquhart[edge.join('-')])
  }
}

function geo_hull(triangles, points) {
  const _hull = {},
    hull = []
  triangles.map((tri) => {
    if (excess(tri.map((i) => points[i > points.length ? 0 : i])) < 0) return
    for (let i = 0; i < 3; i++) {
      let e = [tri[i], tri[(i + 1) % 3]],
        code = `${e[1]}-${e[0]}`
      if (_hull[code]) delete _hull[code]
      else _hull[e.join('-')] = true
    }
  })

  const _index = {}
  let start
  Object.keys(_hull).forEach((e) => {
    e = e.split('-').map(Number)
    _index[e[0]] = e[1]
    start = e[0]
  })

  if (start === undefined) return hull

  let next = start
  do {
    hull.push(next)
    let n = _index[next]
    _index[next] = -1
    next = n
  } while (next > -1 && next !== start)

  return hull
}