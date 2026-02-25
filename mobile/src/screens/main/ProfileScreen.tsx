import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar name={user?.name || 'U'} size={80} />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.role === 'admin' && <Text style={styles.role}>👑 Admin</Text>}
        </View>

        {/* Balance */}
        <Card title="💰 Số dư">
          <Text style={styles.balance}>{formatCurrency(user?.balance || 0)}</Text>
        </Card>

        {/* Stats */}
        <Card title="📊 Thống kê">
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Đã đi mua</Text>
            <Text style={styles.statValue}>{user?.total_bought_times || 0} lần</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Lần mua gần nhất</Text>
            <Text style={styles.statValue}>{user?.last_bought_date || 'Chưa có'}</Text>
          </View>
        </Card>

        {/* Actions */}
        <Button title="📋 Lịch sử giao dịch" variant="outline" onPress={() => navigation.navigate('TransactionHistory')} style={styles.actionBtn} />
        <Button title="💰 Nạp tiền" variant="outline" onPress={() => navigation.navigate('Deposit')} style={styles.actionBtn} />
        <Button title="Đăng xuất" variant="danger" onPress={handleLogout} style={styles.actionBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  header: { alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.lg },
  name: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  email: { fontSize: 14, color: colors.gray[500], marginTop: spacing.xs },
  role: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  balance: { fontSize: 32, fontWeight: '800', color: colors.primary },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  statLabel: { fontSize: 14, color: colors.gray[600] },
  statValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  actionBtn: { marginBottom: spacing.sm },
});
