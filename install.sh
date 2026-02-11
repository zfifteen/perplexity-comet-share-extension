#!/bin/bash
# Perplexity Comet Share Extension - Installer
# Installs native messaging host and generates icon PNGs

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NATIVE_HOST_NAME="com.perplexity.comet.share"
HOST_PATH="/usr/local/bin/perplexity-comet-share-handler"

echo "==========================================="
echo " Perplexity Comet Share - Installer"
echo "==========================================="
echo ""

# Step 1: Get the Chrome Extension ID
echo "Step 1: Extension ID Setup"
echo "--------------------------"
if [ -z "$1" ]; then
  echo "Usage: ./install.sh <YOUR_CHROME_EXTENSION_ID>"
  echo ""
  echo "To find your extension ID:"
  echo "  1. Open chrome://extensions in Comet"
  echo "  2. Enable Developer Mode"
  echo "  3. Load the 'extension' folder as unpacked"
  echo "  4. Copy the Extension ID shown"
  echo "  5. Run: ./install.sh <that_id>"
  exit 1
fi

EXTENSION_ID="$1"
echo "Extension ID: $EXTENSION_ID"
echo ""

# Step 2: Install native messaging host
echo "Step 2: Installing native messaging host..."
echo "--------------------------------------------"

# Copy the Python handler
sudo cp "$SCRIPT_DIR/native-host/share_handler.py" "$HOST_PATH"
sudo chmod +x "$HOST_PATH"
echo "Installed handler to $HOST_PATH"

# Create native messaging host manifest with actual extension ID
NM_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
mkdir -p "$NM_DIR"

cat > "$NM_DIR/$NATIVE_HOST_NAME.json" << EOF
{
  "name": "$NATIVE_HOST_NAME",
  "description": "Native messaging host for Perplexity Comet Share Extension",
  "path": "$HOST_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo "Installed native messaging manifest to $NM_DIR/"
echo ""

# Step 3: Generate icon PNGs from SVG
echo "Step 3: Generating icon PNGs..."
echo "-------------------------------"

ICON_DIR="$SCRIPT_DIR/extension/icons"
SVG_FILE="$ICON_DIR/icon.svg"

if command -v sips &> /dev/null && command -v qlmanage &> /dev/null; then
  # macOS native approach using sips
  for SIZE in 16 32 48 128; do
    # Use qlmanage to render SVG to PNG then resize with sips
    TEMP_PNG="/tmp/perplexity_icon_temp.png"
    qlmanage -t -s $SIZE -o /tmp "$SVG_FILE" 2>/dev/null
    if [ -f "/tmp/icon.svg.png" ]; then
      mv "/tmp/icon.svg.png" "$ICON_DIR/icon${SIZE}.png"
    else
      # Fallback: create a simple colored PNG using Python
      python3 -c "
import struct, zlib
def create_png(w, h, r, g, b):
    def make_chunk(ctype, data):
        chunk = ctype + data
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', zlib.crc32(chunk) & 0xffffffff)
    header = b'\x89PNG\r\n\x1a\n'
    ihdr = make_chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    raw = b''
    for y in range(h):
        raw += b'\x00' + bytes([r, g, b]) * w
    idat = make_chunk(b'IDAT', zlib.compress(raw))
    iend = make_chunk(b'IEND', b'')
    return header + ihdr + idat + iend
with open('$ICON_DIR/icon${SIZE}.png', 'wb') as f:
    f.write(create_png($SIZE, $SIZE, 99, 102, 241))
"
    fi
    echo "  Generated icon${SIZE}.png"
  done
elif command -v python3 &> /dev/null; then
  # Pure Python fallback
  for SIZE in 16 32 48 128; do
    python3 -c "
import struct, zlib
def create_png(w, h, r, g, b):
    def make_chunk(ctype, data):
        chunk = ctype + data
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', zlib.crc32(chunk) & 0xffffffff)
    header = b'\x89PNG\r\n\x1a\n'
    ihdr = make_chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    raw = b''
    for y in range(h):
        raw += b'\x00' + bytes([r, g, b]) * w
    idat = make_chunk(b'IDAT', zlib.compress(raw))
    iend = make_chunk(b'IEND', b'')
    return header + ihdr + idat + iend
with open('$ICON_DIR/icon${SIZE}.png', 'wb') as f:
    f.write(create_png($SIZE, $SIZE, 99, 102, 241))
"
    echo "  Generated icon${SIZE}.png (solid color fallback)"
  done
  echo "  TIP: For the full P-with-horns icon, install librsvg:"
  echo "    brew install librsvg"
  echo "    rsvg-convert -w 128 -h 128 icon.svg > icon128.png"
fi

echo ""
echo "==========================================="
echo " Installation Complete!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "  1. Open chrome://extensions in Comet"
echo "  2. Enable Developer Mode"
echo "  3. Click 'Load unpacked'"
echo "  4. Select the 'extension' folder"
echo "  5. The extension is now active!"
echo ""
echo "To test: Right-click any page > 'Analyze with Perplexity'"
echo ""
