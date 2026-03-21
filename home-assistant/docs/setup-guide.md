# Home Assistant Setup Guide

## Overview

Larry's smart home runs on **Home Assistant Container** via Docker, integrated into the existing home lab infrastructure.

---

## Docker Deployment

### Prerequisites

- Docker & Docker Compose installed
- Dedicated host or VM with network access to IoT devices
- Recommended: separate VLAN for IoT devices

### Docker Compose

```yaml
version: '3.8'

services:
  homeassistant:
    container_name: homeassistant
    image: ghcr.io/home-assistant/home-assistant:stable
    restart: unless-stopped
    privileged: true
    network_mode: host
    volumes:
      - ./config:/config
      - /etc/localtime:/etc/localtime:ro
      - /run/dbus:/run/dbus:ro
    environment:
      - TZ=America/New_York
```

### Launching

```bash
# Start Home Assistant
docker compose up -d

# View logs
docker compose logs -f homeassistant

# Restart after config changes
docker compose restart homeassistant

# Update to latest version
docker compose pull && docker compose up -d
```

### Access

- Web UI: `http://<host-ip>:8123`
- API: `http://<host-ip>:8123/api/`

---

## Network Architecture

```
[Router/Firewall]
    |
    +-- [Main VLAN] -- Docker Host -- Home Assistant Container
    |
    +-- [IoT VLAN] -- Smart Devices (lights, sensors, cameras, etc.)
    |
    +-- [Guest VLAN] -- Guest Wi-Fi
```

### Recommended Network Setup

- **IoT VLAN**: Isolate smart devices from main network
- **Firewall rules**: Allow HA container to reach IoT VLAN, block IoT from reaching main network
- **mDNS relay**: Enable if using discovery-based integrations (Chromecast, ESPHome, etc.)

---

## Backup Strategy

### Automated Backups

- Use HA's built-in backup feature (Settings > System > Backups)
- Schedule weekly full backups
- Store copies in `home-assistant/backups/` (git-ignored for large files)

### Config Version Control

- Track `configuration.yaml`, automations, and scripts in this repo
- Sensitive data (secrets, tokens) goes in `secrets.yaml` (git-ignored)
- Use `.gitignore` to exclude large/binary backup files

---

## Useful Add-ons (Docker Alternatives)

Since you're running Container (not HA OS), add-ons need separate Docker containers:

| Service | Docker Image | Purpose |
|---------|-------------|---------|
| Mosquitto | `eclipse-mosquitto` | MQTT broker |
| Zigbee2MQTT | `koenkk/zigbee2mqtt` | Zigbee device management |
| ESPHome | `ghcr.io/esphome/esphome` | ESP device management |
| Node-RED | `nodered/node-red` | Visual automation flows |
| InfluxDB | `influxdb` | Long-term data storage |
| Grafana | `grafana/grafana` | Data visualization |

---

## Security Checklist

- [ ] Change default admin password
- [ ] Enable 2FA for all users
- [ ] Use `secrets.yaml` for all tokens and passwords
- [ ] Set up SSL/TLS (via reverse proxy like Nginx or Traefik)
- [ ] Restrict external access (use VPN or Cloudflare Tunnel)
- [ ] Keep HA and Docker images updated
- [ ] Review integrations and remove unused ones
- [ ] Monitor login attempts in HA logs

---

## Next Steps

1. Complete device inventory (`device-inventory.md`)
2. Plan automations (`automations/README.md`)
3. Design dashboards (`dashboards/README.md`)
4. Set up monitoring and alerting
