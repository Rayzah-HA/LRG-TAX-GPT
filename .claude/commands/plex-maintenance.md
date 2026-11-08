# Plex Maintenance

Run all maintenance tools in the correct order: UMTK, TSSK, Kometa, and optional Tdarr scan.

**Requires Remote Control access to ANARCHY (192.168.1.9)**

## Process

### 1. Pre-Flight Check

Verify containers are running before starting:
```powershell
docker ps --format "{{.Names}}: {{.Status}}" | Select-String "umtk|tssk|kometa|tdarr"
```

If any are down, restart them:
```powershell
docker restart <container_name>
```

### 2. Run UMTK (Upcoming Movies/TV Shows for Kometa)

UMTK creates collections of upcoming movies and TV shows for Plex.

```powershell
docker exec umtk python /app/UMTK.py
```

**Note:** UMTK automatically triggers TSSK when it finishes. Wait for UMTK to complete before running Kometa.

Monitor progress:
```powershell
docker logs --tail 30 -f umtk
```

(Ctrl+C to stop following logs once complete)

### 3. TSSK (TV Show Status for Kometa)

TSSK normally runs automatically after UMTK. To run standalone:

```powershell
docker exec tssk python /app/TSSK.py
```

### 4. Run Kometa

Kometa manages Plex collections, overlays, and metadata. Run after UMTK/TSSK so it picks up their output.

```powershell
docker exec kometa python kometa.py --run
```

Monitor progress (Kometa can take a while):
```powershell
docker logs --tail 50 -f kometa
```

### 5. Optional: Tdarr Health Check

Check Tdarr transcode queue:
```powershell
# Tdarr web UI at http://localhost:8265
# Check for pending/failed transcodes
```

### 6. Post-Maintenance Report

After all tools complete, provide summary:

```
MAINTENANCE COMPLETE
══════════════════════════════════════════
Date: YYYY-MM-DD HH:MM (Europe/Berlin)

  UMTK    [DONE]  Updated upcoming collections
  TSSK    [DONE]  Updated show status overlays
  Kometa  [DONE]  Refreshed X collections, X overlays

  Errors:  None / [list any]
  Runtime: ~XX minutes total
```

---

## Run Commands (Quick Reference)

| Tool | Command | What It Does |
|------|---------|--------------|
| UMTK | `docker exec umtk python /app/UMTK.py` | Updates upcoming movie/TV collections |
| TSSK | `docker exec tssk python /app/TSSK.py` | Updates show status labels |
| Kometa | `docker exec kometa python kometa.py --run` | Refreshes all Plex collections/overlays |
| All arr restart | `docker restart sabnzbd sonarr radarr tautulli overseerr maintainerr tdarr posteria kometa umtk tssk` | Restart entire arr stack |

## Scheduling

These should ideally run on a schedule via Docker's built-in scheduling or Windows Task Scheduler:
- **UMTK**: Daily at 3 AM
- **Kometa**: Daily at 4 AM (after UMTK finishes)
- **Tdarr**: Continuous (runs when idle)
