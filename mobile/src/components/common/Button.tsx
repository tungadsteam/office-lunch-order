import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../styles/colors';
import { borderRadius } from '../../styles/spacing';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, style, textStyle, fullWidth = true,
}: Props) {
  const bg = { primary: colors.primary, secondary: colors.secondary, danger: colors.danger, outline: 'transparent', ghost: 'transparent' }[variant];
  const fg = variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white;
  const py = { sm: 10, md: 14, lg: 18 }[size];
  const fs = { sm: 14, md: 16, lg: 18 }[size];

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: disabled ? colors.gray[200] : bg,
          paddingVertical: py,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: disabled ? colors.gray[200] : colors.primary,
          alignSelf: fullWidth ? 'stretch' : 'center',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[styles.text, { color: disabled ? colors.gray[400] : fg, fontSize: fs }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 20 },
  text: { fontWeight: '600' },
});
