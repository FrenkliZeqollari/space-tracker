const pad = (n: number) => String(n).padStart(2, '0')

// "Sa., 24.10., 05:46"
export function formatTime(d: Date): string {
  return d.toLocaleString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "05:46:12" in any time zone ('UTC', 'Europe/Berlin'...)
export function formatClock(d: Date, timeZone: string): string {
  return d.toLocaleTimeString('de-DE', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Time until AOS: "T−19:13:05" or "T−1d 19:13:05"
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86_400)
  const h = Math.floor((total % 86_400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const clock = `${pad(h)}:${pad(m)}:${pad(s)}`
  return days > 0 ? `T−${days}d ${clock}` : `T−${clock}`
}

// Age of data: "1d 9h" or "5h 12m"
export function formatAge(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000))
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin % 1440) / 60)
  const minutes = totalMin % 60
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`
}

export function durationMin(rise: Date, set: Date): number {
  return Math.round((set.getTime() - rise.getTime()) / 60_000)
}