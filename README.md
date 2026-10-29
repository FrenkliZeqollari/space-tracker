# 🛰️ Space Tracker: ISS & Artemis II Mission Control

A mission-control style web app that tracks the **International Space Station live**, predicts **when you can see it with your own eyes**, and replays **NASA's Artemis II flight around the Moon** using real trajectory data.

Built with Vue 3 + TypeScript, with all the orbit calculations running in the browser.


---

## ✨ Features

### 🌍 Live ISS tracking
- Real-time position (latitude, longitude, altitude, velocity), updated every second
- 3D globe showing the ISS and its orbit for the next 95 minutes, **to scale**
- "Follow ISS" camera mode

### 🔭 Visible pass prediction
- Calculates every ISS pass over Berlin for the next 7 days
- Checks whether each pass is **visible to the naked eye**: the ISS must be above the horizon, the sky must be dark, and the ISS itself must be in sunlight (not in Earth's shadow)
- Live **T− countdown to AOS** (Acquisition of Signal) for the next visible pass
- Tells you where to look ("W → E, up to 74°")

### 🌕 Artemis II mission replay
- Replays the April 2026 crewed flight around the Moon with real data from **NASA JPL Horizons**
- Timeline with play, pause, scrubbing and speed control
- Live readouts: mission elapsed time, distance from Earth, altitude above the Moon, speed
- The scene is lit with the Sun's real direction at each moment

### 🖥️ Mission-control UI
- Dark operator-style console, responsive for phone and desktop
- UTC and local clocks
- **Data-quality indicator**: the status light turns amber when the orbital data is more than 3 days old
- Telemetry in a monospace font with tabular digits, so live numbers don't jitter

---

##  How it works

### From two lines of text to a moving dot
Satellite orbits are published as **TLEs** (Two-Line Element sets), a compact format from the punch-card era. The app turns them into positions like this:

```
TLE + time → SGP4 → position in space (ECI) → + Earth's rotation → latitude / longitude / altitude
```

**SGP4** is the standard model for predicting satellite orbits from TLEs. The TLE is fetched once, and from then on every position is **calculated locally**, with no internet needed.

### Can I see it?
For each moment, the app checks three conditions:

| Condition | Check |
|---|---|
| ISS high enough above the horizon | elevation ≥ 10° |
| Dark enough for the observer | Sun below −6° (civil twilight) |
| ISS lit by the Sun | not inside Earth's shadow (cylindrical shadow model) |

Passes are found by stepping through the next 7 days in 30-second steps.

### Redundant data sources
Orbital data comes from **CelesTrak**, with an automatic fallback to the **TLE API** if CelesTrak is slow or down. Every request has a timeout, so the app never hangs on a dead server.

---

## 🏗️ Architecture

```
scripts/
  fetch_artemis.py      Python: downloads the Artemis II trajectory from JPL Horizons
public/data/
  artemis2.json         Pre-downloaded trajectory (historical data, never changes)
src/
  core/                 Pure orbit math: no Vue, no network, easy to test
    position.ts         TLE parsing, SGP4 propagation, ground track
    passes.ts           Look angles, Earth-shadow model, pass prediction
    sun.ts              Sun position (Astronomical Almanac formula)
    trajectory.ts       Interpolation of trajectory data (binary search + linear)
  services/             Talking to the outside world
    tle.ts              TLE fetching with fallback sources and timeouts
    artemis.ts          Loads the Artemis II data file
  components/           Vue UI
    GlobeView.vue       3D Earth (globe.gl / three.js)
    ArtemisReplay.vue   Earth–Moon scene (three.js)
    TelemetryPanel.vue  NextPass.vue  PassList.vue
  utils/format.ts       Time, countdown and number formatting
```

**Main design rule:** `core/` never imports from Vue or `services/`. The orbit math is plain TypeScript that could run in a test, in Node, or be rewritten in another language without touching the UI.

---

##  Getting started

### In the browser (no install)
1. Click **Code → Codespaces → Create codespace on main**
2. In the terminal, run `npm install`, then `npm run dev`
3. Open the forwarded port **5173**

### Locally
Requires Node.js 20+.

```bash
git clone https://github.com/FrenkliZeqollari/space-tracker.git
cd space-tracker
npm install
npm run dev
```

### Re-download the Artemis II data (optional)
The data is already in the repo. To fetch it again from NASA (requires Python 3.9+, no extra packages):

```bash
python3 scripts/fetch_artemis.py
```

---

##  Tech stack

| Area | Tools |
|---|---|
| Frontend | Vue 3, TypeScript, Vite |
| Orbit mechanics | [satellite.js](https://github.com/shashwatak/satellite-js) (SGP4) |
| 3D | [globe.gl](https://github.com/vasturiano/globe.gl), [three.js](https://threejs.org) |
| Data script | Python 3 (standard library only) |

---

## 📡 Data sources & credits

- **[CelesTrak](https://celestrak.org)**: ISS orbital elements (primary source)
- **[TLE API](https://tle.ivanstanojevic.me)**: ISS orbital elements (fallback)
- **[NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)**: Artemis II Orion trajectory (ID −1024) and Moon positions
- **[three-globe](https://github.com/vasturiano/three-globe)**: Earth textures

Thank you to these projects for making space data free and open.

---

##  Accuracy & known limits

Being honest about limits is part of building reliable systems:

- **Pass times are accurate to about ±30 seconds**, because of the 30-second search step. Maximum elevation can be off by a few degrees for high passes.
- **Predictions get less precise further ahead.** TLEs age, mostly because of atmospheric drag, so day 7 is less accurate than day 1.
- **The Artemis replay interpolates straight lines** between 5-minute data points, so values near the lunar flyby are close to the official figures but not exact.
- Earth's rotation is not shown in the Artemis scene.

---

##  What I learned

- How satellite orbits are described (TLEs, inclination, eccentricity, epoch) and predicted (SGP4)
- Coordinate systems: ECI, Earth-fixed, latitude/longitude, and observer look angles (azimuth/elevation), plus why mixing them up has destroyed real spacecraft
- Why space software **calculates in UTC** and only displays local time (the app handles the DST switch correctly)
- **Redundancy and timeouts** for unreliable external data sources
- Separating pure calculation logic from UI and network code
- Building 3D scenes with three.js at real astronomical scale
- My first Python script, using a real NASA API

---

##  Roadmap

- [ ] More precise pass times (refine the peak with 1-second steps)
- [ ] Choose your own location instead of Berlin
- [ ] Upcoming rocket launches with live countdowns
- [ ] Push notifications before a visible ISS pass
- [ ] Track more satellites (Starlink, Hubble, Tiangong)
- [ ] Flight software experiments with NASA F Prime on a Raspberry Pi

---

##  Author

**Frenkli Zeqollari**, Software Engineering student in Berlin with a passion for space.

🌐 [frenkli.dev](https://www.frenkli.dev) · 🐙 [GitHub](https://github.com/FrenkliZeqollari)
