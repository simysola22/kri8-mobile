const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure platform-specific extensions are resolved correctly.
// Metro resolves .web.ts before .ts when bundling for web,
// so kv.web.ts takes priority over kv.native.ts on web.
// The default Expo config already includes platform extensions;
// this file is kept minimal and explicit.

module.exports = config;
