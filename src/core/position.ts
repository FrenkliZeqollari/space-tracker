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
  // Run SGP4: where is it at this time? (ECI, in km)
  const pv = propagate(sat, date)
  if (!pv || typeof pv.position !== 'object') {
    throw new Error(`Propagation failed (SGP4 error code ${sat.error})`)
  }

  // How far has Earth rotated at this moment?
  const gmst = gstime(date)

  // Convert to latitude / longitude / height
  const geo = eciToGeodetic(pv.position, gmst)

  return {
    latitude: degreesLat(geo.latitude),
    longitude: degreesLong(geo.longitude),
    altitudeKm: geo.height,
  }
}