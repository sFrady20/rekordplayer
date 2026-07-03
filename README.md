# rekordplay

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
- **Playback** — `expo-audio` plays the `content://` URIs directly
  ([src/lib/audio/player.ts](src/lib/audio/player.ts)); queue state lives in a
  zustand+immer store ([src/store/index.ts](src/store/index.ts)).
- **UI** — expo-router screens, nativewind styling, shadcn-style atoms
  (cva + cnfast) in [src/components/ui](src/components/ui).

## Running it

Requires a physical Android device (USB-OTG does not exist in emulators).

```sh
npm install
npx expo run:android        # builds the dev client and installs it
```

Then: plug in the USB (choose "no action" if Android asks), open the app, tap
**Connect USB drive**, and pick the drive root in the system picker.

Background playback is enabled via the `expo-audio` config plugin, which
requires a dev build (`expo run:android`), not Expo Go.

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
