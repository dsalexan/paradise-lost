/* eslint-disable camelcase */
/* eslint-disable max-depth */
import { flatten, get, invert, last, sortBy, sum, zip } from 'lodash'
import { BehaviorSubject, merge, interval } from 'rxjs'
import { debounce } from 'rxjs/operators'
import { subscribeOn } from 'rxjs/operators'

import * as THREE from 'three'
import { ConvexHull } from '../../three/math/ConvexHull'
import { ConvexBufferGeometry } from '../../three/geometries/ConvexBufferGeometry'
import chroma from 'chroma-js'
import { geoVoronoi } from '../../../lib/d3-geo-voronoi'
import { geoEquirectangular } from 'd3'
import { isInsidePolygon } from '../../../lib/bevinChatelain'

function PERFORMANCE() {
  return JSON.parse(window.localStorage.getItem('store/control/performance/world'))
}

// chroma(i % 360, 0.4, 0.7, 'hsl').hex()
// function color(r) {
//   const rgb = chroma(r % 360, 0.4, 0.7, 'hsl').rgb()

//   return rgb.map((c) => parseInt(c, 16) / 255)
// }
let _randomColor = []
function color(index) {
  if (!_randomColor[index]) {
    _randomColor[index] = [0.5 + Math.random() * 0.5, 0.6 + Math.random() * 0.3, 0.5 + Math.random() * 0.5]
  }
  return _randomColor[index]
}

export default class Renderer {
  constructor(world, projector) {
    this.world = world
    this.projector = projector

    this.cloudSiteGeometry = new BehaviorSubject(null)
    this.cloudSiteMesh = null

    this.tesselatedCloudCentersGeometry = new BehaviorSubject(null)
    this.tesselatedCloudCentersMesh = null
    this.tesselatedSphereGeometry = new BehaviorSubject(null)
    this.tesselatedSphereMesh = null
  }

  buildCloudSiteGeometry() {
    const radius = this.world.radius.value

    if (!this.world.tesselation) return this.cloudSiteGeometry.next(null)
    const vertices = this.world.tesselation.valid

    PERFORMANCE() && console.time('World/Renderer/buildCloudSiteGeometry') // COMMENT
    const buffer = []
    for (let i = 0; i < vertices.length; i++) {
      const [θ, ϕ] = vertices[i]
      buffer.push(θ, ϕ, 0)
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
  buildCloudSiteMesh({ color = 0x0000ff } = {}) {
    if (!this.cloudSiteGeometry.value || !this.world.visibility.cloud.value) return (this.cloudSiteMesh = null)

    PERFORMANCE() && console.time('World/Renderer/buildCloudSiteMesh') // COMMENT
    const size = this.projector.gizmoSize.value * this.projector.relativeSize

    const cloud = new THREE.Points(
      this.cloudSiteGeometry.value,
      // new THREE.PointsMaterial({ color, size, alphaTest: 0.5 })
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(color) },
          size: { type: 'f', value: size },
          radius: { type: 'f', value: this.world.radius.value || 1.0 },
        },
        vertexShader: `
          #define PI 3.1415926535897932384626433832795
          #define RAD PI / 180.

          uniform float radius;
          uniform float size;

          void main()	{
            vec3 projectedPosition;
            vec3 spherical = position;

            ${this.projector.shader()}

            gl_PointSize = size;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( projectedPosition, 1.0 );
          }
        `,
        fragmentShader: `
          uniform vec3 color;

          void main()	{
            gl_FragColor = vec4( color, 1.0 );
          }
        `,
      })
    )
    this.cloudSiteMesh = cloud
    PERFORMANCE() && console.timeEnd('World/Renderer/buildCloudSiteMesh') // COMMENT
  }

  buildTesselatedCloudCentersGeometry() {
    const toRAD = Math.PI / 180

    const tesselation = this.world.tesselation
    const radius = this.world.radius.value
    if (!tesselation) return

    PERFORMANCE() && console.time('World/Renderer/buildTesselatedCloudCentersGeometry') // COMMENT
    const size = 3 * tesselation.delaunay.centers.length
    const centers = new Float32Array(size)
    let index = 0
    for (let i = 0; i < tesselation.delaunay.centers.length; i++) {
      const center = tesselation.delaunay.centers[i]

      const { ϕ, θ } = {
        ϕ: ((center[1] + 90) * Math.PI) / 180,
        θ: (center[0] * Math.PI) / 180,
      }

      centers[index++] = ϕ
      centers[index++] = θ + (this.projector.type.value === 'Equirectangular' ? Math.PI : 0)
      centers[index++] = 0
    }

    var geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(centers, 3))
    PERFORMANCE() && console.timeEnd('World/Renderer/buildTesselatedCloudCentersGeometry') // COMMENT

    this.tesselatedCloudCentersGeometry.next(geometry)

    // var loader = new THREE.TextureLoader()
    // loader.load('textures/land_ocean_ice_cloud_2048.jpg', function (texture) {
    // })
  }

  buildTesselatedCloudCentersMesh({ color = 0x99ccff } = {}) {
    if (!this.tesselatedCloudCentersGeometry.value || !this.world.visibility.centers.value)
      return (this.tesselatedCloudCentersMesh = null)

    PERFORMANCE() && console.time('World/Renderer/buildTesselatedCloudCentersMesh') // COMMENT
    const size = this.projector.gizmoSize.value * this.projector.relativeSize

    const cloud = new THREE.Points(
      this.tesselatedCloudCentersGeometry.value,
      // new THREE.PointsMaterial({ color, size, alphaTest: 0.5 })
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(color) },
          size: { type: 'f', value: size },
          radius: { type: 'f', value: this.world.radius.value || 1.0 },
        },
        vertexShader: `
          #define PI 3.1415926535897932384626433832795

          uniform float radius;
          uniform float size;

          void main()	{
            vec3 projectedPosition;
            vec3 spherical = position;

            ${this.projector.shader()}
          

            gl_PointSize = size;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( projectedPosition, 1.0 );
          }
        `,
        fragmentShader: `
          uniform vec3 color;

          void main()	{
            gl_FragColor = vec4( color, 1.0 );
          }
        `,
      })
    )
    this.tesselatedCloudCentersMesh = cloud
    PERFORMANCE() && console.timeEnd('World/Renderer/buildTesselatedCloudCentersMesh') // COMMENT
  }

  buildTesselatedSphereGeometry() {
    const toRAD = Math.PI / 180

    const tesselation = this.world.tesselation
    const centers = get(this.world.tesselation, 'delaunay.centers')
    const radius = this.world.radius.value
    if (!tesselation) return

    const SITES = tesselation.valid
    const POLYGONS = tesselation.delaunay.polygons
    const colorScheme = get(this.world.colors.value, this.world.visibility.color.value, null) || color

    PERFORMANCE() && console.time('World/Renderer/buildTesselatedSphereGeometry') // COMMENT

    let A1 = 0,
      A2 = 0,
      A3 = 0,
      A4 = 0,
      A5 = 0,
      A6 = 0,
      A7 = 0,
      A8 = 0

    // console.time('    buildTesselatedSphereGeometry/calculate ArraySize') // COMMENT MANUAL
    const size = 3 * 3 * sum(flatten(POLYGONS.map((p) => p.length)))
    let vertices = new Float32Array(size),
      colors = new Float32Array(size),
      vs = [],
      cs = []
    // console.timeEnd('    buildTesselatedSphereGeometry/calculate ArraySize') // COMMENT MANUAL

    let vertices_index = 0,
      colors_index = 0

    POLYGONS.map((ts, r) => {
      // const a2 = performance.now() // COMMENT MANUAL
      // let sphericalInDegree_OG = ts.map((index) => this.world.tesselation.delaunay.centers[index])
      // sphericalInDegree_OG = [...sortBy(sphericalInDegree_OG, (_, i) => -i), last(sphericalInDegree_OG)]

      const sphericalInDegree = []
      for (let i = ts.length - 1; i >= 0; i--) {
        sphericalInDegree.push(centers[ts[i]])
      }
      sphericalInDegree.push(sphericalInDegree[0])
      // A2 += performance.now() - a2 // COMMENT MANUAL

      // const a3 = performance.now() // COMMENT MANUAL
      // const trianglesSphericalInDegree = flatten(
      //   zip(sphericalInDegree.slice(0, -1), sphericalInDegree.slice(1)).map(([a, b]) => [SITES[r], b, a])
      // )
      // TODO: remake delaunay shit to not need this degree shit

      const spherical = []
      for (let i = 0; i < sphericalInDegree.length - 1; i++) {
        const site = this.projector.project(SITES[r])
        const i0 = this.projector.project(sphericalInDegree[i])
        const i1 = this.projector.project(sphericalInDegree[i + 1])

        if (this.projector.type.value === 'Equirectangular') {
          i0.θ += Math.PI
          i1.θ += Math.PI
        }

        spherical.push(...[site, i1, i0])
      }
      // A3 += performance.now() - a3 // COMMENT MANUAL

      // const a1 = performance.now() // COMMENT MANUAL
      // vs.push(...flatten(cartesian.map(({ x, y, z }) => [x, y, z])))
      // cs.push(...flatten(cartesian.map(() => color([r, SITES.length]))))

      for (let i = 0; i < spherical.length; i++) {
        vertices[vertices_index++] = spherical[i].ϕ
        vertices[vertices_index++] = spherical[i].θ
        vertices[vertices_index++] = 0

        const c = colorScheme(r)
        colors[colors_index++] = c[0]
        colors[colors_index++] = c[1]
        colors[colors_index++] = c[2]
      }
      // A1 += performance.now() - a1 // COMMENT MANUAL
    })

    // console.log('    buildTesselatedSphereGeometry/indexes in polygon -> centers', A2) // COMMENT MANUAL
    // console.log('    buildTesselatedSphereGeometry/zip mess to get duples', A3) // COMMENT MANUAL
    // console.log('    buildTesselatedSphereGeometry/push to flat array', A1) // COMMENT MANUAL

    // vertices = new Float32Array(vs)
    // colors = new Float32Array(cs)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    // geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

    PERFORMANCE() && console.timeEnd('World/Renderer/buildTesselatedSphereGeometry') // COMMENT
    // geometry.computeVertexNormals()

    // this.tesselatedSphereGeometry.next(geometry)

    const res = 100
    const width = Math.ceil(3.6 * res)
    const height = Math.ceil(1.8 * res)

    const pixelData = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        pixelData.push([0, 0, 0, 255 * 0.1])
        // pixelData.push([0, 0, 0, 255 * 0.25])
      }
    }

    for (let r = 0; r < this.world.tesselation.valid.length; r++) {
      const site = this.world.tesselation.valid[r]
    }

    let sphericalPolygons = []
    for (let r = 0; r < this.world.tesselation.delaunay.polygons.length; r++) {
      const spherical = this.world.tesselation.delaunay.polygons[r].map(
        (ci) => this.world.tesselation.delaunay.centers[ci]
      )

      sphericalPolygons.push({
        site: this.world.tesselation.valid[r],
        points: spherical,
      })
    }

    const toCoordinates = ({ θ, ϕ }) => {
      const toDEGREE = 180 / Math.PI

      return {
        ϕ: (θ - Math.PI) * toDEGREE,
        λ: (ϕ - Math.PI / 2) * toDEGREE,
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // if (!(y === 14 && x === 0)) continue
        // if (y < 14) continue

        const index = y * width + x
        const toRAD = (100 / res) * (Math.PI / 180)
        const spherical = this.projector.translateFromTexture({ x: x * toRAD, y: y * toRAD })

        // if (x === 17 || x === 18) console.log({ x, y }, spherical, margin(Math.PI * 2, res / 100)(spherical.θ))
        // if (spherical.ϕ >= Math.PI / 4 + Math.PI / 2) {
        //   console.log({ x, y })
        //   pixelData[index] = [255, 0, 0, 255]
        // }
        // else pixelData.push([0, 0, 0, 255 * 0.1])

        // continue
        let inside = false
        for (let r = 0; r < sphericalPolygons.length && !inside; r++) {
          const site = sphericalPolygons[r].site
          const polygon = sphericalPolygons[r].points.map(([θ, ϕ]) => ({ λ: ϕ, ϕ: θ }))

          inside = isInsidePolygon(polygon, { ϕ: site[0], λ: site[1] }, toCoordinates(spherical))

          if (inside === 1 || inside === 2) {
            const c = colorScheme(r)
            pixelData[index] = [c[0] * 255, c[1] * 255, c[2] * 255, 255]
          }
        }
      }
    }

    // for (let i = 0; i < width * height; i++) {
    //   if (pixelData[i * 4] === undefined) {
    //     // pixelData.push(parseInt(x / width) * 255, parseInt(y / height) * 255, 0, 255)
    //     // pixelData.push(Math.random() * 255, Math.random() * 255, Math.random() * 255, Math.random() * 255) // generates random r,g,b,a values from 0 to 1
    //     pixelData[i * 4] = 255
    //     pixelData[i * 4 + 1] = 0
    //     pixelData[i * 4 + 2] = 0
    //     pixelData[i * 4 + 3] = 255 * 0.005
    //   }
    // }

    console.log(pixelData)
    const dataTexture = new THREE.DataTexture(
      Uint8Array.from(flatten(pixelData)),
      width,
      height,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
      THREE.UVMapping
    )
    dataTexture.wrapS = THREE.ClampToEdgeWrapping
    dataTexture.wrapT = THREE.ClampToEdgeWrapping
    dataTexture.needsUpdate = true

    const sphereRes = 100
    let longSegments = Math.ceil(3.6 * sphereRes) // 10° increments
    let latSegments = Math.ceil(1.8 * sphereRes) // 10° increments
    let geometry2 = new THREE.SphereBufferGeometry(radius, longSegments, latSegments)

    const earthTexture = new THREE.TextureLoader().load('/textures/2_no_clouds_16k.jpg')
    earthTexture.needsUpdate = true

    let plane = new THREE.PlaneBufferGeometry(radius * 2, radius, longSegments, latSegments)
    const meshTexture = new THREE.Mesh(
      plane,
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        map: dataTexture,
      })
    )
    meshTexture.position.setX(radius * 1.5 + radius)
    meshTexture.rotation.x = -Math.PI / 2
    window.ENGINE.scene.add(meshTexture)

    const shaderMaterial = new THREE.ShaderMaterial({
      wireframe: false,
      transparent: true,
      uniforms: {
        radius: { type: 'f', value: this.world.radius.value || 1.0 },
        resolution: { value: new THREE.Vector2(window.ENGINE.width, window.ENGINE.height) },
        fov: { type: 'f', value: 450 },
        utexture: { value: dataTexture },
      },
      vertexShader: `

      attribute vec3 color;

      uniform float radius;

      varying vec4 vWorld;
      varying vec2 vUV;

      void main()	{
        vUV = uv;
        vWorld = vec4(position, 1.);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
      fragmentShader: `
      #define USE_MAP true

      #define PI 3.1415926535897932384626433832795
      #define PI_2 PI*2.
      #define MODE 0 // 0 = fibonacci sample, 1 = tesselation lat/lon
      #define DEGREE vec2(180. / PI, 180. / PI)

      varying vec4 vWorld;
      varying vec2 vUV;
      
      uniform float radius;
      uniform vec2 resolution;
      uniform float fov;
      uniform sampler2D utexture;

      vec3 worldToSpherical(vec3 cartesian, float r) {
        vec3 base = vec3(
          asin(cartesian.y / r),
          atan(cartesian.z, cartesian.x),
          r
        );

        if (MODE == 0) { // fibonacci sample
          return base + vec3(PI/2., PI, 0.);
        } else { // tesselation lat/lon
          return base + vec3(0., PI, 0.);
        }
      }

      vec2 screenToSpherical(vec2 screen) {
        // convert from ([0, 1], [0, 1]) ->
        //                  ([0, PI_2], [0, PI]) or
        //                  ([0, PI_2], [-PI/2, PI/2])

        if (MODE == 0) { // fibonacci sample
          return screen * vec2(PI_2, PI) - vec2(0., PI / 2.);
        } else { // tesselation lat/lon
          return screen * vec2(PI_2, PI);
        }
      }

      void main()	{
        // EQUIRECTANGULAR
        vec2 spherical = screenToSpherical(vUV);

        // vec4 n_world = vWorld / radius;
        // vec3 spherical = worldToSpherical(n_world.xyz, 1.); // phi, theta IN RADIANS
        // vec2 coords = spherical.xy * (180. / PI);
        // vec2 coords = vec2(vWorld.y, vWorld.x) + vec2(180., 90.);

        // fragColor = texture(iChannel0, rotatedSphericalCoord / vec2(2.*M_PI, M_PI), 0.0);
        // gl_FragColor = vec4( (vUv.x / radius) + 0.5, (vUv.y / radius) + 0.5, (vUv.z / radius) + 0.5, 1.0 );

        if (spherical.x > 3. *PI / 2.) {
          gl_FragColor = vec4(1., 0., 0., 1.);
        } else {
          gl_FragColor = vec4(0., 0., 0., 0.);
        }

        // gl_FragColor = vec4(spherical.y / PI_2, 0., 0., 1.);
        gl_FragColor = texture(utexture, vUV);
      }
    `,
    })
    shaderMaterial.needsUpdate = true

    const mesh3 = new THREE.Mesh(
      geometry2,
      // new THREE.MeshBasicMaterial({
      //   transparent: true,
      //   map: dataTexture,
      // })
      shaderMaterial
    )
    // mesh3.rotation.x = -Math.PI / 2
    // mesh3.scale.set(radius / -180, radius / 180, 1)

    window.ENGINE.scene.add(mesh3)
  }

  buildTesselatedSphereMesh() {
    const mesh = new THREE.Mesh(
      this.tesselatedSphereGeometry.value,
      // new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, wireframe: false, side: this.projector.side }) //vertexColors: THREE.VertexColors
      new THREE.ShaderMaterial({
        uniforms: {
          radius: { type: 'f', value: this.world.radius.value || 1.0 },
        },
        vertexShader: `
          #define PI 3.1415926535897932384626433832795

          uniform float radius;

          varying vec3 vColor;

          void main()	{
            vec3 projectedPosition;
            vec3 spherical = position;

            ${this.projector.shader()}            

            gl_Position = projectionMatrix * modelViewMatrix * vec4( projectedPosition, 1.0 );

            vColor = color;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;

          void main()	{
            gl_FragColor = vec4( vColor.rgb, 1. );
          }
        `,
        vertexColors: THREE.VertexColors,
      })
    )

    this.tesselatedSphereMesh = mesh
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
    this.world.visibility.cloud.subscribe((visible) =>
      helper_visibilityMesh(this.cloudSiteMesh, visible, this.buildCloudSiteGeometry)
    )
    this.cloudSiteGeometry.subscribe((geometry) => {
      const visible = this.world.visibility.cloud.value

      const shouldRemove = !visible && o.removeOnHide.value

      engine.scene.remove(this.cloudSiteMesh)

      if (!geometry) return
      if (shouldRemove) this.cloudSiteGeometry.next(null)

      this.buildCloudSiteMesh()
      const mesh = this.cloudSiteMesh
      if (mesh) {
        mesh.visible = visible
        engine.scene.add(this.cloudSiteMesh)
      }
    })

    // TESSELATION CENTERS CLOUD
    this.world.visibility.centers.subscribe((visible) =>
      helper_visibilityMesh(this.tesselatedCloudCentersMesh, visible, this.buildTesselatedCloudCentersGeometry)
    )
    this.tesselatedCloudCentersGeometry.subscribe((geometry) => {
      const visible = this.world.visibility.centers.value

      const shouldRemove = !visible && o.removeOnHide.value

      engine.scene.remove(this.tesselatedCloudCentersMesh)
      if (!geometry) return
      if (shouldRemove) this.tesselatedCloudCentersGeometry.next(null)

      this.buildTesselatedCloudCentersMesh()
      const mesh = this.tesselatedCloudCentersMesh
      if (mesh) {
        mesh.visible = visible
        engine.scene.add(mesh)
      }
    })

    // TESSELATION POLYHEADRON
    this.world.visibility.regions.subscribe((visible) =>
      helper_visibilityMesh(this.tesselatedSphereMesh, visible, this.buildTesselatedSphereGeometry)
    )
    this.tesselatedSphereGeometry.subscribe((geometry) => {
      const visible = this.world.visibility.regions.value

      const shouldRemove = !visible && o.removeOnHide.value

      engine.scene.remove(this.tesselatedSphereMesh)
      if (!geometry) return
      if (shouldRemove) this.tesselatedSphereGeometry.next(null)

      this.buildTesselatedSphereMesh()
      const mesh = this.tesselatedSphereMesh
      if (mesh) {
        mesh.visible = visible
        engine.scene.add(mesh)
      }
    })
  }

  subscribe(engine) {
    const o = engine.observables

    // filling buffer vertices [{x, y, z}, {x, y, z}, {x, y, z}] -> (X, Y, Z, Z, Y, Z, ...., Y, Z)
    merge(this.world._cartesian, this.world.radius, this.projector.gizmoSize, this.projector.type)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        if (!this.world.visibility.cloud.value && o.removeOnHide.value) return

        this.buildCloudSiteGeometry() // after change, rebuild sphere base geometry
      })

    merge(this.world.radius, this.world._tesselation, this.projector.gizmoSize, this.projector.type)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        const tesselation = this.world._tesselation.value

        if (!tesselation) return
        if (!(!this.world.visibility.centers.value && o.removeOnHide.value)) this.buildTesselatedCloudCentersGeometry()
      })

    merge(
      this.world.radius,
      this.world._tesselation,
      this.world.visibility.color,
      this.world.colors,
      this.projector.type
    )
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        const tesselation = this.world._tesselation.value

        if (!tesselation) return
        if (!(!this.world.visibility.regions.value && o.removeOnHide.value)) this.buildTesselatedSphereGeometry()
      })
  }
}
