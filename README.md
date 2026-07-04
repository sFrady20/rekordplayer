# rekordplayer

Android app that reads a rekordbox-exported USB drive and plays it with a
Spotify-like interface. Read-only: it never writes to the USB.

## How it works

- **USB access** — the user picks the USB root once via Android's Storage
  Access Framework ([src/lib/usb/saf.ts](src/lib/usb/saf.ts)). Track/artwork
  `content://` URIs are constructed directly from the granted tree URI, so no
  directory walking is needed.
- **Library parsing** — `PIONEER/rekordbox/export.pdb` is parsed with a
  Kaitai-Struct-generated parser
  ([src/lib/pdb/RekordboxPdb.js](src/lib/pdb/RekordboxPdb.js), generated from
  Deep-Symmetry/crate-digger's `rekordbox_pdb.ksy`). The wrapper
  ([src/lib/pdb/parse.ts](src/lib/pdb/parse.ts)) extracts tracks, artists,
  albums, genres, keys, playlist tree/entries, and artwork paths.
- **Playback** — `react-native-track-player` owns the queue and plays the
  `content://` URIs ([src/lib/audio/player.ts](src/lib/audio/player.ts)). RNTP
  provides a real Android MediaSession, so car/Bluetooth/lock-screen next &
  previous change tracks, auto-advance is native, and artwork shows on the head
  unit. Remote commands are handled in the headless
  [playback service](src/lib/audio/service.ts), registered in
  [index.js](index.js). Playback state mirrors into a zustand+immer store
  ([src/store/index.ts](src/store/index.ts)) which drives the UI.
- **USB auto-launch** — a config plugin
  ([plugins/withUsbAttach.js](plugins/withUsbAttach.js)) adds a
  `USB_DEVICE_ATTACHED` intent-filter so Android offers rekordplayer when a
  drive is plugged in (set it as default to skip the picker).
- **UI** — expo-router screens, nativewind styling, shadcn-style atoms
  (cva + cnfast) in [src/components/ui](src/components/ui).

## Running it

Requires a physical Android device (USB-OTG does not exist in emulators).

```sh
npm install
npx expo run:android        # builds the dev client and installs it
```

Then: plug in the USB (pick rekordplayer if Android offers it, or "no action"),
open the app, tap **Connect USB drive**, and pick the drive root in the system
picker.

Uses native modules (SAF, react-native-track-player), so it runs in a dev build
(`expo run:android`), never Expo Go.

## Regenerating the pdb parser

```sh
node scripts/generate-pdb-parser.js
```

Downloads the latest `rekordbox_pdb.ksy` from crate-digger and recompiles
`src/lib/pdb/RekordboxPdb.js`. Note: kaitai-struct's Node-only fallbacks
(`iconv-lite`, `zlib`) are stubbed in [metro.config.js](metro.config.js);
`parse.ts` replaces `bytesToStr` with a pure-JS decoder because Hermes has no
`TextDecoder`.

## Ejecting

"Eject USB" on the library screen stops playback (releasing the player's open
file handles on the drive), closes the library, and opens Android's Storage
settings — the actual unmount is one tap there. Apps cannot unmount volumes
directly (privileged `MOUNT_UNMOUNT_FILESYSTEMS` permission).

## Known limits (v1)

- Read-only: no playlist editing/rearranging on the USB.
- Android only.
- Ignores `exportLibrary.db` (rekordbox 6.8+/7 "Device Library Plus") — the
  legacy `export.pdb` is still written alongside it and is what we parse.
- No waveforms/beatgrids (ANLZ files are not read).
