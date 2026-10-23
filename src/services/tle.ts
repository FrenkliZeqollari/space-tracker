export interface Tle {
  name: string
  line1: string
  line2: string
  source: string // which service delivered it
}

const TIMEOUT_MS = 5_000

// Source 1: CelesTrak (plain text, 3 lines)
async function fromCelestrak(noradId: number): Promise<Tle> {
  const res = await fetch(
    `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  )
  if (!res.ok) throw new Error(`CelesTrak returned ${res.status}`)

  const text = await res.text()
  const [name, line1, line2] = text.trim().split('\n').map((l) => l.trim())
  if (!name || !line1 || !line2) throw new Error('CelesTrak: unexpected format')
  return { name, line1, line2, source: 'CelesTrak' }
}

// Source 2: TLE API (JSON)
async function fromTleApi(noradId: number): Promise<Tle> {
  const res = await fetch(`https://tle.ivanstanojevic.me/api/tle/${noradId}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`TLE API returned ${res.status}`)

  const data = await res.json()
  if (!data.name || !data.line1 || !data.line2) throw new Error('TLE API: unexpected format')
  return { name: data.name, line1: data.line1, line2: data.line2, source: 'TLE API' }
}

// Try each source in order and return the first one that works
const SOURCES = [fromCelestrak, fromTleApi]

export async function fetchTle(noradId: number): Promise<Tle> {
  const errors: string[] = []
  for (const source of SOURCES) {
    try {
      return await source(noradId)
    } catch (e) {
      errors.push((e as Error).message)
    }
  }
  throw new Error(`All TLE sources failed: ${errors.join(' | ')}`)
}