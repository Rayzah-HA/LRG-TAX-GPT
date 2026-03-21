# Device Inventory

## Smart Home Devices

Track all connected devices, their protocols, and integration status.

### Hubs & Controllers
| Device | Protocol | Integration | Location | Status |
|--------|----------|-------------|----------|--------|
| *Add your hub here* | Zigbee/Z-Wave/WiFi | - | - | - |

### Lighting
| Device | Count | Protocol | Integration | Location | Status |
|--------|-------|----------|-------------|----------|--------|
| *Add lights here* | - | - | - | - | - |

### Climate
| Device | Protocol | Integration | Location | Status |
|--------|----------|-------------|----------|--------|
| *Add thermostat here* | - | - | - | - |

### Security
| Device | Count | Protocol | Integration | Location | Status |
|--------|-------|----------|-------------|----------|--------|
| *Add cameras here* | - | - | - | - | - |
| *Add door sensors here* | - | - | - | - | - |
| *Add locks here* | - | - | - | - | - |

### Media
| Device | Protocol | Integration | Location | Status |
|--------|----------|-------------|----------|--------|
| *Add TV/speakers here* | - | - | - | - |

### Sensors
| Device | Count | Protocol | Integration | Measures | Status |
|--------|-------|----------|-------------|----------|--------|
| *Add sensors here* | - | - | - | - | - |

### Other
| Device | Protocol | Integration | Location | Status |
|--------|----------|-------------|----------|--------|
| *Add other devices here* | - | - | - | - |

---

## Protocol Summary

| Protocol | Device Count | Hub Required | Notes |
|----------|-------------|--------------|-------|
| Wi-Fi | 0 | No | Direct connection |
| Zigbee | 0 | Yes (coordinator) | Low power, mesh network |
| Z-Wave | 0 | Yes (controller) | Mesh network, good range |
| Bluetooth | 0 | No (if HA host has BT) | Short range |
| Matter | 0 | No | New standard, cross-platform |

---

## Network Map

```
[Home Assistant (Docker)]
    |
    +-- [Wi-Fi Devices]
    |       +-- Smart TV
    |       +-- Smart Plugs
    |       +-- Cameras
    |
    +-- [Zigbee Coordinator]
    |       +-- Lights
    |       +-- Sensors
    |       +-- Buttons
    |
    +-- [Z-Wave Controller]
    |       +-- Locks
    |       +-- Thermostats
    |
    +-- [MQTT Broker]
            +-- ESPHome Devices
            +-- Custom Sensors
```

---

## Shopping List / Wishlist

| Device | Purpose | Protocol | Est. Cost | Priority |
|--------|---------|----------|-----------|----------|
| *Add items here* | - | - | - | - |
