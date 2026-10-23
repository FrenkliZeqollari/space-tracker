import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js'

export interface GeoPosition {
  latitude: number   // degrees, -90 to 90
  longitude: number  // degrees, -180 to 180
  altitudeKm: number
  speedKmS: number   // km per second
}

// The parsed satellite record. We let TypeScript work out the type
// from what twoline2satrec returns, so we don't have to know its name.
export type Satellite = ReturnType<typeof twoline2satrec>

// Run ONCE per TLE
export function parseTle(line1: string, line2: string): Satellite {
  return twoline2satrec(line1, line2)
}

// Run EVERY time we need a position
export function getPosition(sat: Satellite, date: Date): GeoPosition {
  // Run SGP4: where is it and how fast is it moving? (ECI, km and km/s)
  const pv = propagate(sat, date)
  if (!pv || typeof pv.position !== 'object' || typeof pv.velocity !== 'object') {
    throw new Error(`Propagation failed (SGP4 error code ${sat.error})`)
  }

  // How far has Earth rotated at this moment?
  const gmst = gstime(date)

  // Convert to latitude / longitude / height
  const geo = eciToGeodetic(pv.position, gmst)
  const v = pv.velocity

  return {
    latitude: degreesLat(geo.latitude),
    longitude: degreesLong(geo.longitude),
    altitudeKm: geo.height,
    speedKmS: Math.hypot(v.x, v.y, v.z), // length of the velocity vector
  }
}

// Where will it be over the next `minutes`? One point every `stepMinutes`.
export function getGroundTrack(
  sat: Satellite,
  start: Date,
  minutes: number,
  stepMinutes = 1,
): GeoPosition[] {
  const points: GeoPosition[] = []
  for (let m = 0; m <= minutes; m += stepMinutes) {
    points.push(getPosition(sat, new Date(start.getTime() + m * 60_000)))
  }
  return points
}

// When was this TLE measured? (the "26294.04791053" from line 1)
export function getTleEpoch(sat: Satellite): Date {
  // TLEs only store 2-digit years. 57–99 = 1900s, because the first
  // satellite (Sputnik) launched in 1957. 00–56 = 2000s.
  const year = sat.epochyr < 57 ? 2000 + sat.epochyr : 1900 + sat.epochyr
  // epochdays = day of year with fraction (1.0 = 1 January, 00:00 UTC)
  return new Date(Date.UTC(year, 0, 1) + (sat.epochdays - 1) * 86_400_000)
}