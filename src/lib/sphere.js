// BASIC VECTOR MATH

/**
 *
 * @param {{x, y, z}} self
 * @param {{x, y, z}} other
 */
export function CrossProduct(self, other) {
  return {
    x: self.y * other.z - self.z * other.y,
    y: self.z * other.x - self.x * other.z,
    z: self.x * other.y - self.y * other.x,
  }
}

/**
 *
 * @param {{x, y, z}} self
 * @param {{x, y, z}} other
 */
export function DotProduct(self, other) {
  return self.x * other.x + self.y * other.y + self.z * other.z
}

/**
 *
 * @param {{x, y, z}} self
 */
export function Magnitude(self) {
  return Math.sqrt(Math.pow(self.x, 2) + Math.pow(self.y, 2) + Math.pow(self.z, 2))
}

// SPHERICAL PROBLEM: Point-In-Polygon

//arbitrarily defining the north pole as (0,1,0) and (0'N, 0'E) as (1,0,0)
//lattidues should be in [-90, 90] and longitudes in [-180, 180]
//You'll have to convert South lattitudes and East longitudes into their negative North and West counterparts.
/**
 *
 * @param {{lattitude, longitude}} c
 */
export function lineFromCoordinate(c) {
  const ret = { x: 0, y: 0, z: 0 }
  //given:
  //tan(lat) == y/x
  //tan(long) == z/x
  //the Vector has magnitude 1, so sqrt(x^2 + y^2 + z^2) == 1
  // rearrange some symbols, solving for x first...
  // // ret.x = 1.0 / Math.sqrt(Math.tan(c.lattitude) ^ (2 + Math.tan(c.longitude)) ^ (2 + 1))
  // then for y and z
  // // ret.y = ret.x * Math.tan(c.lattitude)
  // // ret.z = ret.x * Math.tan(c.longitude)

  ret.x = 1 / Math.sqrt(1 + Math.tan(c.lattitude) ** -2 + Math.tan(c.longitude) ** 2)
  ret.y = ret.x / Math.tan(c.lattitude)
  ret.z = ret.x * Math.tan(c.longitude)

  return ret
}

/**
 *
 * @param {{lattitude, longitude}} a
 * @param {{lattitude, longitude}} b
 */
export function circleFromCoordinates(a, b) {
  const _a = lineFromCoordinate(a)
  const _b = lineFromCoordinate(b)

  return {
    normal: CrossProduct(_a, _b),
  }
}

/**
 *
 * @param {{x, y, z}} a
 * @param {{x, y, z}} b
 */
export function intersection(a, b) {
  return CrossProduct(a.normal, b.normal)
}

/**
 *
 * @param {{x, y, z}} v
 */
export function antipode(v) {
  return { x: -v.x, y: -v.y, z: -v.z }
}

// class GreatCircleSegment{
//   Vector start;
//   Vector end;
//   Vector getNormal(){return start.CrossProduct(end);}
//   GreatCircle getWhole(){return new GreatCircle(this.getNormal());}
// };

/**
 *
 * @param {{x, y, z}} a
 * @param {{x, y, z}} b
 */
export function segmentFromCoordinates(a, b) {
  return [lineFromCoordinate(a), lineFromCoordinate(b)]
}

/**
 *
 * @param {[{x, y, z}, {x, y, z}]} seg
 * @returns {{x, y, z}} vector
 */
export function normalFromSegment(seg) {
  return CrossProduct(seg[0], seg[1])
}

/**
 *
 * @param {[{x, y, z}, {x, y, z}]} seg
 */
export function wholeFromSegment(seg) {
  return { normal: normalFromSegment(seg) }
}

//for any two vectors `a` and `b`,
//a.DotProduct(b) = a.magnitude() * b.magnitude() * cos(theta)
//where theta is the angle between them.
/**
 *
 * @param {{x, y, z}} a
 * @param {{x, y, z}} b
 */
export function angleBetween(a, b) {
  return Math.acos(DotProduct(a, b) / (Magnitude(a) * Magnitude(b)))
}

//returns true if Vector x lies between Vectors a and b.
//note that this function only gives sensical results if the three vectors are coplanar.
/**
 *
 * @param {{x, y, z}} x
 * @param {{x, y, z}} a
 * @param {{x, y, z}} b
 */
export function liesBetween(x, a, b) {
  const x_a = angleBetween(a, x)
  const x_b = angleBetween(x, b)
  const a_b = angleBetween(a, b)
  debugger

  return x_a + x_b === a_b
}

/**
 *
 * @param {[{x, y, z}, {x, y, z}]} a GreatCircleSegment
 * @param {{normal: {x, y, z}}} b GreatCircle
 */
export function segmentIntersectsGreatCircle(a, b) {
  const c = intersection(wholeFromSegment(a), b)
  const d = antipode(c)

  const c_in_a = liesBetween(c, a[0], a[1])
  const d_in_a = liesBetween(d, a[0], a[1])

  return c_in_a || d_in_a
}

/**
 *
 * @param {[{x, y, z}, {x, y, z}]} a GreatCircleSegment
 * @param {[{x, y, z}, {x, y, z}]} b GreatCircleSegment
 */
export function segmentIntersectsSegment(a, b) {
  const a_b = segmentIntersectsGreatCircle(a, wholeFromSegment(b))
  const b_a = segmentIntersectsGreatCircle(b, wholeFromSegment(a))
  return a_b && b_a
}

/**
 *
 * @param {{lattitude, longitude}[]} polygon
 * @param {{lattitude, longitude}} pointNotLyingInsidePolygon
 * @param {{lattitude, longitude}} vehiclePosition
 */
export function liesWithin(polygon, pointNotLyingInsidePolygon, vehiclePosition) {
  const referenceLine = segmentFromCoordinates(pointNotLyingInsidePolygon, vehiclePosition)
  let intersections = 0
  //iterate through all adjacent polygon vertex pairs
  //we iterate i one farther than the size of the array, because we need to test the segment formed by the first and last coordinates in the array
  for (let i = 0; i < polygon.length; i++) {
    let j = (i + 1) % polygon.length

    const polygonEdge = segmentFromCoordinates(polygon[i], polygon[j])
    const intersects = segmentIntersectsSegment(referenceLine, polygonEdge)

    if (intersects) {
      intersections++
    }
  }
  return intersections % 2 === 1
}
