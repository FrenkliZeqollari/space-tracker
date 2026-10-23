<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { fetchTle, type Tle } from './services/tle'
import {
  getGroundTrack,
  getPosition,
  getTleEpoch,
  parseTle,
  type GeoPosition,
  type Satellite,
} from './core/position'
import { findPasses, lookFrom, type Look, type Observer, type Pass } from './core/passes'
import { formatClock } from './utils/format'
import GlobeView from './components/GlobeView.vue'
import TelemetryPanel from './components/TelemetryPanel.vue'
import NextPass from './components/NextPass.vue'
import PassList from './components/PassList.vue'

const ISS_NORAD_ID = 25544
const BERLIN: Observer = { latitude: 52.52, longitude: 13.405, heightKm: 0.034 }
const SEARCH_HOURS = 7 * 24
const TRACK_MINUTES = 95 // about one full orbit
const TLE_STALE_HOURS = 72 // older than this → amber warning

const now = ref(new Date())
const tle = ref<Tle | null>(null)
const tleEpoch = ref<Date | null>(null)
const position = ref<GeoPosition | null>(null)
const look = ref<Look | null>(null)
// shallowRef: Vue only reacts when we replace the whole array,
// it doesn't wrap the ~100 points inside (globe.gl wants plain objects)
const track = shallowRef<GeoPosition[]>([])
const passes = ref<Pass[]>([])
const error = ref<string | null>(null)

let tickTimer: number | undefined
let trackTimer: number | undefined
let satellite: Satellite | null = null // plain variable: the template never shows it

// Runs every second: clock, ISS position, and where it is in Berlin's sky
function tick() {
  now.value = new Date()
  if (!satellite) return
  position.value = getPosition(satellite, now.value)
  look.value = lookFrom(satellite, BERLIN, now.value)
}

function updateTrack() {
  if (!satellite) return
  track.value = getGroundTrack(satellite, new Date(), TRACK_MINUTES)
}

onMounted(async () => {
  tickTimer = window.setInterval(tick, 1000) // clocks run even while loading

  try {
    tle.value = await fetchTle(ISS_NORAD_ID)
    satellite = parseTle(tle.value.line1, tle.value.line2) // parse once
    tleEpoch.value = getTleEpoch(satellite)

    tick()
    updateTrack()
    trackTimer = window.setInterval(updateTrack, 60_000) // orbit line: every minute is enough

    passes.value = findPasses(satellite, BERLIN, new Date(), SEARCH_HOURS)
  } catch (e) {
    error.value = (e as Error).message
  }
})

// Stop the timers when the component goes away, so we don't leak them
onUnmounted(() => {
  window.clearInterval(tickTimer)
  window.clearInterval(trackTimer)
})

// Next visible pass that hasn't finished yet
const nextVisible = computed(
  () => passes.value.find((p) => p.visible && p.set.getTime() > now.value.getTime()) ?? null,
)

// Status light: how much can we trust what's on screen?
const status = computed(() => {
  if (error.value) return { cls: 'danger', text: 'NO SIGNAL' }
  if (!position.value) return { cls: 'warn', text: 'ACQUIRING' }
  const ageMs = tleEpoch.value ? now.value.getTime() - tleEpoch.value.getTime() : 0
  if (ageMs > TLE_STALE_HOURS * 3_600_000) return { cls: 'warn', text: 'STALE DATA' }
  return { cls: 'ok', text: 'LIVE' }
})

const utcTime = computed(() => formatClock(now.value, 'UTC'))
const berlinTime = computed(() => formatClock(now.value, 'Europe/Berlin'))
</script>

<template>
  <div class="console">
    <header class="topbar">
      <div class="brand">
        <span class="status-dot" :class="status.cls"></span>
        ISS TRACKER
        <span class="brand-sub">// MISSION CONTROL</span>
      </div>

      <div class="status-text" :class="status.cls">{{ status.text }}</div>

      <div class="clocks">
        <div class="clock">
          <span class="label">UTC</span>
          <span class="value">{{ utcTime }}</span>
        </div>
        <div class="clock">
          <span class="label">Berlin</span>
          <span class="value">{{ berlinTime }}</span>
        </div>
      </div>
    </header>

    <p v-if="error" class="error-banner">⚠ {{ error }}</p>

    <div class="grid">
      <section class="globe-panel">
        <GlobeView :position="position" :track="track" :observer="BERLIN" />
      </section>

      <aside class="sidebar">
        <NextPass :pass="nextVisible" :now="now" />
        <TelemetryPanel
          :position="position"
          :look="look"
          :tle-name="tle?.name ?? null"
          :tle-source="tle?.source ?? null"
          :tle-epoch="tleEpoch"
          :now="now"
          :stale-hours="TLE_STALE_HOURS"
        />
      </aside>

      <div class="passes">
        <PassList :passes="passes" :now="now" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.console {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== Top bar ===== */
.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 12px 16px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: 10px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-data);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.brand-sub {
  font-weight: 400;
  color: var(--muted);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.status-dot.ok {
  color: var(--ok);
  box-shadow: 0 0 10px var(--ok);
  animation: pulse 2s ease-in-out infinite;
}
.status-dot.warn {
  color: var(--warn);
}
.status-dot.danger {
  color: var(--danger);
}

.status-text {
  font-family: var(--font-data);
  font-size: 12px;
  letter-spacing: 0.14em;
}
.status-text.ok {
  color: var(--ok);
}
.status-text.warn {
  color: var(--warn);
}
.status-text.danger {
  color: var(--danger);
}

.clocks {
  display: flex;
  gap: 24px;
}

.clock {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.clock .value {
  font-size: 16px;
}

.error-banner {
  margin: 0;
  padding: 12px 16px;
  border: 1px solid var(--danger);
  border-radius: 10px;
  background: rgba(255, 95, 86, 0.1);
  color: var(--danger);
  font-family: var(--font-data);
  font-size: 13px;
}

/* ===== Layout: phone first, stacked ===== */
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.globe-panel {
  height: 55vh;
  min-height: 320px;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* ===== Desktop: globe left, panels right, schedule below ===== */
@media (min-width: 960px) {
  .grid {
    grid-template-columns: minmax(0, 1fr) 380px;
    grid-template-areas:
      'globe side'
      'passes passes';
  }

  .globe-panel {
    grid-area: globe;
    height: 640px;
  }

  .sidebar {
    grid-area: side;
  }

  .passes {
    grid-area: passes;
  }
}

@keyframes pulse {
  50% {
    opacity: 0.4;
  }
}
</style>