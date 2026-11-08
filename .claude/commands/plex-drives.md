# Plex Drives

Monitor drive space, move content between drives, and manage the storage layout for the ANARCHY Plex server.

**Requires Remote Control access to ANARCHY (192.168.1.9)**

## Process

### 1. Drive Inventory

```powershell
Get-Volume | Where-Object { $_.DriveLetter } | Sort-Object DriveLetter | ForEach-Object {
    $pct = if ($_.Size -gt 0) { [math]::Round($_.SizeRemaining/$_.Size*100,1) } else { 0 }
    $bar = ('█' * [math]::Floor($pct/10)) + ('░' * (10 - [math]::Floor($pct/10)))
    [PSCustomObject]@{
        Drive = "$($_.DriveLetter):"
        Label = $_.FileSystemLabel
        'Size(GB)' = [math]::Round($_.Size/1GB)
        'Free(GB)' = [math]::Round($_.SizeRemaining/1GB)
        '%Free' = "$pct%"
        Bar = "[$bar]"
        Status = if ($pct -lt 5) { 'CRITICAL' } elseif ($pct -lt 15) { 'WARNING' } else { 'OK' }
    }
} | Format-Table -AutoSize
```

### 2. Plex Drive Map

| Drive | Format | Plex Library | Docker Mount |
|-------|--------|-------------|--------------|
| E: | NTFS | Reality TV, Anime | /tv2 |
| I: | NTFS | TV Shows, Anime | /i_drive |
| J: | ext4 | Anime Films, Movies Two | /j_drive |
| K: | ext4 | Shows (main TV) | /k_drive |
| L: | ext4 | Cinema (Movies) | /l_drive |
| W: | NTFS | Docker configs, downloads | /w_drive |

### 3. Space Alerts

Check for drives approaching full:
- **CRITICAL (<5% free):** Stop downloads to this drive immediately
- **WARNING (<15% free):** Plan content moves, consider cleanup
- **OK (>15% free):** No action needed

### 4. Content Moves

When moving content between drives, use Robocopy (handles large files, resumes on failure):

```powershell
# Template: Move folder from one drive to another
Start-Process robocopy -ArgumentList '"SOURCE_PATH" "DEST_PATH" /MOVE /E /R:2 /W:5 /MT:8 /LOG:W:\move-log.txt' -WindowStyle Minimized
```

After moving content:
1. Update Plex library paths (Settings > Libraries > Edit > Add folder)
2. Update Sonarr/Radarr root folders (Settings > Media Management > Root Folders)
3. Scan the new library location in Plex

### 5. Known Issues

**Disk 8 (I: drive) goes Offline on reboot:**
- Open Disk Management (Win+X > Disk Management)
- Right-click Disk 8 > Online
- If drive letter is missing, right-click > Change Drive Letter > assign I:

**ext4 drives (J:, K:, L:):**
- Windows 11 reads these natively — no WSL mount needed
- They appear as regular drive letters
- Read-only in some configurations; check write access if needed

### 6. Output Format

```
DRIVE STATUS — ANARCHY
══════════════════════════════════════════
Date: YYYY-MM-DD

PLEX MEDIA DRIVES
────────────────────────────────────────
  E:  TV2/Anime    [████████░░]  580 GB / 1.9 TB   OK
  I:  TV Shows     [█████████░]  963 GB / 7.5 TB   OK
  J:  Anime/Movies [█████░░░░░]  467 GB / 1.8 TB   WARNING
  K:  Shows Main   [████████░░]  1.4 TB / 13 TB    OK
  L:  Cinema       [█████████░]  6.6 TB / 7.3 TB   OK

SYSTEM DRIVES
────────────────────────────────────────
  C:  Windows      [███░░░░░░░]   34 GB / 215 GB   WARNING
  W:  Warehouse    [████████░░]  804 GB / 1.9 TB   OK

TOTAL: ~36 TB across 11 drives
PLEX STORAGE: ~32 TB across 6 media drives
```

---

## Drive Balancing Strategy

When drives get full, prioritize moves by:
1. Move completed/watched content first (use Tautulli watch history)
2. Move genres that make sense together (all Anime to one drive)
3. Keep active downloading paths on drives with most headroom
4. Never split a show across drives if avoidable
