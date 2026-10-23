<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import Globe, { type GlobeInstance } from 'globe.gl'
import * as THREE from 'three'
import type { GeoPosition } from '../core/position'
import type { Observer } from '../core/passes'

const props = defineProps<{
  position: GeoPosition | null
  track: GeoPosition[]
  observer: Observer
}>()

const EARTH_RADIUS_KM = 6371
// globe.gl measures altitude in "Earth radii": 0.066 = 6.6% above the surface
const toGlobeAlt = (km: number) => km / EARTH_RADIUS_KM

const container = ref<HTMLDivElement | null>(null)
const follow = ref(true)

// Plain variables, not refs: Vue doesn't need to watch the 3D engine
let globe: GlobeInstance | null = null
let resizeObserver: ResizeObserver | null = null

// ONE marker object that we update, instead of a new one every second.
// globe.gl then moves the existing 3D dot instead of rebuilding it.
const issMarker: GeoPosition = { latitude: 0, longitude: 0, altitudeKm: 0, speedKmS: 0 }

function updateIss() {
  if (!globe || !props.position) return
  Object.assign(issMarker, props.position)
  globe.objectsData([issMarker])

  if (follow.value) {
    globe.pointOfView(
      { lat: issMarker.latitude, lng: issMarker.longitude, altitude: 2.5 },
      1000, // smooth 1-second camera move
    )
  }
}

function updateTrack() {
  if (!globe) return
  globe.pathsData([{ points: props.track }])
}

onMounted(() => {
  if (!container.value) return

  globe = new Globe(container.value)
    // Earth at night + starry background: mission-control look
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')

    // The ISS: a yellow sphere at its real altitude
    .objectLat('latitude')
    .objectLng('longitude')
    .objectAltitude((d) => toGlobeAlt((d as GeoPosition).altitudeKm))
    .objectThreeObject(
      () =>
        new THREE.Mesh(
          new THREE.SphereGeometry(1.5),
          new THREE.MeshBasicMaterial({ color: '#ffcc00' }),
        ),
    )

    // The orbit: next 95 minutes, drawn at real altitude
    .pathPoints('points')
    .pathPointLat('latitude')
    .pathPointLng('longitude')
    .pathPointAlt((p) => toGlobeAlt((p as GeoPosition).altitudeKm))
    .pathColor(() => 'rgba(255, 204, 0, 0.6)')
    .pathStroke(1.5)

    // Berlin
    .labelsData([
      { lat: props.observer.latitude, lng: props.observer.longitude, text: 'Berlin' },
    ])
    .labelLat('lat')
    .labelLng('lng')
    .labelText('text')
    .labelSize(1.2)
    .labelDotRadius(0.5)
    .labelColor(() => '#4fc3f7')

  // Keep the globe the same size as its container (phone + desktop)
  resizeObserver = new ResizeObserver(() => {
    if (globe && container.value) {
      globe.width(container.value.clientWidth).height(container.value.clientHeight)
    }
  })
  resizeObserver.observe(container.value)

  updateIss()
  updateTrack()
})

// Redraw whenever App.vue sends new data
watch(() => props.position, updateIss)
watch(() => props.track, updateTrack)

// Clean up the 3D engine when the component goes away
onUnmounted(() => {
  resizeObserver?.disconnect()
  globe?._destructor()
})
</script>

<template>
  <div class="globe-wrapper">
    <div ref="container" class="globe"></div>
    <label class="follow">
      <input v-model="follow" type="checkbox" />
      FOLLOW ISS
    </label>
  </div>
</template>

<style scoped>
.globe-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 10px;
  background: #000;
}

.globe {
  width: 100%;
  height: 100%;
}

.follow {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  background: rgba(5, 7, 13, 0.75);
  color: var(--text);
  font-family: var(--font-data);
  font-size: 11px;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.follow input {
  accent-color: var(--accent);
}
</style>