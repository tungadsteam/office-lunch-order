import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView, FlatList, View, Text, StyleSheet,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { snackService, SnackMenu } from '../../api/services/snackService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';

const STATUS_LABELS: Record<string, string> = {
  ordering: 'Đang đặt',
  settled: 'Đã chốt',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  ordering: colors.primary,
  settled: colors.success,
  cancelled: colors.gray[400],
};

export default function SnackMenuListScreen({ navigation }: any) {
  const [menus, setMenus] = useState<SnackMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await snackService.getMenus();
      if (r.success && r.data) setMenus(r.data);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: SnackMenu }) => (
    <TouchableOpacity onPress={() => navigation.navigate('SnackMenuDetail', { menuId: item.id })}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Badge
            label={STATUS_LABELS[item.status] || item.status}
            color={STATUS_COLORS[item.status] || colors.gray[400]}
          />
        </View>
        <Text style={styles.creator}>👤 {item.creator_name}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.meta}>{item.participant_count} người · {formatCurrency(item.current_total || item.total_amount)}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Button
        title="+ Tạo menu mới"
        onPress={() => navigation.navigate('CreateSnackMenu')}
        style={styles.createBtn}
      />
      {loading ? (
        <Text style={styles.empty}>Đang tải...</Text>
      ) : menus.length === 0 ? (
        <Text style={styles.empty}>Chưa có menu nào. Tạo menu đầu tiên!</Text>
      ) : (
        <FlatList
          data={menus}
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
  createBtn: { margin: spacing.md, marginBottom: 0 },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  creator: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  date: { fontSize: 12, color: colors.gray[400] },
  empty: { textAlign: 'center', marginTop: 60, color: colors.gray[400], fontSize: 16, paddingHorizontal: spacing.lg },
});
