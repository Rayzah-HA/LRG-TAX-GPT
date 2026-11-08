# Plex Status

Full health check of the ANARCHY Plex server — services, drives, downloads, and libraries.

**Requires Remote Control access to ANARCHY (192.168.1.9)**

## Process

### 1. Container Health Check

Run on the connected Windows machine:

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Sort-Object
```

Check every expected container is running:
- plex (NATIVE — not in Docker, check via `Get-Process "Plex Media Server" -ErrorAction SilentlyContinue`)
- sonarr (:8989)
- radarr (:7878)
- sabnzbd (:8080)
- overseerr (:5055)
- tautulli (:8181)
- maintainerr (:6246)
- tdarr (:8265)
- posteria (:1818)
- kometa
- umtk (:2120)
- tssk

For any container NOT running, check logs:
```powershell
docker logs --tail 20 <container_name>
```

### 2. Plex Connectivity

```powershell
curl -s http://localhost:32400/identity
```

Verify Plex responds. Check remote access:
```powershell
curl -s "http://localhost:32400/status/sessions" -H "Accept: application/json"
```

### 3. Drive Space Inventory

```powershell
Get-Volume | Where-Object { $_.DriveLetter } | Sort-Object DriveLetter | Format-Table DriveLetter, FileSystemLabel, @{N='Size(GB)';E={[math]::Round($_.Size/1GB)}}, @{N='Free(GB)';E={[math]::Round($_.SizeRemaining/1GB)}}, @{N='%Free';E={[math]::Round($_.SizeRemaining/$_.Size*100,1)}}
```

Flag any drive below 5% free as critical.
Flag any drive below 15% free as warning.

**Known issue:** Disk 8 (I: drive) goes Offline on reboot. If I: is missing, tell the user to open Disk Management and bring Disk 8 online.

### 4. Sonarr Queue Check

```powershell
cmd /c 'docker exec sonarr curl -s "http://localhost:8989/api/v3/queue?pageSize=50" -H "X-Api-Key:16ef88eaee404fbcba706f3d9abe314a"' | ConvertFrom-Json | Select-Object -ExpandProperty records | Select-Object title, status, trackedDownloadStatus, trackedDownloadState | Format-Table
```

### 5. Radarr Queue Check

First get API key:
```powershell
cmd /c 'docker exec radarr curl -s "http://localhost:7878/api/v3/system/status" -H "X-Api-Key:<radarr_api_key>"'
```

### 6. SABnzbd Status

```powershell
cmd /c 'docker exec sabnzbd curl -s "http://localhost:8080/api?mode=queue&output=json"'
```

Check for:
- Stuck downloads
- Items with errors
- Disk space warnings from SABnzbd itself

### 7. Output Format

Present results as a clean dashboard:

```
ANARCHY PLEX SERVER STATUS
══════════════════════════════════════════
Date: YYYY-MM-DD HH:MM (Europe/Berlin)

SERVICES
────────────────────────────────────────
  Plex (native)    [ONLINE]   Port 32400
  Sonarr           [ONLINE]   Port 8989
  Radarr           [ONLINE]   Port 7878
  SABnzbd          [ONLINE]   Port 8080
  Overseerr        [ONLINE]   Port 5055
  Tautulli         [ONLINE]   Port 8181
  Maintainerr      [ONLINE]   Port 6246
  Tdarr            [ONLINE]   Port 8265
  Posteria         [ONLINE]   Port 1818
  Kometa           [UP]       (runs on schedule)
  UMTK             [UP]       Port 2120
  TSSK             [UP]       (runs via UMTK)

DRIVES
────────────────────────────────────────
  C:  Windows      34 GB free / 215 GB
  E:  TV2          ███████░░░  580 GB free / 1.9 TB
  I:  TV           █████████░  963 GB free / 7.5 TB
  J:  ext4         █████░░░░░  467 GB free / 1.8 TB
  K:  ext4 Shows   ████████░░  1.4 TB free / 13 TB
  L:  ext4 Cinema  █████████░  6.6 TB free / 7.3 TB
  W:  Warehouse    ████████░░  804 GB free / 1.9 TB

DOWNLOADS
────────────────────────────────────────
  SABnzbd queue:   X items
  Sonarr pending:  X imports
  Radarr pending:  X imports

ALERTS
────────────────────────────────────────
  [list any issues found]
```

### 8. Quick Fixes

If issues are found, offer to fix them:
- Container down → `docker restart <name>`
- Import stuck → check drive space, trigger manual import
- Plex not responding → check if process is running
- Drive offline → guide user through Disk Management

---

## Notes

- Plex is NATIVE Windows, NOT in Docker — do not try to manage it via docker commands
- ext4 drives (J:, K:, L:) are read natively by Windows 11 via drive letters
- Sonarr API key: 16ef88eaee404fbcba706f3d9abe314a
- All docker commands use `cmd /c '...'` wrapper for proper JSON quoting
- Timezone should be Europe/Berlin
