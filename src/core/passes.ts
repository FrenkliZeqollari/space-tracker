import { propagate, gstime, eciToEcf, ecfToLookAngles } from 'satellite.js'
import type { Satellite } from './position'
import { sunPositionEci } from './sun'

export interface Observer {
  latitude: number  // degrees
  longitude: number // degrees
  heightKm: number
}

export interface Pass {
  rise: Date
  set: Date
  maxTime: Date
  maxElevation: number // degrees
  riseAzimuth: number  // degrees, 0 = north, 90 = east
  setAzimuth: number
  visible: boolean     // visible with the naked eye at some point during the pass
}

const MIN_ELEVATION_DEG = 10 // below this, buildings and trees are in the way
const SUN_MAX_ELEVATION_DEG = -6 // Sun must be this far below the horizon (dark enough)
const STEP_MS = 30_000 // check every 30 seconds
const EARTH_RADIUS_KM = 6371

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

interface Vec3 {
  x: number
  y: number
  z: number
}

// Elevation + azimuth of any object (ISS, Sun...) as seen by the observer
function lookAngles(observer: Observer, eci: Vec3, gmst: number) {
  const ecf = eciToEcf(eci, gmst) // rotate with the Earth
  const look = ecfToLookAngles(
    {
      latitude: toRad(observer.latitude),
      longitude: toRad(observer.longitude),
      height: observer.heightKm,
    },
    ecf,
  )
  return { elevation: toDeg(look.elevation), azimuth: toDeg(look.azimuth) }
}

// Is the satellite in sunlight, or inside Earth's shadow?
// Model: Earth's shadow is a cylinder pointing away from the Sun.
function isSunlit(sat: Vec3, sun: Vec3): boolean {
  const sunDist = Math.hypot(sun.x, sun.y, sun.z)
  const s = { x: sun.x / sunDist, y: sun.y / sunDist, z: sun.z / sunDist } // direction to Sun

  // How far the satellite is "towards the Sun" from Earth's centre
  const along = sat.x * s.x + sat.y * s.y + sat.z * s.z
  if (along > 0) return true // on the Sun's side of Earth → lit

  // Behind Earth: is it inside the shadow tube?
  const distFromShadowAxis = Math.hypot(sat.x - along * s.x, sat.y - along * s.y, sat.z - along * s.z)
  return distFromShadowAxis > EARTH_RADIUS_KM
}

// One moment in time: where is the ISS in my sky, and can I see it?
function sample(sat: Satellite, observer: Observer, time: Date) {
  const pv = propagate(sat, time)
  if (!pv || typeof pv.position !== 'object') return null

  const gmst = gstime(time)
  const iss = lookAngles(observer, pv.position, gmst)
  const sunEci = sunPositionEci(time)
  const sun = lookAngles(observer, sunEci, gmst)

  const visible =
    iss.elevation >= MIN_ELEVATION_DEG && // 1. high enough
    sun.elevation < SUN_MAX_ELEVATION_DEG && // 2. dark for me
    isSunlit(pv.position, sunEci) // 3. ISS in sunlight

  return { time, elevation: iss.elevation, azimuth: iss.azimuth, visible }
}

// Step through time and collect every pass above MIN_ELEVATION_DEG
export function findPasses(sat: Satellite, observer: Observer, start: Date, hours: number): Pass[] {
  const passes: Pass[] = []
  let current: Pass | null = null
  const end = start.getTime() + hours * 3_600_000

  for (let t = start.getTime(); t <= end; t += STEP_MS) {
    const s = sample(sat, observer, new Date(t))
    if (!s) continue
    const above = s.elevation >= MIN_ELEVATION_DEG

    if (above && !current) {
      // Pass starts
      current = {
        rise: s.time,
        set: s.time,
        maxTime: s.time,
        maxElevation: s.elevation,
        riseAzimuth: s.azimuth,
        setAzimuth: s.azimuth,
        visible: s.visible,
      }
    } else if (above && current) {
      // Pass continues
      current.set = s.time
      current.setAzimuth = s.azimuth
      if (s.elevation > current.maxElevation) {
        current.maxElevation = s.elevation
        current.maxTime = s.time
      }
      if (s.visible) current.visible = true
    } else if (!above && current) {
      // Pass ends
      passes.push(current)
      current = null
    }
  }
  return passes
}

// 0–360° → "N", "NE", "E"...
export function toCompass(azimuth: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(azimuth / 45) % 8] ?? 'N'
}