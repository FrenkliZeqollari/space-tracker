<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchTle, type Tle } from './services/tle'

const ISS_NORAD_ID = 25544
const tle = ref<Tle | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    tle.value = await fetchTle(ISS_NORAD_ID)
  } catch (e) {
    error.value = (e as Error).message
  }
})
</script>

<template>
  <main>
    <h1>ISS data</h1>
    <p v-if="error">Error: {{ error }}</p>
    <pre v-else-if="tle">{{ tle.name }}
{{ tle.line1 }}
{{ tle.line2 }}</pre>
    <p v-else>Loading…</p>
  </main>
</template>