import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useNotaFonts } from '../lib/nota-fonts';
import { colors, sharedStyles } from '../lib/theme';

/** Blocks children until web-aligned note fonts are loaded. */
export function NotaFontsGate({ children }: { children: ReactNode }) {
  const fontsReady = useNotaFonts();

  if (!fontsReady) {
    return (
      <View
        style={[
          sharedStyles.screen,
          { alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return children;
}
