# Plex Cleanup

Audit and clean up Sonarr series, Radarr movies, and download queues. Focus on removing unwanted content and keeping libraries curated.

**Requires Remote Control access to ANARCHY (192.168.1.9)**

## Philosophy

Larry's rule: **"Focus on adding and not removing things."**
- Never delete media files without explicit confirmation
- Never kill processes without verifying they should be stopped
- Prefer disabling monitoring over deleting series
- Always explain what you're about to do and why

## Process

### 1. Sonarr Series Audit

Pull the full series list:
```powershell
cmd /c 'docker exec sonarr curl -s "http://localhost:8989/api/v3/series" -H "X-Api-Key:16ef88eaee404fbcba706f3d9abe314a"' | ConvertFrom-Json | ForEach-Object { [PSCustomObject]@{ Title=$_.title; Status=$_.status; Monitored=$_.monitored; Episodes=$_.statistics.episodeCount; SizeGB=[math]::Round($_.statistics.sizeOnDisk/1GB,1); Path=$_.path } } | Sort-Object Title | Format-Table -AutoSize
```

Categorize each series:

**Keep & Monitor** (active, currently airing, or recently ended shows Larry watches):
- Shows with recent episodes downloading
- Shows Larry has specifically mentioned wanting

**Stop Monitoring** (ended/cancelled shows that are complete):
- Fully downloaded series that are no longer airing
- Series where all available episodes are already on disk

**Flag for Review** (potentially unwanted):
- Shows with very few episodes downloaded (might be accidental adds)
- Shows Larry has specifically said he doesn't want (e.g., Joseline's Cabaret, Married at First Sight, Lip Sync Battle)
- Reality shows that seem randomly added

### 2. Present the Audit

Show results in a clean table:

```
SONARR SERIES AUDIT
══════════════════════════════════════════

FLAGGED FOR REMOVAL (X series)
────────────────────────────────────────
  [ ] Joseline's Cabaret      — 3 eps, 2.1 GB — Larry said remove
  [ ] Married at First Sight   — 12 eps, 8.4 GB — Random pull
  [ ] Lip Sync Battle          — 5 eps, 1.8 GB — Random pull

SUGGEST STOP MONITORING (X series)
────────────────────────────────────────
  [ ] Show Name — ended 2024, all eps downloaded

ACTIVE & GOOD (X series)
────────────────────────────────────────
  [x] Show Name — S05 airing, monitored
```

### 3. Execute Cleanup (only after user confirms)

To unmonitor a series:
```powershell
cmd /c 'docker exec sonarr curl -s -X PUT "http://localhost:8989/api/v3/series/<id>" -H "X-Api-Key:16ef88eaee404fbcba706f3d9abe314a" -H "Content-Type: application/json" -d \"{\\\"monitored\\\":false}\"'
```

To delete a series (removes from Sonarr, optionally deletes files):
```powershell
# Without deleting files (safe):
cmd /c 'docker exec sonarr curl -s -X DELETE "http://localhost:8989/api/v3/series/<id>?deleteFiles=false" -H "X-Api-Key:16ef88eaee404fbcba706f3d9abe314a"'

# With deleting files (confirm with Larry first):
cmd /c 'docker exec sonarr curl -s -X DELETE "http://localhost:8989/api/v3/series/<id>?deleteFiles=true" -H "X-Api-Key:16ef88eaee404fbcba706f3d9abe314a"'
```

### 4. Download Queue Cleanup

Check for stuck/failed items:
```powershell
cmd /c 'docker exec sonarr curl -s "http://localhost:8989/api/v3/queue?pageSize=100" -H "X-Api-Key:16ef88eaee404fbcba706f3d9abe314a"' | ConvertFrom-Json | Select-Object -ExpandProperty records | Where-Object { $_.trackedDownloadStatus -ne 'ok' } | Select-Object title, status, trackedDownloadStatus | Format-Table
```

Remove failed items from queue:
```powershell
cmd /c 'docker exec sonarr curl -s -X DELETE "http://localhost:8989/api/v3/queue/<id>?removeFromClient=true&blocklist=true" -H "X-Api-Key:16ef88eaee404fbcba706f3d9abe314a"'
```

### 5. SABnzbd Cleanup

Clear completed downloads:
```powershell
cmd /c 'docker exec sabnzbd curl -s "http://localhost:8080/api?mode=history&output=json&limit=50"'
```

Check downloads folder size:
```powershell
(Get-ChildItem "W:\docker\downloads\complete" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
```

### 6. Radarr Audit (similar pattern)

Pull movie list and check for:
- Movies with stale root folders (H:\, old WSL mounts after DB restore)
- Unmonitored movies taking up space
- Missing movies that should be searched

---

## Known Unwanted Shows

Larry has explicitly said he doesn't want these:
- Joseline's Cabaret
- Married at First Sight
- Lip Sync Battle

Add to this list as Larry identifies more.

## Output Style

- Clean tables, not walls of JSON
- Group by action needed
- Show disk space impact of cleanup
- End with summary: "Freed X GB, removed Y unwanted series, Z items cleared from queue"
