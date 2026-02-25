import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, View, Text, StyleSheet, Alert, RefreshControl } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { transactionService } from '../../api/services/transactionService';
import { Transaction } from '../../types/transaction.types';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';

export default function PendingDepositsScreen() {
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const r = await transactionService.getPending();
      if (r.success && r.data) setDeposits(r.data);
    } catch {}
  };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleApprove = (id: number) => Alert.alert('Duyệt', 'Xác nhận duyệt?', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Duyệt', onPress: async () => { try { await transactionService.approve(id); Alert.alert('✅', 'Đã duyệt!'); load(); } catch (e: any) { Alert.alert('Lỗi', e.response?.data?.message || 'Thất bại'); } } },
  ]);

  const handleReject = (id: number) => Alert.alert('Từ chối', 'Xác nhận từ chối?', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Từ chối', style: 'destructive', onPress: async () => { try { await transactionService.reject(id); load(); } catch {} } },
  ]);

  const renderItem = ({ item }: { item: Transaction }) => (
    <Card>
      <View style={styles.row}>
        <Avatar name={item.name || 'U'} size={36} />
        <View style={styles.info}><Text style={styles.name}>{item.name || `User #${item.user_id}`}</Text><Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</Text></View>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
      </View>
      {item.note && <Text style={styles.note}>📝 {item.note}</Text>}
      <View style={styles.actions}>
        <Button title="✅ Duyệt" size="sm" onPress={() => handleApprove(item.id)} style={{ flex: 1 }} />
        <Button title="❌ Từ chối" variant="danger" size="sm" onPress={() => handleReject(item.id)} style={{ flex: 1 }} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {deposits.length === 0 ? (
        <Text style={styles.empty}>Không có yêu cầu nào</Text>
      ) : (
        <FlatList data={deposits} renderItem={renderItem} keyExtractor={i => i.id.toString()} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.sm },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  date: { fontSize: 12, color: colors.gray[500] },
  amount: { fontSize: 16, fontWeight: '700', color: colors.primary },
  note: { fontSize: 13, color: colors.gray[500], marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  empty: { textAlign: 'center', marginTop: 60, color: colors.gray[400], fontSize: 16 },
});
