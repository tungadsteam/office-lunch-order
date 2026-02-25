import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Badge from '../common/Badge';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { OrderHistoryItem } from '../../types/order.types';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props {
  item: OrderHistoryItem;
  onPress: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  ordering: colors.primary,
  buyers_selected: colors.warning,
  settled: colors.success,
  cancelled: colors.danger,
};

export default function OrderCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(item.session_date)}</Text>
        <Badge
          label={ORDER_STATUS_LABELS[item.status] || item.status}
          color={STATUS_COLORS[item.status] || colors.gray[400]}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.detail}>{item.total_participants} người</Text>
        {item.amount_per_person && (
          <Text style={styles.amount}>{formatCurrency(item.amount_per_person)}</Text>
        )}
      </View>
      {item.was_buyer && <Text style={styles.tag}>🛒 Bạn đã đi mua</Text>}
      {item.was_payer && <Text style={styles.tag}>💰 Bạn đã trả tiền</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 15, fontWeight: '600', color: colors.text },
  info: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  detail: { fontSize: 13, color: colors.gray[500] },
  amount: { fontSize: 14, fontWeight: '600', color: colors.primary },
  tag: { fontSize: 12, color: colors.success, marginTop: spacing.xs },
});
