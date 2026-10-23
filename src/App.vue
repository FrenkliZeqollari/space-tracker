<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { fetchTle, type Tle } from './services/tle'
import { getPosition, type GeoPosition } from './core/position'

const ISS_NORAD_ID = 25544
const tle = ref<Tle | null>(null)
const position = ref<GeoPosition | null>(null)
const error = ref<string | null>(null)
let timer: number | undefined

function updatePosition() {
  if (!tle.value) return
  position.value = getPosition(tle.value.line1, tle.value.line2, new Date())
}

onMounted(async () => {
  try {
    tle.value = await fetchTle(ISS_NORAD_ID)
    updatePosition()
    timer = window.setInterval(updatePosition, 1000)
  } catch (e) {
    error.value = (e as Error).message
  }
})

// Stop the timer when the component goes away, so we don't leak it
onUnmounted(() => window.clearInterval(timer))

const mapUrl = computed(() => {
  if (!position.value) return '#'
  const { latitude: lat, longitude: lon } = position.value
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=4/${lat}/${lon}`
})
</script>

<template>
  <main>
    <h1>Where is the ISS?</h1>
    <p v-if="error">Error: {{ error }}</p>
    <div v-else-if="position">
      <p>Latitude: {{ position.latitude.toFixed(4) }}°</p>
      <p>Longitude: {{ position.longitude.toFixed(4) }}°</p>
      <p>Altitude: {{ position.altitudeKm.toFixed(1) }} km</p>
      <a :href="mapUrl" target="_blank">Show on map</a>
    </div>
    <p v-else>Loading…</p>
  </main>
</template>