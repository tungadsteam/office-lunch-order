import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView, FlatList, View, Text, StyleSheet,
  Alert, RefreshControl,
} from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { reimbursementService, ReimbursementRequest } from '../../api/services/reimbursementService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ admin chuyển', color: colors.warning },
  admin_transferred: { label: 'Admin đã chuyển', color: colors.primary },
  user_confirmed: { label: '✅ Đã nhận', color: colors.success },
  user_disputed: { label: '⚠️ Chưa nhận', color: colors.danger },
};

export default function MyReimbursementsScreen() {
  const [items, setItems] = useState<ReimbursementRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await reimbursementService.getMine();
      if (r.success && r.data) setItems(r.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleConfirm = (item: ReimbursementRequest, response: 'received' | 'not_received') => {
    const msg = response === 'received'
      ? 'Xác nhận bạn đã nhận được tiền?'
      : 'Xác nhận chưa nhận được tiền? Admin sẽ kiểm tra lại.';

    Alert.alert('Xác nhận', msg, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            const r = await reimbursementService.confirmReceipt(item.id, response);
            Alert.alert('✅', r.message || 'Đã xác nhận!');
            load();
          } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Thất bại');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ReimbursementRequest }) => {
    const statusCfg = STATUS_CONFIG[item.status] || { label: item.status, color: colors.gray[400] };

    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.context}>
              {item.type === 'lunch' ? `🍱 Cơm ngày ${item.context_label}` : `🍡 ${item.context_label}`}
            </Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
          </View>
          <Badge label={statusCfg.label} color={statusCfg.color} />
        </View>

        <Text style={styles.amount}>{formatCurrency(item.total_amount)}</Text>

        {item.status === 'pending' && (
          <View style={styles.pendingNote}>
            <Text style={styles.pendingText}>⏳ Đang chờ admin chuyển khoản cho bạn</Text>
          </View>
        )}

        {item.status === 'admin_transferred' && (
          <View>
            {item.admin_transferred_at && (
              <Text style={styles.transferNote}>
                💸 Admin chuyển lúc {new Date(item.admin_transferred_at).toLocaleString('vi-VN')}
              </Text>
            )}
            <View style={styles.confirmBtns}>
              <Button
                title="✅ Đã nhận được"
                size="sm"
                onPress={() => handleConfirm(item, 'received')}
                style={{ flex: 1 }}
              />
              <Button
                title="❌ Chưa nhận"
                variant="danger"
                size="sm"
                onPress={() => handleConfirm(item, 'not_received')}
                style={{ flex: 1, marginLeft: spacing.sm }}
              />
            </View>
          </View>
        )}

        {item.status === 'user_confirmed' && (
          <Text style={styles.confirmedText}>✅ Bạn đã xác nhận nhận tiền</Text>
        )}

        {item.status === 'user_disputed' && (
          <Text style={styles.disputedText}>⚠️ Bạn đã báo chưa nhận. Admin đang kiểm tra.</Text>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {items.length === 0 ? (
        <Text style={styles.empty}>Chưa có yêu cầu hoàn tiền nào</Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  context: { fontSize: 15, fontWeight: '600', color: colors.text },
  date: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  amount: { fontSize: 22, fontWeight: '800', color: colors.primary, marginVertical: spacing.sm },
  pendingNote: { backgroundColor: '#FFF3CD', padding: spacing.sm, borderRadius: 8 },
  pendingText: { fontSize: 13, color: '#856404' },
  transferNote: { fontSize: 13, color: colors.gray[600], marginBottom: spacing.sm },
  confirmBtns: { flexDirection: 'row' },
  confirmedText: { fontSize: 14, color: colors.success, fontWeight: '600' },
  disputedText: { fontSize: 14, color: colors.danger, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 60, color: colors.gray[400], fontSize: 16 },
});
