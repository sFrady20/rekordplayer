/**
 * Config plugin: make the app a handler for USB drive attach events.
 *
 * Adds a USB_DEVICE_ATTACHED intent-filter (+ device_filter.xml matching the
 * USB mass-storage class) to MainActivity, so when a USB drive is plugged in
 * Android offers rekordplayer in the "open with" dialog — and lets the user
 * set it as the default ("always"), launching straight into the app.
 */
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const USB_ACTION = 'android.hardware.usb.action.USB_DEVICE_ATTACHED';

// class 8 == USB Mass Storage. Android matches this against the device's
// interfaces too, so it covers flash drives that report device class 0.
const DEVICE_FILTER = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <usb-device class="8" />
</resources>
`;

function withUsbIntentFilter(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    const activity = (app.activity || []).find(
      (a) => a.$['android:name'] === '.MainActivity',
    );
    if (!activity) return cfg;

    activity['intent-filter'] = activity['intent-filter'] || [];
    const hasFilter = activity['intent-filter'].some((f) =>
      (f.action || []).some((a) => a.$['android:name'] === USB_ACTION),
    );
    if (!hasFilter) {
      activity['intent-filter'].push({ action: [{ $: { 'android:name': USB_ACTION } }] });
    }

    activity['meta-data'] = activity['meta-data'] || [];
    const hasMeta = activity['meta-data'].some((m) => m.$['android:name'] === USB_ACTION);
    if (!hasMeta) {
      activity['meta-data'].push({
        $: { 'android:name': USB_ACTION, 'android:resource': '@xml/device_filter' },
      });
    }
    return cfg;
  });
}

function withUsbDeviceFilterFile(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'device_filter.xml'), DEVICE_FILTER);
      return cfg;
    },
  ]);
}

module.exports = function withUsbAttach(config) {
  config = withUsbIntentFilter(config);
  config = withUsbDeviceFilterFile(config);
  return config;
};
