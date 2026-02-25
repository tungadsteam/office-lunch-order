import React, { useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useOrder } from '../../hooks/useOrder';
import Avatar from '../../components/common/Avatar';
import BalanceCard from '../../components/dashboard/BalanceCard';
import TodayOrderSummary from '../../components/dashboard/TodayOrderSummary';
import QuickActions from '../../components/dashboard/QuickActions';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

export default function DashboardScreen({ navigation }: any) {
  const { user, refreshUser, logout } = useAuth();
  const { session, isJoined, refresh } = useOrder();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshUser()]);
    setRefreshing(false);
  }, []);

  const quickActions = [
    { icon: '🍱', label: 'Đặt cơm', onPress: () => navigation.navigate('OrderToday') },
    { icon: '💰', label: 'Nạp tiền', onPress: () => navigation.navigate('Deposit') },
    { icon: '📋', label: 'Lịch sử', onPress: () => navigation.navigate('History') },
    { icon: '👤', label: 'Tài khoản', onPress: () => navigation.navigate('Profile') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userRow}>
            <Avatar name={user?.name || 'U'} size={48} />
            <View style={styles.userText}>
              <Text style={styles.greeting}>Xin chào,</Text>
              <Text style={styles.userName}>{user?.name}</Text>
            </View>
          </View>
          {user?.role === 'admin' && (
            <Text style={styles.adminBadge} onPress={() => navigation.navigate('AdminDashboard')}>
              ⚙️ Admin
            </Text>
          )}
        </View>

        {/* Balance */}
        <BalanceCard
          balance={user?.balance || 0}
          onDeposit={() => navigation.navigate('Deposit')}
          onHistory={() => navigation.navigate('History')}
        />

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Today's Order */}
        <TodayOrderSummary
          session={session}
          isJoined={isJoined}
          onPress={() => navigation.navigate('OrderToday')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userText: { marginLeft: spacing.sm },
  greeting: { fontSize: 14, color: colors.gray[500] },
  userName: { fontSize: 20, fontWeight: '700', color: colors.text },
  adminBadge: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
