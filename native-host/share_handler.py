#!/usr/bin/env python3
"""Native Messaging Host for Perplexity Comet Share Extension.

Receives URLs from macOS Share Extension and forwards them
to the Chrome extension via Chrome Native Messaging protocol.
"""

import sys
import json
import struct
import logging
from pathlib import Path

# Setup logging
log_path = Path.home() / "Library" / "Logs" / "PerplexityCometShare.log"
logging.basicConfig(
    filename=str(log_path),
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


def read_message():
    """Read a message from stdin using Chrome's native messaging protocol."""
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack("@I", raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    return json.loads(message)


def send_message(message):
    """Send a message to stdout using Chrome's native messaging protocol."""
    encoded = json.dumps(message).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("@I", len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def main():
    """Main loop: read messages and respond."""
    logging.info("Native host started")

    # Check if a URL was passed as command-line argument
    # (used when invoked from macOS Share Extension)
    if len(sys.argv) > 1:
        url = sys.argv[1]
        logging.info(f"URL from argv: {url}")
        send_message({"url": url})
        return

    # Standard native messaging loop
    while True:
        try:
            message = read_message()
            logging.info(f"Received: {message}")

            if "url" in message:
                # Echo back the URL to trigger the extension
                send_message({"url": message["url"], "status": "received"})
            else:
                send_message({"error": "No URL provided"})

        except Exception as e:
            logging.error(f"Error: {e}")
            send_message({"error": str(e)})
            break

    logging.info("Native host stopped")


if __name__ == "__main__":
    main()
