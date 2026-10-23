<script setup lang="ts">
import { computed } from 'vue'
import { toCompass, type Pass } from '../core/passes'
import { durationMin, formatCountdown, formatTime } from '../utils/format'

const props = defineProps<{
  pass: Pass | null
  now: Date
}>()

const inProgress = computed(
  () =>
    !!props.pass &&
    props.now.getTime() >= props.pass.rise.getTime() &&
    props.now.getTime() <= props.pass.set.getTime(),
)

const countdown = computed(() =>
  props.pass ? formatCountdown(props.pass.rise.getTime() - props.now.getTime()) : '',
)
</script>

<template>
  <section class="panel next">
    <h2 class="panel-title">Next visible pass · Berlin</h2>

    <template v-if="pass">
      <p v-if="inProgress" class="live">● IN PROGRESS: LOOK UP</p>
      <p v-else class="countdown">{{ countdown }}</p>
      <p class="sub">until AOS · {{ formatTime(pass.rise) }}</p>

      <div class="details">
        <div>
          <span class="label">Look</span>
          <span class="value">{{ toCompass(pass.riseAzimuth) }} → {{ toCompass(pass.setAzimuth) }}</span>
        </div>
        <div>
          <span class="label">Max</span>
          <span class="value">{{ pass.maxElevation.toFixed(0) }}°</span>
        </div>
        <div>
          <span class="label">Duration</span>
          <span class="value">{{ durationMin(pass.rise, pass.set) }} min</span>
        </div>
      </div>
    </template>

    <p v-else class="muted">No visible passes in the next 7 days.</p>
  </section>
</template>

<style scoped>
.next {
  border-color: rgba(255, 204, 0, 0.35);
}

.countdown,
.live {
  margin: 0;
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
}

.live {
  font-size: 20px;
  color: var(--ok);
  animation: blink 1.2s ease-in-out infinite;
}

.sub {
  margin: 4px 0 16px;
  font-family: var(--font-data);
  font-size: 12px;
  color: var(--muted);
}

.details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.details > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.details .value {
  font-size: 15px;
}

@keyframes blink {
  50% {
    opacity: 0.45;
  }
}
</style>