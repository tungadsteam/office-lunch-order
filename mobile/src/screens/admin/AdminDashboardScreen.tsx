import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { adminService } from '../../api/services/adminService';
import { orderService } from '../../api/services/orderService';
import { AdminStats } from '../../types/api.types';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { Alert } from 'react-native';

export default function AdminDashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const r = await adminService.getStats();
      if (r.success && r.data) setStats(r.data);
    } catch {}
  };

  const onRefresh = async () => { setRefreshing(true); await loadStats(); setRefreshing(false); };

  const handleSelectBuyers = async () => {
    try {
      const r = await orderService.selectBuyers();
      Alert.alert('✅', r.message || 'Đã chọn người mua!');
      await loadStats();
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể chọn');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.title}>⚙️ Admin Dashboard</Text>

        <View style={styles.grid}>
          <Card style={styles.stat}><Text style={styles.num}>{stats?.users.total || 0}</Text><Text style={styles.lbl}>Users</Text></Card>
          <Card style={styles.stat}><Text style={styles.num}>{formatCurrency(stats?.users.total_balance || 0)}</Text><Text style={styles.lbl}>Tổng quỹ</Text></Card>
        </View>
        <View style={styles.grid}>
          <Card style={styles.stat}><Text style={styles.num}>{stats?.sessions.settled || 0}</Text><Text style={styles.lbl}>Settled</Text></Card>
          <Card style={[styles.stat, stats?.pending_deposits.count ? { backgroundColor: '#FFF3CD' } : {}]}><Text style={styles.num}>{stats?.pending_deposits.count || 0}</Text><Text style={styles.lbl}>Chờ duyệt</Text></Card>
        </View>

        {stats?.today && (
          <Card title="📅 Hôm nay">
            <Text style={styles.info}>Status: {ORDER_STATUS_LABELS[stats.today.status] || stats.today.status}</Text>
            <Text style={styles.info}>Participants: {stats.today.participants}</Text>
          </Card>
        )}

        <Card title="🚀 Actions">
          {stats?.today?.status === 'ordering' && (
            <Button title="🎯 Chọn 4 người đi mua" onPress={handleSelectBuyers} style={styles.btn} />
          )}
          <Button title="📋 Duyệt nạp tiền" variant="outline" onPress={() => navigation.navigate('PendingDeposits')} style={styles.btn} />
          <Button title="👥 Quản lý users" variant="outline" onPress={() => navigation.navigate('UsersList')} style={styles.btn} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  grid: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  num: { fontSize: 20, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  lbl: { fontSize: 12, color: colors.gray[500], marginTop: spacing.xs, textAlign: 'center' },
  info: { fontSize: 15, color: colors.text, marginBottom: spacing.xs },
  btn: { marginBottom: spacing.sm },
});
