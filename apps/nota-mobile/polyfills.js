/**
 * Runs before any app module (metro getModulesRunBeforeMainModule + index.js require).
 * Keep this file free of imports from expo, expo-router, or workspace packages.
 */

// Metro may evaluate dependencies before @expo/metro-runtime; initialise RN globals next.
require('react-native/Libraries/Core/InitializeCore');

// Clerk (via ClerkProvider) installs this later; doing it here avoids a half-ready whatwg URL
// where URLSearchParams.get hits undefined impl (Cannot read property 'get' of undefined).
require('react-native-url-polyfill/auto');
