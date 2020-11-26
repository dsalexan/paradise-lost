/* eslint-disable camelcase */
export default function equirectangular({ ϕ, θ }, { center } = {}) {
  // are the standard parallels (north and south of the equator)
  //  where the scale of the projection is true
  const lat_1 = 0

  const lon_0 = 0 // is the central meridian of the map
  const lat_0 = 0 // is the central parallel of the map

  const maxLat = Math.PI
  const maxLon = Math.PI * 2

  const maxX = 1 * (maxLon - lon_0) * Math.cos(lat_1)
  const maxY = 1 * (maxLat - lat_0)

  const offset = { x: maxX / 2, y: maxY / 2 } // { x: 0, y: 0 }

  const lon = θ
  const lat = ϕ

  const PI_2 = Math.PI / 2

  // return {
  //   x: ((PI_2 - lat) / Math.PI) * 10,
  //   y: 0,
  //   z: ((Math.PI - lon) / Math.PI) * 10,
  // }

  // return {
  //   x: (lon + Math.PI) / (Math.PI * 2),
  //   y: (Math.PI / 2 - lat) / Math.PI,
  //   z: 0,
  // }

  // return {
  //   x: 1 * (lon - lon_0) * Math.cos(lat_1) - offset.x,
  //   y: 0,
  //   z: 1 * (lat - lat_0) - offset.y,
  // }

  return {}
}
