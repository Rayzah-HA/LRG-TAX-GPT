# Dashboard Planning

## Dashboard Layout

### Main Dashboard (Home)
Overview of the entire house at a glance.

```
+-------------------+-------------------+
|   Weather &       |   Quick Actions   |
|   Outdoor Temp    |   (Scenes/Scripts)|
+-------------------+-------------------+
|   Room Cards      |   Security        |
|   - Living Room   |   - Lock Status   |
|   - Bedroom       |   - Camera Feeds  |
|   - Kitchen       |   - Alarm Status  |
|   - Office        |                   |
+-------------------+-------------------+
|   Climate         |   Energy          |
|   - Thermostat    |   - Usage Today   |
|   - Humidity      |   - Solar (if any)|
+-------------------+-------------------+
```

### Room Dashboards
Per-room detail views with:
- Lights (with brightness/color controls)
- Temperature & humidity
- Motion sensor status
- Media controls (if applicable)
- Window/door sensor status

### Security Dashboard
- Camera feeds (live + recent clips)
- Door/window sensor status
- Lock controls
- Motion alerts log
- Alarm panel

### Media Dashboard
- Active media players
- Speaker groups
- Quick play buttons
- Now playing info

---

## Recommended Dashboard Cards

| Card Type | Use Case |
|-----------|----------|
| `mushroom` | Clean, modern entity cards |
| `button-card` | Custom styled buttons |
| `mini-graph-card` | Sensor history graphs |
| `layout-card` | Custom grid layouts |
| `frigate-card` | Camera feeds (if using Frigate) |
| `weather-card` | Weather overview |
| `auto-entities` | Dynamic entity lists |

---

## HACS Frontend Recommendations

Install via HACS (Home Assistant Community Store):

- **Mushroom Cards** - Modern, clean card collection
- **Mini Graph Card** - Beautiful sensor graphs
- **Button Card** - Highly customizable buttons
- **Browser Mod** - Browser-based controls and popups
- **Card Mod** - CSS styling for any card
- **Layout Card** - Custom dashboard layouts
