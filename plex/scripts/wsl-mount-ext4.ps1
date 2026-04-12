# WSL2 ext4 Drive Mount Script
# Run as Administrator on the new Windows PC
#
# TWO-PHASE APPROACH:
#   Phase 1: One-time setup — run manually to discover disk numbers and verify mounts
#   Phase 2: Startup persistence — once disk numbers are confirmed, automate at boot
#
# STEP 1: Find your ext4 disk numbers after plugging drives into the new PC:
#   GET-CimInstance -query "SELECT * from Win32_DiskDrive" | Select-Object DeviceID, Model, Size

# =====================================================
# PHASE 1: ONE-TIME MANUAL MOUNT (run this first)
# =====================================================
# After finding disk numbers, run these commands manually in PowerShell (Admin):
#
#   wsl --mount \\.\PhysicalDrive1 --partition 1  # Cinema (7.3T ext4)
#   wsl --mount \\.\PhysicalDrive2 --partition 1  # Shows (12.7T ext4)
#   wsl --mount \\.\PhysicalDrive3 --partition 2  # More TV (1.8T ext4, has 16MB first partition)
#
# Then verify in WSL2:
#   wsl -e lsblk
#   wsl -e df -h
#
# Note: wsl --mount auto-mounts to /mnt/wsl/PhysicalDriveX by default.
# If your docker-compose.yml references specific paths like /mnt/media,
# create symlinks or bind mounts inside WSL2 after confirming the drives work.

# =====================================================
# PHASE 2: STARTUP SCRIPT (use after disk numbers are confirmed)
# =====================================================
# Once you know the real PhysicalDrive numbers, update the values below
# and set this script to run at startup via Task Scheduler:
#   1. Open Task Scheduler
#   2. Create Task > "WSL2 Mount ext4 Drives"
#   3. Trigger: At startup (with 30-second delay)
#   4. Action: powershell.exe -ExecutionPolicy Bypass -File C:\plex\scripts\wsl-mount-ext4.ps1
#   5. Check "Run with highest privileges"
#   6. Conditions: uncheck "Start only if on AC power" if on a desktop

param(
    [switch]$DryRun  # Use -DryRun to see what would happen without mounting
)

Write-Host "=== WSL2 ext4 Drive Mounter ===" -ForegroundColor Cyan
Write-Host ""

# --- STEP 1: DISCOVER DISKS ---
Write-Host "Current physical disks:" -ForegroundColor Yellow
GET-CimInstance -query "SELECT * from Win32_DiskDrive" | Select-Object DeviceID, Model, @{N='SizeGB';E={[math]::Round($_.Size/1GB)}} | Format-Table -AutoSize
Write-Host ""

# --- STEP 2: UPDATE THESE AFTER DISCOVERING DISK NUMBERS ---
# Replace the Disk values with the actual PhysicalDrive numbers from the table above.
$drives = @(
    @{ Disk = "CHANGE_ME"; Partition = 1; Label = "Cinema (7.3T ext4)" },
    @{ Disk = "CHANGE_ME"; Partition = 1; Label = "Shows (12.7T ext4)" },
    @{ Disk = "CHANGE_ME"; Partition = 2; Label = "More TV (1.8T ext4)" }
)

# Check if disk numbers have been configured
$unconfigured = $drives | Where-Object { $_.Disk -eq "CHANGE_ME" }
if ($unconfigured) {
    Write-Host "Disk numbers not configured yet." -ForegroundColor Red
    Write-Host "Update the `$drives array in this script with the PhysicalDrive numbers from the table above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example — if Cinema is PhysicalDrive3:" -ForegroundColor Yellow
    Write-Host '  @{ Disk = 3; Partition = 1; Label = "Cinema (7.3T ext4)" }' -ForegroundColor White
    exit 1
}

# --- STEP 3: MOUNT ---
foreach ($drive in $drives) {
    Write-Host "Mounting $($drive.Label) (PhysicalDrive$($drive.Disk), partition $($drive.Partition))..." -ForegroundColor Yellow

    if ($DryRun) {
        Write-Host "  [DRY RUN] Would run: wsl --mount \\.\PhysicalDrive$($drive.Disk) --partition $($drive.Partition)" -ForegroundColor Magenta
        continue
    }

    $result = wsl --mount "\\.\PhysicalDrive$($drive.Disk)" --partition $drive.Partition 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Attached successfully" -ForegroundColor Green
    } else {
        Write-Host "  Result: $result" -ForegroundColor Red
        Write-Host "  (May already be mounted, or check disk number)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Verify mounts in WSL2: ===" -ForegroundColor Cyan
wsl -e df -h 2>$null | Select-String -Pattern "PhysicalDrive|mnt|media"
Write-Host ""
Write-Host "Next: docker compose up -d" -ForegroundColor Green
