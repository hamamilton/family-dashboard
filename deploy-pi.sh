#!/bin/bash

# Family Dashboard Raspberry Pi Deployment Script
# Run this script on your Raspberry Pi!

echo "=============================================="
echo "    FAMILY DASHBOARD - RASPBERRY PI DEPLOY    "
echo "=============================================="

# Determine Architecture
ARCH=$(uname -m)
PB_VERSION="0.22.11" # Update this to desired PocketBase version if needed
PB_ARCH="arm64"

if [[ "$ARCH" == "armv7l" ]]; then
    PB_ARCH="armv7"
    echo "[!] Detected 32-bit OS (ARMv7)"
elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    PB_ARCH="arm64"
    echo "[!] Detected 64-bit OS (ARM64)"
else
    echo "[ERROR] Unsupported architecture for this automated script: $ARCH"
    exit 1
fi

echo "Setting up deployment directory..."
mkdir -p ~/family-dashboard-server
cd ~/family-dashboard-server

echo "Downloading PocketBase v${PB_VERSION} for ${PB_ARCH}..."
wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" -O pb.zip

echo "Extracting PocketBase..."
unzip -o -q pb.zip pocketbase
rm pb.zip
chmod +x pocketbase

echo "Setting up pb_public (Frontend hosting folder)..."
mkdir -p pb_public

# Prompt user to copy files
echo "=============================================="
echo "PocketBase Server is installed!"
echo ""
echo "Next Steps:"
echo "1. On your Mac/PC, run: npm run build"
echo "2. Copy the contents of the 'dist' folder to this Pi into: ~/family-dashboard-server/pb_public/"
echo "   (You can use SCP or a USB drive)"
echo "3. Once the files are copied, start the server by running:"
echo "   cd ~/family-dashboard-server && ./pocketbase serve --http=0.0.0.0:8090"
echo "=============================================="
