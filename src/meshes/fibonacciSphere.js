function getPoints(samples, radius, randomize) {
  samples = samples || 1
  radius = radius || 1
  randomize = randomize || true
  var random = 1
  if (randomize === true) {
    random = Math.random() * samples
  }

  var points = []
  var offset = 2 / samples
  var increment = Math.PI * (3 - Math.sqrt(5))

  for (var i = 0; i < samples; i++) {
    var y = i * offset - 1 + offset / 2
    var distance = Math.sqrt(1 - Math.pow(y, 2))
    var phi = ((i + random) % samples) * increment

    var x = Math.cos(phi) * distance
    var z = Math.sin(phi) * distance

    x = x * radius
    y = y * radius
    z = z * radius

    var point = {
      x: x,
      y: y,
      z: z,
    }
    points.push(point)
  }

  return points
}

export default { getPoints }
