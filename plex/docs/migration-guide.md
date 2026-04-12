# Plex Server Migration: Ubuntu → Windows Docker (WSL2)

## Overview

Migrating Plex Media Server from a bare-metal Ubuntu install to Docker Desktop on Windows, using WSL2 to handle ext4 drives without reformatting.

---

## Drive Inventory

| Drive | Size | Label | Format | Windows Readable | Plex Library |
|-------|------|-------|--------|-----------------|-------------|
| sda | 7.3T | Cinema | ext4 | No — WSL2 mount | Movies (cinema) |
| sdb | 12.7T | Shows | ext4 | No — WSL2 mount | TV Shows |
| sdc | 7.3T | Movies | NTFS | Yes | Movies |
| sdd | 7.3T | TV | NTFS | Yes | TV Shows |
| sde | 1.8T | TV2 | NTFS | Yes | Reality TV |
| sdg | 1.8T | More TV | ext4 | No — WSL2 mount | More TV |
| sdh | 3.6T | Cache | NTFS | Yes | Media cache |

**Total storage:** ~41.8 TB  
**OS drive:** nvme0n1 (465GB NVMe) — stays with Ubuntu machine, not migrated

### Mount Strategy

- **4 NTFS drives** (Movies, TV, TV2, Cache) → Windows reads natively, map via drive letters
- **3 ext4 drives** (Cinema, Shows, More TV) → `wsl --mount` into WSL2, no reformat needed

---

## Step-by-Step Migration

### Step 1: Back Up Plex Config on Ubuntu

Run the backup script (`scripts/plex-backup.sh`) on the existing server:

```bash
# Quick version:
sudo tar -czf ~/plex-backup.tar.gz \
  "/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Plug-in Support/Databases" \
  "/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Plug-in Support/Preferences" \
  "/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Preferences.xml" \
  "/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Metadata"
```

**What's preserved:** watch history, on-deck, users, playlists, collections, metadata, posters  
**What needs reconfiguring:** hardware transcoding, library path remapping, reverse proxy

### Step 2: Transfer Backup to Windows PC

```bash
# From Ubuntu, copy to Windows PC (adjust IP/path)
scp ~/plex-backup.tar.gz user@windows-pc:/c/plex/
```

Or use a USB drive / network share.

### Step 3: Plug In All Drives to Windows PC

1. Physically move all 7 drives to the new Windows machine
2. Windows will auto-assign letters to the 4 NTFS drives
3. Note which letter maps to which drive:

| Drive Letter | Label | Confirm with |
|-------------|-------|-------------|
| `?:\` | Movies (7.3T NTFS) | Check in File Explorer |
| `?:\` | TV (7.3T NTFS) | Check in File Explorer |
| `?:\` | TV2 (1.8T NTFS) | Check in File Explorer |
| `?:\` | Cache (3.6T NTFS) | Check in File Explorer |

### Step 4: Mount ext4 Drives via WSL2

This is a **one-time setup per drive**. `wsl --mount` attaches the physical disk directly into WSL2 — no reformatting needed.

**In PowerShell (Admin):**

```powershell
# First, find the disk numbers after plugging them in:
GET-CimInstance -query "SELECT * from Win32_DiskDrive" | Select-Object DeviceID, Model, Size

# Then mount each ext4 disk into WSL2 (replace 1,2,3 with actual disk numbers):
wsl --mount \\.\PhysicalDrive1 --partition 1   # Cinema (7.3T)
wsl --mount \\.\PhysicalDrive2 --partition 1   # Shows (12.7T)
wsl --mount \\.\PhysicalDrive3 --partition 2   # More TV (1.8T, has 16MB first partition)
```

Drives will auto-mount to `/mnt/wsl/PhysicalDriveX` inside WSL2. Verify:

```bash
wsl -e lsblk
wsl -e df -h
```

**Note:** These mounts do NOT survive a reboot. Once you confirm the disk numbers on the new PC, update `scripts/wsl-mount-ext4.ps1` and set it as a Windows Startup Task to automate this.

### Step 5: Extract Plex Config

```bash
mkdir -p C:\plex\config
cd C:\plex
tar -xzf plex-backup.tar.gz -C config/
```

### Step 6: Create Docker Compose

Use the `docker-compose.yml` in this directory. Fill in actual drive letters before running.

### Step 7: Launch

```bash
cd C:\plex
docker compose up -d
docker logs -f plex
```

### Step 8: Verify

1. Open `http://localhost:32400/web`
2. Check all libraries are visible
3. Confirm watch history carried over
4. Re-enable hardware transcoding if applicable
5. Test playback from each drive

---

## Post-Migration

- [ ] Confirm PhysicalDrive numbers on new PC, update `scripts/wsl-mount-ext4.ps1`
- [ ] Set up WSL2 mount script as Windows Scheduled Task (runs at startup)
- [ ] Re-enable hardware transcoding (Intel QuickSync / NVIDIA)
- [ ] Update any remote access / reverse proxy settings
- [ ] Verify Plex Pass is active
- [ ] Test remote streaming
- [ ] Decommission old Ubuntu Plex server

---

## What Ports Over vs. What Doesn't

| Ports Over | Doesn't Port |
|---|---|
| Watch history & on-deck | Hardware transcoding settings |
| Library metadata & posters | Library paths (need remapping) |
| Users & sharing | OS-level scheduled tasks |
| Playlists & collections | Reverse proxy / DNS config |
| Server preferences | Plex Pass (re-login required) |

---

## Troubleshooting

### Libraries show empty after migration
Library paths changed. In Plex Settings > Libraries, edit each library and update the folder paths to match the Docker volume mounts.

### ext4 drives not visible in Docker
Make sure `wsl --mount` succeeded and the drives are mounted inside WSL2 before starting the container.

### Permission errors on media files
Check PUID/PGID in docker-compose.yml match the file ownership. Run `id` in WSL2 to find your UID/GID.

### Plex can't find the database
Ensure the backup was extracted to the right path: `C:\plex\config\Library\Application Support\Plex Media Server\`
