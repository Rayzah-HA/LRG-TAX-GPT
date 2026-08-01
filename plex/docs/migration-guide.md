# Plex Server Setup — Windows Native + Docker Arr Stack

## Overview

Plex Media Server runs **natively on Windows** (not in Docker) because ext4 drives are readable natively in Windows 11 via drive letters — no WSL mount hacks needed.

The *arr stack (Sonarr, Radarr, SABnzbd, etc.) runs in **Docker Desktop** on the same machine.

---

## Current Location: Germany

- **Local IP:** 192.168.1.9
- **Timezone:** Europe/Berlin

---

## Drive Inventory (as of 2026-08-01)

| Letter | Disk# | Label | Size | Format | Content | Free |
|--------|-------|-------|------|--------|---------|------|
| C: | 4 | Windos X | 215 GB | NTFS | Windows OS | 34 GB |
| D: | 1 | Earth 2 | 466 GB | NTFS | Misc | 306 GB |
| E: | 0 | TV2 | 1.9 TB | NTFS | Reality TV + Anime (moved from I:) | ~1.6 TB |
| F: | 3 | Games Mechanical | 1.9 TB | NTFS | Games | 591 GB |
| G: | 6 | Arsenal | 4.7 TB | NTFS | Games (Skyrim, BG3, etc.) | 798 GB |
| I: | 8 | TV | 7.5 TB | NTFS | TV Shows + Anime | ~21 GB (was 116MB) |
| J: | 7 | (ext4) | 1.8 TB | ext4 | Anime Films + Movies Two | 467 GB |
| K: | 9 | (ext4) | 13 TB | ext4 | Shows (main TV library) | 1.4 TB |
| L: | 10 | (ext4) | 7.3 TB | ext4 | Cinema (Movies) | 6.6 TB |
| R: | 5 | Games M.2 | 932 GB | NTFS | Games SSD | 254 GB |
| W: | 2 | Warehouse | 1.9 TB | NTFS | Docker configs, Plex config | 804 GB |

**Total storage:** ~36 TB across 11 drives
**ext4 drives (J:, K:, L:):** Windows 11 reads natively — no WSL mount needed

### Important: Disk 8 (I: drive) goes Offline on reboot
Disk 8 may show as "Offline" after a reboot. Fix in Disk Management: right-click Disk 8 > Online. Then assign drive letter I: if needed.

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Windows 11 (ANARCHY)          │
│                                         │
│  ┌─────────────────┐                    │
│  │  Plex (native)  │ ← reads all       │
│  │  Port 32400     │   drives directly  │
│  └─────────────────┘                    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Docker Desktop (WSL2 backend)  │    │
│  │                                 │    │
│  │  ┌─────────┐  ┌──────────┐     │    │
│  │  │ Sonarr  │  │ SABnzbd  │     │    │
│  │  │ :8989   │  │ :8080    │     │    │
│  │  ├─────────┤  ├──────────┤     │    │
│  │  │ Radarr  │  │ Tautulli │     │    │
│  │  │ :7878   │  │ :8181    │     │    │
│  │  ├─────────┤  ├──────────┤     │    │
│  │  │Overseerr│  │Maintainerr│    │    │
│  │  │ :5055   │  │ :6246    │     │    │
│  │  ├─────────┤  ├──────────┤     │    │
│  │  │  Tdarr  │  │ Kometa   │     │    │
│  │  │:8265-66 │  │          │     │    │
│  │  ├─────────┤  ├──────────┤     │    │
│  │  │Posteria │  │  UMTK    │     │    │
│  │  │ :1818   │  │  :2120   │     │    │
│  │  ├─────────┤  ├──────────┤     │    │
│  │  │         │  │  TSSK    │     │    │
│  │  │         │  │          │     │    │
│  │  └─────────┘  └──────────┘     │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## Plex (Native Windows Install)

Plex runs natively because Docker had issues accessing ext4 drives via WSL mount paths. Native Plex reads all drive letters (including J:, K:, L: ext4 drives) directly.

- **Web UI:** http://localhost:32400/web
- **Config:** Default Windows Plex location
- **Starts at boot:** Yes (system tray)

### Plex Libraries → Drive Mapping

| Library | Drive(s) |
|---------|----------|
| TV Shows | I:\T.V. Shows, K:\ |
| Movies | L:\ |
| Anime Series | I:\Anime (moving to E:\Anime) |
| Anime Films | J:\Anime Films |
| Reality TV | E:\ |
| Wrestling | K:\ (subset) |

---

## Docker Arr Stack

### Config Locations
- **Compose file:** W:\docker\docker-compose.yml
- **App data:** W:\docker\appdata\{sonarr,radarr,sabnzbd,...}
- **Downloads:** W:\docker\downloads

### Sonarr Root Folders (container paths)
- `/tv2` → mapped to some drive
- `/i_drive/T.V. Shows` → I:\T.V. Shows
- `/i_drive/Anime` → I:\Anime

### Key Ports
| Service | Port | URL |
|---------|------|-----|
| Plex | 32400 | http://localhost:32400/web |
| Sonarr | 8989 | http://localhost:8989 |
| Radarr | 7878 | http://localhost:7878 |
| SABnzbd | 8080 | http://localhost:8080 |
| Overseerr | 5055 | http://localhost:5055 |
| Tautulli | 8181 | http://localhost:8181 |
| Maintainerr | 6246 | http://localhost:6246 |
| Tdarr | 8265 | http://localhost:8265 |
| Posteria | 1818 | http://localhost:1818 |
| UMTK | 2120 | http://localhost:2120 |

### Manual Run Commands
```powershell
# UMTK (also runs TSSK after)
docker exec umtk python /app/UMTK.py

# TSSK standalone
docker exec tssk python /app/TSSK.py

# Kometa
docker exec kometa python kometa.py --run

# Restart all arr services
docker restart sabnzbd sonarr radarr tautulli overseerr maintainerr tdarr posteria kometa umtk tssk
```

---

## Radarr Recovery

Radarr's database corrupted (migration failure). Restored from April 10, 2026 backup:
- Backup: `radarr_backup_v6.0.4.10291_2026.04.10_11.07.45.zip`
- Broken DB saved as: `radarr.db.broken` and `radarr.db.corrupt`

---

## Known Issues

### I: drive fills up → Sonarr imports fail
When I: hits 0 bytes free, Sonarr downloads complete but sit in `/downloads/complete/` with status `importPending` / `Failed to import episode`. Fix: free space on I:, then Sonarr auto-retries.

### Disk 8 goes Offline after reboot
Open Disk Management > right-click Disk 8 > Online > assign letter I: if missing.

---

## TODO

- [ ] After Anime move completes: add E:\Anime to Plex Anime library
- [ ] Update Sonarr anime root folder from `/i_drive/Anime` to E: mount path
- [ ] Update timezone in arr stack docker-compose to Europe/Berlin
- [ ] Verify Radarr root folders are correct after DB restore
- [ ] Consider moving more content off I: to balance drives
- [ ] Set up Maintainerr rules for auto-cleanup of watched content
- [ ] Misc backup from Ubuntu server (UMTK/config, TSSK/config, Scripts, cloudflared) — file at ~/misc-backup.tar.gz on Ubuntu, transfer when ready
