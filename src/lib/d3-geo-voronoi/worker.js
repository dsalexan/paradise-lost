/* global process */

import * as Comlink from 'comlink'

const worker = {
  buildPolygons(triangles, start, end) {
    const polygons = []

    console.time('                buildPolygons', start, '->', end)
    for (let t = start; t < end; t++) {
      const tri = triangles[t]

      for (let j = 0; j < 3; j++) {
        const a = tri[j],
          b = tri[(j + 1) % 3],
          c = tri[(j + 2) % 3]
        polygons[a] = polygons[a] || []
        polygons[a].push([b, c, t, [a, b, c]])
      }
    }
    console.timeEnd('                buildPolygons', start, '->', end)

    return polygons
  },
}

Comlink.expose(worker)
