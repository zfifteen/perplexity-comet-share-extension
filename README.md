# Perplexity Comet Share Extension

A Chrome extension for the Perplexity Comet browser that lets you share URLs directly to Perplexity AI for analysis. Includes a native messaging host for macOS Share Sheet integration and a right-click context menu.

## Features

- **Right-click context menu**: Right-click any page or link and select "Analyze with Perplexity"
- **Toolbar button**: Click the extension icon to share the current page
- **Popup settings UI**: Configure prompt template, auto-submit, and tab behavior
- **Native messaging**: Bridge for macOS Share Sheet integration
- **Customizable prompt**: Default is `Analyze {url}` - change it to anything
- **Auto-submit**: Optionally auto-submits the prompt after injection

## Project Structure

```
perplexity-comet-share-extension/
|-- extension/              # Chrome extension files
|   |-- manifest.json       # Extension manifest (MV3)
|   |-- background.js       # Service worker
|   |-- content.js          # Content script for perplexity.ai
|   |-- popup.html          # Settings popup UI
|   |-- popup.js            # Popup logic
|   |-- icons/
|       |-- icon.svg         # Source SVG (P with devil horns)
|       |-- icon16.png       # Generated icons
|       |-- icon32.png
|       |-- icon48.png
|       |-- icon128.png
|-- native-host/            # Native messaging host
|   |-- share_handler.py    # Python native messaging handler
|   |-- com.perplexity.comet.share.json  # Host manifest
|-- install.sh              # One-step installer
|-- README.md
```

## Installation

### Step 1: Clone the repo

```bash
git clone https://github.com/zfifteen/perplexity-comet-share-extension.git
cd perplexity-comet-share-extension
```

### Step 2: Load the extension in Comet

1. Open `chrome://extensions` in Comet
2. Enable **Developer Mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Copy the **Extension ID** shown (e.g., `abcdefghijklmnop...`)

### Step 3: Run the installer

```bash
chmod +x install.sh
./install.sh YOUR_EXTENSION_ID
```

This will:
- Install the native messaging host to `/usr/local/bin/`
- Create the native messaging manifest in Chrome's config directory
- Generate PNG icon files from the SVG source

## Usage

### Right-click menu
Right-click any page or link > **Analyze with Perplexity**

### Toolbar button
Click the extension icon in the toolbar > **Share Current Page**

### Settings
Click the extension icon to open the popup where you can:
- Change the **prompt template** (use `{url}` as the URL placeholder)
- Toggle **auto-submit** (automatically sends the prompt)
- Toggle **open in new tab** vs. reusing an existing Perplexity tab

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Prompt Template | `Analyze {url}` | Template for the prompt sent to Perplexity |
| Auto Submit | On | Automatically submit the prompt |
| Open in New Tab | On | Open a new Perplexity tab vs. reuse existing |

## Requirements

- macOS (for native messaging host)
- Perplexity Comet browser (Chrome-based)
- Python 3 (pre-installed on macOS)

## Troubleshooting

### Extension not working
- Verify the extension is loaded at `chrome://extensions`
- Check that the Extension ID in the native host manifest matches
- View logs at `~/Library/Logs/PerplexityCometShare.log`

### Icons not showing
- Run `./install.sh` again to regenerate PNGs
- Or install `librsvg` for high-quality SVG rendering:
  ```bash
  brew install librsvg
  rsvg-convert -w 128 -h 128 extension/icons/icon.svg > extension/icons/icon128.png
  ```

### Native messaging errors
- Ensure the manifest is at: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.perplexity.comet.share.json`
- Check that `/usr/local/bin/perplexity-comet-share-handler` exists and is executable

## License

MIT
