import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { LunchSession } from '../../types/order.types';
import { ORDER_STATUS_LABELS } from '../../utils/constants';

interface Props {
  session: LunchSession | null;
  isJoined: boolean;
  onPress: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  ordering: colors.primary,
  buyers_selected: colors.warning,
  buying: colors.warning,
  payment_submitted: colors.secondary,
  settled: colors.success,
  cancelled: colors.danger,
};

export default function TodayOrderSummary({ session, isJoined, onPress }: Props) {
  if (!session) return null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card title="🍱 Cơm trưa hôm nay">
        <View style={styles.row}>
          <Badge
            label={ORDER_STATUS_LABELS[session.status] || session.status}
            color={STATUS_COLORS[session.status] || colors.gray[400]}
          />
          <Text style={styles.count}>{session.total_participants} người</Text>
        </View>
        {session.status === 'ordering' && (
          <Text style={styles.deadline}>⏰ Chốt sổ lúc 11:30 AM</Text>
        )}
        {isJoined && (
          <Text style={styles.joined}>✅ Bạn đã đặt cơm hôm nay</Text>
        )}
        {session.status === 'settled' && session.amount_per_person && (
          <Text style={styles.settled}>
            💰 {session.amount_per_person.toLocaleString('vi-VN')}đ/người
          </Text>
        )}
        <Text style={styles.tapHint}>Nhấn để xem chi tiết →</Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  count: { fontSize: 14, color: colors.gray[500] },
  deadline: { fontSize: 14, color: colors.warning, marginBottom: spacing.xs },
  joined: { fontSize: 14, color: colors.success, fontWeight: '500' },
  settled: { fontSize: 14, color: colors.success, fontWeight: '600' },
  tapHint: { fontSize: 12, color: colors.gray[400], marginTop: spacing.sm, textAlign: 'right' },
});
