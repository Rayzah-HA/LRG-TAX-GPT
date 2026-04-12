# WSL2 ext4 Drive Mount Script
# Run as Administrator after each Windows reboot
#
# IMPORTANT: Update PhysicalDrive numbers after plugging drives into Windows PC.
# Find them with: Get-Disk | Select-Object Number, FriendlyName, Size
#
# To automate at startup, create a Scheduled Task:
#   1. Open Task Scheduler
#   2. Create Task > "WSL2 Mount ext4 Drives"
#   3. Trigger: At startup
#   4. Action: powershell.exe -ExecutionPolicy Bypass -File C:\plex\scripts\wsl-mount-ext4.ps1
#   5. Check "Run with highest privileges"

Write-Host "=== Mounting ext4 drives into WSL2 ===" -ForegroundColor Cyan

# Ensure WSL2 is running
Write-Host "Starting WSL2..." -ForegroundColor Yellow
wsl --list --verbose

# --- UPDATE THESE DISK NUMBERS ---
# Run Get-Disk to find which PhysicalDrive number each ext4 disk is.

$drives = @(
    @{ Disk = 1; Partition = 1; Label = "Cinema (7.3T ext4)";  MountPoint = "/mnt/media/cinema" },
    @{ Disk = 2; Partition = 1; Label = "Shows (12.7T ext4)";  MountPoint = "/media/rayzah/Shows1" },
    @{ Disk = 3; Partition = 2; Label = "More TV (1.8T ext4)"; MountPoint = "/mnt/more_tv" }
)

foreach ($drive in $drives) {
    Write-Host ""
    Write-Host "Mounting $($drive.Label) (PhysicalDrive$($drive.Disk), partition $($drive.Partition))..." -ForegroundColor Yellow

    # Attach drive to WSL2
    $result = wsl --mount "\\.\PhysicalDrive$($drive.Disk)" --partition $drive.Partition 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Attached to WSL2 successfully" -ForegroundColor Green
    } else {
        Write-Host "  wsl --mount returned: $result" -ForegroundColor Red
        Write-Host "  Drive may already be mounted or disk number is wrong" -ForegroundColor Red
        continue
    }

    # Create mount point and mount inside WSL2
    wsl -e sudo mkdir -p $drive.MountPoint
    Write-Host "  Mounted at $($drive.MountPoint)" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Done. Verify mounts: ===" -ForegroundColor Cyan
wsl -e df -h | Select-String -Pattern "mnt|media"
Write-Host ""
Write-Host "You can now start Plex: docker compose up -d" -ForegroundColor Green
