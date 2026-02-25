import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../utils/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const bgColor = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    danger: COLORS.danger,
    outline: 'transparent',
  }[variant];

  const txtColor = variant === 'outline' ? COLORS.primary : COLORS.white;
  const borderColor = variant === 'outline' ? COLORS.primary : 'transparent';

  const paddingVertical = { sm: 8, md: 12, lg: 16 }[size];
  const fontSize = { sm: FONT_SIZES.sm, md: FONT_SIZES.md, lg: FONT_SIZES.lg }[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? COLORS.lightGray : bgColor,
          paddingVertical,
          borderColor: disabled ? COLORS.lightGray : borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: txtColor, fontSize }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontWeight: '600',
  },
});
