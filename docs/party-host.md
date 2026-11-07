# Brindahl party guestbook

The ESP32-S3 runs a local Wi-Fi access point and serves the artwork, fonts, site and guestbook from a FAT32 USB drive. The web edition uses shared Vercel storage. The ESP and web editions have separate guestbooks.

## Prepare the USB stick

From the repository root, run the following with Node and Python 3.9+ installed.

```sh
npm ci
python3 scripts/prepare-usb.py ../brindahl-party --choose-password
```

Copy the resulting `site`, `registry` (empty folder) and `party.cfg` into the root of a FAT32 stick. Keep `party.cfg` private. The `wifi` line is the guest Wi-Fi password. The `host` line is the separate host password. To update an existing installation, replace only the `site` folder and retain your records and keys.

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

Open **Host controls**, enter the host password and unlock the controls, choose **Delete entry** and confirm. This removes the signature and its photo together. The ESP serves plain HTTP on the party network. Use the host password only on the intended network.

Each entry is a single file in `registry`. Its first line is UTF-8 JSON, followed by the optional JPEG bytes. The server publishes a record after closing and renaming its temporary file, and a retried submission uses the same ID. To back up the complete guestbook, power down after writes have finished and copy the registry folder. The firmware never formats the drive.

## Web edition

In the Brindahl Vercel project's Storage tab, create a **private Blob store** and connect it to the Preview environment. Keep the default environment variable names. In project environment settings, add **HOST_PASSWORD** with a strong, unique password of 12–64 printable ASCII characters, then redeploy the review branch.

The web API saves each signature and optional photo together as one private object. Anyone visiting the site can read and sign the book. Host Controls verifies the password on the server before showing deletion controls, and deletion requests verify it again. Closing the controls or leaving the page clears the password from page memory.

If storage or the password is missing, signing is disabled and the site shows a setup message. Web timestamps use the server clock. Entries previously saved by the early browser-only preview remain in that browser's storage and are separate from the shared book.

Use a different private store for production when the site is approved for release, so review tests stay separate from party signatures. To use one shared book across preview and production, explicitly connect the same store to both environments.

Run API regression checks with `node --test tests/guestbook.test.js`.
