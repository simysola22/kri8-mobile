module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated 4 uses the Worklets plugin, which must remain last.
      'react-native-worklets/plugin',
    ],
  };
};
