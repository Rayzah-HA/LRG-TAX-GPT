#!/bin/bash
# Plex Media Server Backup Script
# Run on the EXISTING Ubuntu server before migration
#
# Usage: sudo ./plex-backup.sh [output-directory]
# Example: sudo ./plex-backup.sh ~/

set -euo pipefail

PLEX_DIR="/var/lib/plexmediaserver/Library/Application Support/Plex Media Server"
OUTPUT_DIR="${1:-$HOME}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$OUTPUT_DIR/plex-backup-$TIMESTAMP.tar.gz"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Plex Media Server Backup ===${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Run with sudo${NC}"
    exit 1
fi

# Verify Plex directory exists
if [ ! -d "$PLEX_DIR" ]; then
    echo -e "${RED}Error: Plex directory not found at $PLEX_DIR${NC}"
    echo "Check your Plex installation path."
    exit 1
fi

# Stop Plex for clean backup
echo -e "${YELLOW}Stopping Plex Media Server...${NC}"
systemctl stop plexmediaserver 2>/dev/null || service plexmediaserver stop 2>/dev/null || true
sleep 3

# Show what we're backing up
echo -e "${YELLOW}Backing up from: $PLEX_DIR${NC}"
echo ""

ITEMS_TO_BACKUP=(
    "$PLEX_DIR/Plug-in Support/Databases"
    "$PLEX_DIR/Plug-in Support/Preferences"
    "$PLEX_DIR/Preferences.xml"
    "$PLEX_DIR/Metadata"
)

echo "Items included:"
for item in "${ITEMS_TO_BACKUP[@]}"; do
    if [ -e "$item" ]; then
        SIZE=$(du -sh "$item" 2>/dev/null | cut -f1)
        echo -e "  ${GREEN}[OK]${NC} $(basename "$item") ($SIZE)"
    else
        echo -e "  ${RED}[MISSING]${NC} $(basename "$item")"
    fi
done
echo ""

# Create backup
echo -e "${YELLOW}Creating backup archive...${NC}"
tar -czf "$BACKUP_FILE" \
    "${ITEMS_TO_BACKUP[@]}" \
    2>/dev/null

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)

# Restart Plex
echo -e "${YELLOW}Restarting Plex Media Server...${NC}"
systemctl start plexmediaserver 2>/dev/null || service plexmediaserver start 2>/dev/null || true

echo ""
echo -e "${GREEN}=== Backup Complete ===${NC}"
echo -e "File: $BACKUP_FILE"
echo -e "Size: $BACKUP_SIZE"
echo ""
echo "Next steps:"
echo "  1. Transfer to Windows PC:  scp $BACKUP_FILE user@windows-pc:/c/plex/"
echo "  2. Extract on Windows:      tar -xzf $(basename "$BACKUP_FILE") -C C:\\plex\\config\\"
