import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Alert, RefreshControl } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import BuyerBadge from '../../components/order/BuyerBadge';
import ParticipantsList from '../../components/order/ParticipantsList';
import { useAuth } from '../../hooks/useAuth';
import { useOrder } from '../../hooks/useOrder';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function OrderTodayScreen({ navigation }: any) {
  const { user } = useAuth();
  const { session, orders, isJoined, loading, refresh, join, leave } = useOrder(5000);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isBuyer = session?.buyer_ids?.includes(user?.id || 0);
  const canOrder = session?.status === 'ordering';

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await join();
      Alert.alert('✅', 'Đã đặt cơm thành công!');
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đặt cơm');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = () => {
    Alert.alert('Hủy đặt cơm', 'Bạn có chắc muốn hủy?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đặt',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await leave();
          } catch (err: any) {
            Alert.alert('Lỗi', err.response?.data?.message || 'Không thể hủy');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Session Info */}
        <Card>
          <View style={styles.headerRow}>
            <Text style={styles.date}>
              {session ? formatDate(session.date) : 'Hôm nay'}
            </Text>
            {session && (
              <Badge
                label={ORDER_STATUS_LABELS[session.status] || session.status}
                color={session.status === 'settled' ? colors.success : colors.primary}
              />
            )}
          </View>
          <Text style={styles.count}>{session?.total_participants || 0} người đã đặt</Text>

          {canOrder && <Text style={styles.deadline}>⏰ Chốt sổ lúc 11:30 AM</Text>}
        </Card>

        {/* Join/Leave Button */}
        {canOrder && (
          <Button
            title={isJoined ? '❌ Hủy đặt cơm' : '✅ Đặt cơm hôm nay'}
            variant={isJoined ? 'danger' : 'primary'}
            size="lg"
            onPress={isJoined ? handleLeave : handleJoin}
            loading={actionLoading}
            style={{ marginBottom: spacing.md }}
          />
        )}

        {/* Buyer Notice */}
        {isBuyer && session?.status === 'buyers_selected' && (
          <Card style={{ backgroundColor: '#FFF3CD' }}>
            <Text style={styles.buyerNotice}>🎯 Bạn được chọn đi mua hôm nay!</Text>
            <Button
              title="Nhập hóa đơn"
              onPress={() => navigation.navigate('Payment')}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}

        {/* Selected Buyers */}
        {session?.buyers && session.buyers.length > 0 && (
          <BuyerBadge buyers={session.buyers} payerId={session.payer_id} />
        )}

        {/* Settlement Info */}
        {session?.status === 'settled' && session.amount_per_person && (
          <Card style={{ backgroundColor: '#D4EDDA' }}>
            <Text style={styles.settledText}>
              💰 Đã quyết toán: {formatCurrency(session.amount_per_person)}/người
            </Text>
            <Text style={styles.settledTotal}>
              Tổng: {formatCurrency(session.total_bill || 0)}
            </Text>
          </Card>
        )}

        {/* Participants */}
        {orders.length > 0 && (
          <Card>
            <ParticipantsList orders={orders} buyerIds={session?.buyer_ids} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  loading: { textAlign: 'center', marginTop: 100, color: colors.gray[500], fontSize: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 18, fontWeight: '700', color: colors.text },
  count: { fontSize: 14, color: colors.gray[500], marginTop: spacing.xs },
  deadline: { fontSize: 14, color: colors.warning, marginTop: spacing.sm, fontWeight: '500' },
  buyerNotice: { fontSize: 16, fontWeight: '600', color: '#856404' },
  settledText: { fontSize: 16, fontWeight: '600', color: '#155724' },
  settledTotal: { fontSize: 14, color: '#155724', marginTop: 4 },
});
