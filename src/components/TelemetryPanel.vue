<script setup lang="ts">
import { computed } from 'vue'
import type { GeoPosition } from '../core/position'
import { toCompass, type Look } from '../core/passes'
import { formatAge } from '../utils/format'

const props = defineProps<{
  position: GeoPosition | null
  look: Look | null
  tleName: string | null
  tleSource: string | null
  tleEpoch: Date | null
  now: Date
  staleHours: number
}>()

const tleAgeMs = computed(() =>
  props.tleEpoch ? props.now.getTime() - props.tleEpoch.getTime() : null,
)
const isStale = computed(
  () => tleAgeMs.value !== null && tleAgeMs.value > props.staleHours * 3_600_000,
)
const aboveHorizon = computed(() => (props.look?.elevation ?? -90) > 0)
</script>

<template>
  <section class="panel">
    <h2 class="panel-title">Telemetry · {{ tleName ?? 'ISS' }}</h2>
    <div v-if="position" class="readouts">
      <div class="readout">
        <span class="label">Latitude</span>
        <span class="value">{{ position.latitude.toFixed(4) }}°</span>
      </div>
      <div class="readout">
        <span class="label">Longitude</span>
        <span class="value">{{ position.longitude.toFixed(4) }}°</span>
      </div>
      <div class="readout">
        <span class="label">Altitude</span>
        <span class="value">{{ position.altitudeKm.toFixed(1) }} km</span>
      </div>
      <div class="readout">
        <span class="label">Velocity</span>
        <span class="value">{{ position.speedKmS.toFixed(2) }} km/s</span>
        <span class="sub">{{ Math.round(position.speedKmS * 3600).toLocaleString('de-DE') }} km/h</span>
      </div>
    </div>
    <p v-else class="muted">Waiting for data…</p>

    <h2 class="panel-title">Seen from Berlin</h2>
    <div v-if="look" class="readouts">
      <div class="readout">
        <span class="label">Elevation</span>
        <span class="value">{{ look.elevation.toFixed(1) }}°</span>
      </div>
      <div class="readout">
        <span class="label">Azimuth</span>
        <span class="value">{{ look.azimuth.toFixed(0) }}° {{ toCompass(look.azimuth) }}</span>
      </div>
      <div class="readout wide">
        <span class="label">Status</span>
        <span class="value" :class="aboveHorizon ? 'ok' : 'muted'">
          {{ aboveHorizon ? '● ABOVE HORIZON' : '○ BELOW HORIZON' }}
        </span>
      </div>
    </div>

    <h2 class="panel-title">Data source</h2>
    <div class="readouts">
      <div class="readout">
        <span class="label">Source</span>
        <span class="value small">{{ tleSource ?? '—' }}</span>
      </div>
      <div class="readout">
        <span class="label">TLE age</span>
        <span class="value small" :class="{ warn: isStale }">
          {{ tleAgeMs !== null ? formatAge(tleAgeMs) : '—' }}
          <template v-if="isStale"> · STALE</template>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.readouts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.readout {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.readout.wide {
  grid-column: 1 / -1;
}

.sub {
  font-family: var(--font-data);
  font-size: 11px;
  color: var(--muted);
}

.small {
  font-size: 14px;
}

.ok {
  color: var(--ok);
}

.warn {
  color: var(--warn);
}
</style>