import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Card from '../../components/Card';
import UserAvatar from '../../components/UserAvatar';
import { ordersApi } from '../../api/orders';
import { COLORS, FONT_SIZES, SPACING, ORDER_STATUS_LABELS } from '../../utils/constants';

export default function OrderDetailsScreen({ route }: any) {
  const { sessionId } = route.params || {};
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (sessionId) loadDetails();
  }, [sessionId]);

  const loadDetails = async () => {
    try {
      const result = await ordersApi.getById(sessionId);
      if (result.success) setData(result.data);
    } catch (error) {
      console.error('Load details error:', error);
    }
  };

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  const { session, orders, buyers, payer } = data;
  const statusLabel = ORDER_STATUS_LABELS[session.status as keyof typeof ORDER_STATUS_LABELS] || session.status;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card title={`📅 ${session.session_date}`}>
          <Text style={styles.statusText}>Trạng thái: {statusLabel}</Text>
          <Text style={styles.infoText}>Số người tham gia: {orders?.length || 0}</Text>
          {session.total_bill && (
            <>
              <Text style={styles.infoText}>
                Tổng bill: {parseFloat(session.total_bill).toLocaleString('vi-VN')} đ
              </Text>
              <Text style={styles.infoText}>
                Mỗi người: {parseFloat(session.amount_per_person).toLocaleString('vi-VN')} đ
              </Text>
            </>
          )}
        </Card>

        {buyers && buyers.length > 0 && (
          <Card title="🎯 Người đi mua">
            {buyers.map((b: any) => (
              <View key={b.id} style={styles.userRow}>
                <UserAvatar name={b.name} size={32} />
                <Text style={styles.userName}>{b.name}</Text>
                {payer && payer.id === b.id && (
                  <Text style={styles.payerTag}>💰 Người trả</Text>
                )}
              </View>
            ))}
          </Card>
        )}

        <Card title="👥 Danh sách đặt cơm">
          {orders?.map((o: any) => (
            <View key={o.id} style={styles.userRow}>
              <UserAvatar name={o.name || 'U'} size={28} />
              <Text style={styles.userName}>{o.name}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  loading: { textAlign: 'center', marginTop: 100, color: COLORS.gray },
  statusText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.primary, marginBottom: SPACING.xs },
  infoText: { fontSize: FONT_SIZES.sm, color: COLORS.text, marginBottom: SPACING.xs },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  userName: { marginLeft: SPACING.sm, fontSize: FONT_SIZES.md, color: COLORS.text },
  payerTag: { marginLeft: 'auto', fontSize: FONT_SIZES.xs, color: COLORS.success, fontWeight: '600' },
});
