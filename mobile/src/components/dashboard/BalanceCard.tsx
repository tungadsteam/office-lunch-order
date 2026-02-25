import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../common/Button';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  balance: number;
  onDeposit: () => void;
  onHistory: () => void;
}

export default function BalanceCard({ balance, onDeposit, onHistory }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Số dư hiện tại</Text>
      <Text style={styles.amount}>{formatCurrency(balance)}</Text>
      <View style={styles.actions}>
        <Button title="Nạp tiền" variant="outline" size="sm" onPress={onDeposit} style={styles.btn} textStyle={{ color: colors.white }} />
        <Button title="Lịch sử" variant="outline" size="sm" onPress={onHistory} style={styles.btn} textStyle={{ color: colors.white }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  amount: { fontSize: 36, fontWeight: '800', color: colors.white, marginVertical: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btn: { borderColor: 'rgba(255,255,255,0.5)', minWidth: 100 },
});
