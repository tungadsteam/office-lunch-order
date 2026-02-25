import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import OrderCard from '../../components/order/OrderCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { orderService } from '../../api/services/orderService';
import { OrderHistoryItem } from '../../types/order.types';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

export default function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const result = await orderService.getHistory(50);
      if (result.success && result.data) setHistory(result.data);
    } catch (err) {
      console.error('Load history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        renderItem={({ item }) => (
          <OrderCard item={item} onPress={() => navigation.navigate('OrderDetail', { sessionId: item.session_id })} />
        )}
        keyExtractor={(item) => item.session_id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có lịch sử đặt cơm</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.md },
  empty: { textAlign: 'center', marginTop: 60, color: colors.gray[400], fontSize: 16 },
});
