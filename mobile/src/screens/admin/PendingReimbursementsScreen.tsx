import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, FlatList, View, Text, StyleSheet,
  Alert, RefreshControl,
} from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { reimbursementService, ReimbursementRequest } from '../../api/services/reimbursementService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';

const TYPE_LABELS: Record<string, string> = { lunch: '🍱 Cơm', snack: '🍡 Ăn vặt' };

export default function PendingReimbursementsScreen() {
  const [items, setItems] = useState<ReimbursementRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const r = await reimbursementService.getPending();
      if (r.success && r.data) setItems(r.data);
    } catch {}
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTransfer = (item: ReimbursementRequest) => {
    Alert.alert(
      'Xác nhận đã chuyển tiền',
      `Chuyển ${formatCurrency(item.total_amount)} cho ${item.settler_name}?\n\n${item.type === 'lunch' ? `Cơm ngày ${item.context_label}` : `Đồ ăn vặt: ${item.context_label}`}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đã chuyển',
          onPress: async () => {
            try {
              await reimbursementService.markTransferred(item.id);
              Alert.alert('✅', 'Đã ghi nhận! User sẽ xác nhận nhận tiền.');
              load();
            } catch (e: any) {
              Alert.alert('Lỗi', e.response?.data?.message || 'Thất bại');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ReimbursementRequest }) => (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Avatar name={item.settler_name} size={40} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.settler_name}</Text>
          <Text style={styles.email}>{item.settler_email}</Text>
        </View>
        <Badge label={TYPE_LABELS[item.type] || item.type} color={item.type === 'lunch' ? colors.primary : '#F4A261'} />
      </View>
      <Text style={styles.context}>
        {item.type === 'lunch' ? `📅 Cơm ngày ${item.context_label}` : `🍡 ${item.context_label}`}
      </Text>
      <Text style={styles.amount}>{formatCurrency(item.total_amount)}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString('vi-VN')}</Text>
      <Button
        title="✅ Đã chuyển tiền"
        onPress={() => handleTransfer(item)}
        style={styles.btn}
      />
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {items.length === 0 ? (
        <Text style={styles.empty}>Không có yêu cầu nào đang chờ</Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.sm },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  email: { fontSize: 12, color: colors.gray[500] },
  context: { fontSize: 13, color: colors.gray[600], marginTop: spacing.sm },
  amount: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: 4 },
  date: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  btn: { marginTop: spacing.md },
  empty: { textAlign: 'center', marginTop: 60, color: colors.gray[400], fontSize: 16 },
});
