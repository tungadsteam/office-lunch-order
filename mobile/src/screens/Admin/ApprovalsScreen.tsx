import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import UserAvatar from '../../components/UserAvatar';
import { transactionsApi } from '../../api/transactions';
import { Transaction } from '../../types';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function ApprovalsScreen() {
  const [deposits, setDeposits] = useState<(Transaction & { name?: string })[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const result = await transactionsApi.getPending();
      if (result.success && result.data) {
        setDeposits(result.data);
      }
    } catch (error) {
      console.error('Load pending error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPending();
    setRefreshing(false);
  };

  const handleApprove = (id: number) => {
    Alert.alert('Duyệt nạp tiền', 'Xác nhận duyệt yêu cầu nạp tiền này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: async () => {
          try {
            await transactionsApi.approveDeposit(id);
            Alert.alert('✅', 'Đã duyệt thành công!');
            await loadPending();
          } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Duyệt thất bại');
          }
        },
      },
    ]);
  };

  const handleReject = (id: number) => {
    Alert.alert('Từ chối nạp tiền', 'Xác nhận từ chối yêu cầu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: async () => {
          try {
            await transactionsApi.rejectDeposit(id, 'Không đủ bằng chứng chuyển khoản');
            Alert.alert('❌', 'Đã từ chối');
            await loadPending();
          } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Thất bại');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Transaction & { name?: string } }) => (
    <Card>
      <View style={styles.depositHeader}>
        <UserAvatar name={item.name || 'U'} size={36} />
        <View style={styles.depositInfo}>
          <Text style={styles.depositName}>{item.name || `User #${item.user_id}`}</Text>
          <Text style={styles.depositDate}>
            {new Date(item.created_at).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <Text style={styles.depositAmount}>
          {item.amount.toLocaleString('vi-VN')} đ
        </Text>
      </View>

      {item.note && <Text style={styles.depositNote}>📝 {item.note}</Text>}

      <View style={styles.actions}>
        <Button
          title="✅ Duyệt"
          size="sm"
          onPress={() => handleApprove(item.id)}
          style={styles.approveBtn}
        />
        <Button
          title="❌ Từ chối"
          variant="danger"
          size="sm"
          onPress={() => handleReject(item.id)}
          style={styles.rejectBtn}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📋 Duyệt nạp tiền</Text>
      {deposits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Không có yêu cầu nào đang chờ duyệt</Text>
        </View>
      ) : (
        <FlatList
          data={deposits}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    padding: SPACING.md,
    paddingBottom: 0,
  },
  list: { padding: SPACING.md },
  depositHeader: { flexDirection: 'row', alignItems: 'center' },
  depositInfo: { flex: 1, marginLeft: SPACING.sm },
  depositName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
  depositDate: { fontSize: FONT_SIZES.xs, color: COLORS.gray },
  depositAmount: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary },
  depositNote: { fontSize: FONT_SIZES.sm, color: COLORS.gray, marginTop: SPACING.sm },
  actions: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.sm },
  approveBtn: { flex: 1 },
  rejectBtn: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.gray },
});
