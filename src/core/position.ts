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

export function getPosition(line1: string, line2: string, date: Date): GeoPosition {
  // 1. Parse the TLE into a "satellite record" SGP4 can use
  const satrec = twoline2satrec(line1, line2)

  // 2. Run SGP4: where is it at this time? (ECI, in km)
  const pv = propagate(satrec, date)
  if (!pv || typeof pv.position !== 'object') {
    throw new Error(`Propagation failed (SGP4 error code ${satrec.error})`)
  }

  // 3. How far has Earth rotated at this moment?
  const gmst = gstime(date)

  // 4. Convert to latitude / longitude / height
  const geo = eciToGeodetic(pv.position, gmst)

  return {
    latitude: degreesLat(geo.latitude),
    longitude: degreesLong(geo.longitude),
    altitudeKm: geo.height,
  }
}