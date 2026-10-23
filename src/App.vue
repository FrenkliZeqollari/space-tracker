<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { fetchTle, type Tle } from './services/tle'
import { getPosition, parseTle, type GeoPosition, type Satellite } from './core/position'
import { findPasses, toCompass, type Observer, type Pass } from './core/passes'

const ISS_NORAD_ID = 25544
const BERLIN: Observer = { latitude: 52.52, longitude: 13.405, heightKm: 0.034 }
const SEARCH_HOURS = 7 * 24

const tle = ref<Tle | null>(null)
const position = ref<GeoPosition | null>(null)
const passes = ref<Pass[]>([])
const error = ref<string | null>(null)
let timer: number | undefined
let satellite: Satellite | null = null // plain variable: the template never shows it

function updatePosition() {
  if (!satellite) return
  position.value = getPosition(satellite, new Date())
}

onMounted(async () => {
  try {
    tle.value = await fetchTle(ISS_NORAD_ID)
    satellite = parseTle(tle.value.line1, tle.value.line2) // parse once
    updatePosition()
    timer = window.setInterval(updatePosition, 1000) // propagate every second
    passes.value = findPasses(satellite, BERLIN, new Date(), SEARCH_HOURS)
  } catch (e) {
    error.value = (e as Error).message
  }
})

// Stop the timer when the component goes away, so we don't leak it
onUnmounted(() => window.clearInterval(timer))

const nextVisible = computed(() => passes.value.find((p) => p.visible) ?? null)

const mapUrl = computed(() => {
  if (!position.value) return '#'
  const { latitude: lat, longitude: lon } = position.value
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=4/${lat}/${lon}`
})

function formatTime(d: Date): string {
  return d.toLocaleString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function durationMin(p: Pass): number {
  return Math.round((p.set.getTime() - p.rise.getTime()) / 60_000)
}
</script>

<template>
  <main>
    <h1>Where is the ISS?</h1>
    <p v-if="error">Error: {{ error }}</p>

    <template v-else-if="position">
      <p>Latitude: {{ position.latitude.toFixed(4) }}°</p>
      <p>Longitude: {{ position.longitude.toFixed(4) }}°</p>
      <p>Altitude: {{ position.altitudeKm.toFixed(1) }} km</p>
      <a :href="mapUrl" target="_blank">Show on map</a>

      <h2>Next visible pass over Berlin</h2>
      <p v-if="nextVisible">
        ⭐ {{ formatTime(nextVisible.rise) }}: look {{ toCompass(nextVisible.riseAzimuth) }},
        up to {{ nextVisible.maxElevation.toFixed(0) }}° high, for {{ durationMin(nextVisible) }} min
      </p>
      <p v-else>No visible passes in the next 7 days.</p>

      <h2>All passes (next 7 days)</h2>
      <table>
        <thead>
          <tr>
            <th>Rise</th>
            <th>Max height</th>
            <th>Direction</th>
            <th>Duration</th>
            <th>Visible?</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in passes" :key="p.rise.getTime()">
            <td>{{ formatTime(p.rise) }}</td>
            <td>{{ p.maxElevation.toFixed(0) }}°</td>
            <td>{{ toCompass(p.riseAzimuth) }} → {{ toCompass(p.setAzimuth) }}</td>
            <td>{{ durationMin(p) }} min</td>
            <td>{{ p.visible ? '⭐ yes' : 'no' }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <p v-else>Loading…</p>
  </main>
</template>