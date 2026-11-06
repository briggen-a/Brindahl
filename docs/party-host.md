# Brindahl party guestbook

The ESP32-S3 runs a local Wi-Fi access point and serves the artwork, fonts, site and guestbook from a FAT32 USB drive. The Vercel phone preview uses a separate book in each browser.

## Prepare the USB stick

From the repository root, run the following with Node and Python 3.9+ installed.

```sh
npm ci
python3 scripts/prepare-usb.py ../brindahl-party
```

Copy the resulting `site`, `registry` (empty folder) and `party.cfg` into the root of a FAT32 stick. Keep `party.cfg` private. The `wifi` line is the guest Wi-Fi password. The `host` line is the separate deletion key. To update an existing installation, replace only the `site` folder and retain your records and keys.

## Run the host

Use ESP-IDF 5.4.x with the ESP32-S3 toolchain. The defaults target N16R8 with octal PSRAM. From an initialized IDF shell:

```sh
cd firmware
idf.py set-target esp32s3
idf.py build
idf.py -p YOUR_SERIAL_PORT flash monitor
```

Check the board's specific USB host port and VBUS power arrangement before connecting the stick. A USB-to-UART port is for flashing. The stick needs a powered native USB host connection. On boards with a VBUS switch, the hardware may need a board-specific enable step.

After mounting the drive the firmware starts **BRINDAHL_IMPERIAL_NETWORK**. Connect a phone using the Wi-Fi password, stay connected if the phone reports no internet, then open **http://192.168.4.1/**. Ten phones can associate at once. Test on two phones before the party.

## Sign and manage

Signatures appear immediately. The optional message and photo accompany a timestamp from the signing phone, displayed in the reader's local time. Photos are resized to at most 800 pixels per side and 80 KiB. The shared book holds 200 entries.

Open **Host controls**, enter the host key, choose **Delete entry** and confirm. This removes the signature and its photo together. The ESP serves plain HTTP on the party network. Use the host key only on the intended network.

Each entry is a single file in `registry`. Its first line is UTF-8 JSON, followed by the optional JPEG bytes. The server publishes a record after closing and renaming its temporary file, and a retried submission uses the same ID. To back up the complete guestbook, power down after writes have finished and copy the registry folder. The firmware never formats the drive.
