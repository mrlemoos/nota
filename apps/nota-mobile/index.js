/**
 * App entry. Polyfills run via metro getModulesRunBeforeMainModule (metro.config.js).
 * SharedArrayBuffer binding must exist before @expo/metro-runtime (webidl-conversions).
 * Metro forbids dynamic require(), e.g. require(moduleId) — use string literals only.
 */
require('./shared-array-buffer-polyfill');
require('./string-polyfills');

require('@expo/metro-runtime');
require('expo-router/entry-classic');
