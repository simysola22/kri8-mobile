# Kri8 Mobile (Expo Router build)

## What was fixed in this pass

1. **Theme colors** — all 8 theme files in `src/themes/` were rewritten to
   match the real web app's `index.css` tokens exactly (converted from the
   same HSL values). Previously these used an invented palette (e.g. a
   purple `#7C6EF5` accent instead of the web's actual gold
   `hsl(43, 74%, 52%)` for Midnight).

2. **SDK version bump** — Expo was upgraded to SDK 54 with React Native 0.81.5
   and the matching Expo and React Native package versions. Reanimated 4 also
   requires the new `react-native-worklets` peer dependency.

3. **`babel-preset-expo`** — added to `devDependencies` because it is referenced
   by `babel.config.js`.

4. **Backend-dependent services** — `StorageService.ts` and
   `CreatorScoreService.ts` now document that their backend routes are not
   present yet and that the services are not wired into screens.

## Development build requirement

The app uses native modules including `react-native-mmkv`, camera,
notifications, and universal-link configuration. Use a custom development
build rather than stock Expo Go:

```bash
pnpm --filter @workspace/kri8-mobile run prebuild
npx eas build --profile development --platform android
pnpm --filter @workspace/kri8-mobile run start
```

After installing the development build, start Metro with the `start` script
and connect using the development client.