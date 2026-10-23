<script setup lang="ts">
import { toCompass, type Pass } from '../core/passes'
import { durationMin, formatTime } from '../utils/format'

defineProps<{
  passes: Pass[]
  now: Date
}>()

const isPast = (p: Pass, now: Date) => p.set.getTime() < now.getTime()
const isActive = (p: Pass, now: Date) =>
  p.rise.getTime() <= now.getTime() && now.getTime() <= p.set.getTime()
</script>

<template>
  <section class="panel">
    <h2 class="panel-title">Pass schedule · next 7 days</h2>

    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>AOS</th>
            <th>Max</th>
            <th>Direction</th>
            <th>Duration</th>
            <th>Visible</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in passes"
            :key="p.rise.getTime()"
            :class="{ past: isPast(p, now), active: isActive(p, now), visible: p.visible }"
          >
            <td>{{ formatTime(p.rise) }}</td>
            <td>{{ p.maxElevation.toFixed(0) }}°</td>
            <td>{{ toCompass(p.riseAzimuth) }} → {{ toCompass(p.setAzimuth) }}</td>
            <td>{{ durationMin(p.rise, p.set) }} min</td>
            <td>{{ p.visible ? '★ YES' : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
/* On small phones the table can scroll sideways inside the panel */
.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  white-space: nowrap;
}

th {
  padding: 8px 12px;
  border-bottom: 1px solid var(--panel-border);
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--muted);
}

td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(26, 35, 51, 0.6);
  color: var(--muted);
}

tr.visible td {
  color: var(--accent);
}

tr.active td {
  color: var(--ok);
  background: rgba(61, 220, 132, 0.08);
}

tr.past {
  opacity: 0.35;
}
</style>