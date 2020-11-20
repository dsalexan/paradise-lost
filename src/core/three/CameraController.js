import * as THREE from 'three'
let OrbitControls = require('three-orbit-controls')(THREE)

class CameraController extends OrbitControls {
  lookAtWorld(mesh, radius = 1) {
    var box = new THREE.Box3().setFromObject(mesh)
    var boundingBoxSize = box.max.sub(box.min)
    var height = boundingBoxSize.y

    this.reset()

    const camera = this.object

    // camera.zoom = 30 / Store.radius.value
    camera.updateProjectionMatrix()

    var target = new THREE.Vector3()
    var spherical = new THREE.Spherical()

    var quat = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0))
    var quatInverse = quat.clone().inverse()

    var offset = new THREE.Vector3()
    var position = camera.position
    offset.copy(position).sub(new THREE.Vector3(0, 0, 0))

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion(quat)

    // angle from z-axis around y-axis
    spherical.setFromVector3(offset)

    spherical.makeSafe()

    spherical.radius = radius * 3.333

    // move target to panned location
    // scope.target.add(panOffset)

    offset.setFromSpherical(spherical)

    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(quatInverse)

    position.copy(target).add(offset)

    camera.near = 0.5
    camera.far = Math.min(radius ** 3, 500)

    camera.lookAt(target)
    camera.updateProjectionMatrix()
  }
}

export default CameraController
