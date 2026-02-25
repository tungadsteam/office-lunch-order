import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  title: { fontSize: 28, fontWeight: '700', letterSpacing: 0.36 },
  heading: { fontSize: 20, fontWeight: '600', letterSpacing: 0.38 },
  body: { fontSize: 16, fontWeight: '400', letterSpacing: -0.32 },
  bodyBold: { fontSize: 16, fontWeight: '600', letterSpacing: -0.32 },
  caption: { fontSize: 14, fontWeight: '400', letterSpacing: -0.08 },
  small: { fontSize: 12, fontWeight: '400', letterSpacing: 0 },
  largeNumber: { fontSize: 36, fontWeight: '800', letterSpacing: 0.41 },
};
