import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { adminService } from '../../api/services/adminService';
import { User } from '../../types/user.types';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';

export default function UsersListScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const r = await adminService.getUsers();
      if (r.success && r.data) setUsers(r.data);
    } catch {}
  };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.item}>
      <Avatar name={item.name} size={40} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.role === 'admin' && <Badge label="Admin" color={colors.secondary} />}
        </View>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <Text style={styles.balance}>{formatCurrency(item.balance)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={i => i.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  info: { flex: 1, marginLeft: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  email: { fontSize: 12, color: colors.gray[500] },
  balance: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
