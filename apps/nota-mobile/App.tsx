// LEGACY — Not used after switching to Expo Router.
// Entry is now "expo-router/entry" (see package.json "main").
// All routes live under /app with _layout.tsx + groups.
// This file can be deleted in a future cleanup.
import { Text, View } from 'react-native';
export default function LegacyApp() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Legacy App.tsx — use Expo Router screens instead.</Text>
    </View>
  );
}
