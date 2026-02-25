import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import UserAvatar from '../../components/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../api/orders';
import { COLORS, FONT_SIZES, SPACING, ORDER_STATUS_LABELS } from '../../utils/constants';
import { LunchSession, Order } from '../../types';

export default function DashboardScreen({ navigation }: any) {
  const { user, logout, refreshUser } = useAuth();
  const [session, setSession] = useState<LunchSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    loadTodayData();
    // Polling every 10 seconds
    const interval = setInterval(loadTodayData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayData = async () => {
    try {
      const response = await ordersApi.getToday();
      if (response.success) {
        setSession(response.data.session);
        setOrders(response.data.orders);
        setIsJoined(response.data.is_joined);
      }
    } catch (error) {
      console.error('Load today data error:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTodayData(), refreshUser()]);
    setRefreshing(false);
  }, []);

  const handleJoin = async () => {
    setJoinLoading(true);
    try {
      await ordersApi.joinToday();
      setIsJoined(true);
      await loadTodayData();
      Alert.alert('✅', 'Đã đặt cơm thành công!');
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đặt cơm');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    Alert.alert('Hủy đặt cơm', 'Bạn có chắc muốn hủy đặt cơm hôm nay?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đặt',
        style: 'destructive',
        onPress: async () => {
          setJoinLoading(true);
          try {
            await ordersApi.leaveToday();
            setIsJoined(false);
            await loadTodayData();
          } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy');
          } finally {
            setJoinLoading(false);
          }
        },
      },
    ]);
  };

  const isBuyer = session?.buyer_ids?.includes(user?.id || 0);
  const canOrder = session?.status === 'ordering';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* User Header */}
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <UserAvatar name={user?.name || 'U'} size={48} />
            <View style={styles.userText}>
              <Text style={styles.greeting}>Xin chào,</Text>
              <Text style={styles.userName}>{user?.name}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceAmount}>
            {(user?.balance || 0).toLocaleString('vi-VN')} đ
          </Text>
          <View style={styles.balanceActions}>
            <Button
              title="Nạp tiền"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('Deposit')}
              style={styles.balanceButton}
            />
            <Button
              title="Lịch sử"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('TransactionHistory')}
              style={styles.balanceButton}
            />
          </View>
        </Card>

        {/* Today's Order Card */}
        <Card title="🍱 Cơm trưa hôm nay">
          {session && (
            <View style={styles.sessionStatus}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
                <Text style={styles.statusText}>{ORDER_STATUS_LABELS[session.status]}</Text>
              </View>
              <Text style={styles.participantCount}>
                {session.total_participants} người đã đặt
              </Text>
            </View>
          )}

          {/* Order deadline warning */}
          {canOrder && (
            <Text style={styles.deadline}>⏰ Chốt sổ lúc 11:30 AM</Text>
          )}

          {/* Join/Leave Button */}
          {canOrder && (
            <Button
              title={isJoined ? '❌ Hủy đặt cơm' : '✅ Đặt cơm'}
              variant={isJoined ? 'danger' : 'primary'}
              onPress={isJoined ? handleLeave : handleJoin}
              loading={joinLoading}
              style={styles.orderButton}
            />
          )}

          {/* Buyer notification */}
          {isBuyer && session?.status === 'buyers_selected' && (
            <View style={styles.buyerNotice}>
              <Text style={styles.buyerNoticeText}>
                🎯 Bạn được chọn đi mua hôm nay!
              </Text>
              <Button
                title="Nhập hóa đơn"
                onPress={() => navigation.navigate('Payment')}
                style={{ marginTop: SPACING.sm }}
              />
            </View>
          )}

          {/* Selected buyers */}
          {session?.buyers && session.buyers.length > 0 && (
            <View style={styles.buyersSection}>
              <Text style={styles.sectionLabel}>Người đi mua:</Text>
              {session.buyers.map((buyer) => (
                <View key={buyer.id} style={styles.buyerItem}>
                  <UserAvatar name={buyer.name} size={28} />
                  <Text style={styles.buyerName}>{buyer.name}</Text>
                  {buyer.id === session.payer_id && (
                    <Text style={styles.payerBadge}>💰 Đã trả</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Settlement info */}
          {session?.status === 'settled' && session.amount_per_person && (
            <View style={styles.settlementInfo}>
              <Text style={styles.settlementText}>
                💰 Đã quyết toán: {session.amount_per_person.toLocaleString('vi-VN')} đ/người
              </Text>
              <Text style={styles.settlementTotal}>
                Tổng: {session.total_bill?.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          )}

          {/* Participants list */}
          {orders.length > 0 && (
            <View style={styles.participantsSection}>
              <Text style={styles.sectionLabel}>Người đặt cơm:</Text>
              {orders.map((order) => (
                <View key={order.id} style={styles.participantItem}>
                  <UserAvatar name={order.name || 'U'} size={28} />
                  <Text style={styles.participantName}>{order.name}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Admin Quick Actions */}
        {user?.role === 'admin' && (
          <Card title="⚙️ Admin">
            <Button
              title="Dashboard Admin"
              variant="secondary"
              onPress={() => navigation.navigate('AdminDashboard')}
              style={styles.adminButton}
            />
            <Button
              title="Duyệt nạp tiền"
              variant="outline"
              onPress={() => navigation.navigate('Approvals')}
              style={styles.adminButton}
            />
            {session?.status === 'ordering' && (
              <Button
                title="🎯 Chọn 4 người đi mua"
                variant="primary"
                onPress={async () => {
                  try {
                    const result = await ordersApi.selectBuyers();
                    Alert.alert('✅', result.message || 'Đã chọn người mua!');
                    await loadTodayData();
                  } catch (error: any) {
                    Alert.alert('Lỗi', error.response?.data?.message || 'Không thể chọn');
                  }
                }}
                style={styles.adminButton}
              />
            )}
          </Card>
        )}

        {/* Order History */}
        <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
          <Card>
            <View style={styles.historyLink}>
              <Text style={styles.historyText}>📋 Lịch sử đặt cơm</Text>
              <Text style={styles.arrow}>→</Text>
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ordering: COLORS.primary,
    buyers_selected: COLORS.warning,
    buying: COLORS.warning,
    payment_submitted: COLORS.secondary,
    settled: COLORS.success,
    cancelled: COLORS.danger,
  };
  return colors[status] || COLORS.gray;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userText: { marginLeft: SPACING.sm },
  greeting: { fontSize: FONT_SIZES.sm, color: COLORS.gray },
  userName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  logoutText: { fontSize: FONT_SIZES.sm, color: COLORS.danger },
  balanceCard: { backgroundColor: COLORS.primary },
  balanceLabel: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: COLORS.white, marginVertical: SPACING.xs },
  balanceActions: { flexDirection: 'row', marginTop: SPACING.sm },
  balanceButton: {
    borderColor: 'rgba(255,255,255,0.5)',
    marginRight: SPACING.sm,
    minWidth: 100,
  },
  sessionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: COLORS.white, fontSize: FONT_SIZES.xs, fontWeight: '600' },
  participantCount: { fontSize: FONT_SIZES.sm, color: COLORS.gray },
  deadline: { fontSize: FONT_SIZES.sm, color: COLORS.warning, marginBottom: SPACING.sm },
  orderButton: { marginTop: SPACING.sm },
  buyerNotice: {
    backgroundColor: '#FFF3CD',
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  buyerNoticeText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#856404' },
  buyersSection: { marginTop: SPACING.md },
  sectionLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.gray, marginBottom: SPACING.xs },
  buyerItem: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  buyerName: { marginLeft: SPACING.sm, fontSize: FONT_SIZES.md, color: COLORS.text },
  payerBadge: { marginLeft: 'auto', fontSize: FONT_SIZES.xs, color: COLORS.success },
  settlementInfo: {
    backgroundColor: '#D4EDDA',
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  settlementText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#155724' },
  settlementTotal: { fontSize: FONT_SIZES.sm, color: '#155724', marginTop: 4 },
  participantsSection: { marginTop: SPACING.md },
  participantItem: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  participantName: { marginLeft: SPACING.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
  adminButton: { marginBottom: SPACING.sm },
  historyLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
  arrow: { fontSize: FONT_SIZES.lg, color: COLORS.gray },
});
