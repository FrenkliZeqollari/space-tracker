// Where is the Sun? Low-precision formula from the Astronomical Almanac.
// Accurate to ~0.01°, which is far more than we need.

const AU_KM = 149_597_870.7 // Earth–Sun distance unit, in km
const toRad = (deg: number) => (deg * Math.PI) / 180

// Sun position in ECI (same coordinate system SGP4 uses), in km
export function sunPositionEci(date: Date): { x: number; y: number; z: number } {
  // Days since 1 Jan 2000, 12:00 UTC (the standard astronomy "J2000" epoch)
  const julianDate = date.getTime() / 86_400_000 + 2_440_587.5
  const n = julianDate - 2_451_545.0

  const meanLongitude = toRad(280.46 + 0.9856474 * n)
  const meanAnomaly = toRad(357.528 + 0.9856003 * n)

  // Where the Sun appears along its yearly path through the sky
  const eclipticLongitude =
    meanLongitude + toRad(1.915) * Math.sin(meanAnomaly) + toRad(0.02) * Math.sin(2 * meanAnomaly)

  // Tilt of Earth's axis
  const obliquity = toRad(23.439 - 0.0000004 * n)

  const distanceKm =
    (1.00014 - 0.01671 * Math.cos(meanAnomaly) - 0.00014 * Math.cos(2 * meanAnomaly)) * AU_KM

  return {
    x: distanceKm * Math.cos(eclipticLongitude),
    y: distanceKm * Math.cos(obliquity) * Math.sin(eclipticLongitude),
    z: distanceKm * Math.sin(obliquity) * Math.sin(eclipticLongitude),
  }
}