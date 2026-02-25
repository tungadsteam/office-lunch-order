import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';

interface ActionItem {
  icon: string;
  label: string;
  onPress: () => void;
}

interface Props {
  actions: ActionItem[];
}

export default function QuickActions({ actions }: Props) {
  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <TouchableOpacity key={index} style={styles.item} onPress={action.onPress} activeOpacity={0.7}>
          <Text style={styles.icon}>{action.icon}</Text>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  item: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: { fontSize: 24, marginBottom: spacing.xs },
  label: { fontSize: 12, fontWeight: '500', color: colors.gray[700], textAlign: 'center' },
});
