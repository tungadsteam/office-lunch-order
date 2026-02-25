import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { adminApi } from '../../api/admin';
import { AdminStats } from '../../types';
import { COLORS, FONT_SIZES, SPACING, ORDER_STATUS_LABELS } from '../../utils/constants';

export default function AdminDashboard({ navigation }: any) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const result = await adminApi.getStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>⚙️ Admin Dashboard</Text>

        {/* Stats Grid */}
        <View style={styles.grid}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.users.total || 0}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>
              {((stats?.users.total_balance || 0) / 1000).toFixed(0)}k
            </Text>
            <Text style={styles.statLabel}>Tổng quỹ (đ)</Text>
          </Card>
        </View>

        <View style={styles.grid}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.sessions.settled || 0}</Text>
            <Text style={styles.statLabel}>Sessions đã quyết toán</Text>
          </Card>
          <Card style={[styles.statCard, stats?.pending_deposits.count ? { backgroundColor: '#FFF3CD' } : {}]}>
            <Text style={styles.statNumber}>{stats?.pending_deposits.count || 0}</Text>
            <Text style={styles.statLabel}>Deposits chờ duyệt</Text>
          </Card>
        </View>

        {/* Today */}
        {stats?.today && (
          <Card title="📅 Hôm nay">
            <Text style={styles.todayText}>
              Status: {ORDER_STATUS_LABELS[stats.today.status as keyof typeof ORDER_STATUS_LABELS] || stats.today.status}
            </Text>
            <Text style={styles.todayText}>
              Participants: {stats.today.participants}
            </Text>
            {stats.today.total_bill && (
              <Text style={styles.todayText}>
                Total: {stats.today.total_bill.toLocaleString('vi-VN')} đ
              </Text>
            )}
          </Card>
        )}

        {/* Quick Actions */}
        <Card title="🚀 Quick Actions">
          <Button
            title="Duyệt nạp tiền"
            onPress={() => navigation.navigate('Approvals')}
            style={styles.actionButton}
          />
          <Button
            title="Quản lý users"
            variant="outline"
            onPress={() => navigation.navigate('UserManagement')}
            style={styles.actionButton}
          />
          <Button
            title="Quay lại"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  grid: { flexDirection: 'row', gap: SPACING.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg },
  statNumber: { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.gray, marginTop: SPACING.xs, textAlign: 'center' },
  todayText: { fontSize: FONT_SIZES.md, color: COLORS.text, marginBottom: SPACING.xs },
  actionButton: { marginBottom: SPACING.sm },
});
