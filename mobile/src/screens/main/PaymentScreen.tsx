import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { orderService } from '../../api/services/orderService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';
import { validateAmount } from '../../utils/validators';

export default function PaymentScreen({ navigation }: any) {
  const [totalBill, setTotalBill] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const err = validateAmount(totalBill);
    if (err) { setError(err); return; }
    setError(null);

    const amount = parseInt(totalBill.replace(/[^0-9]/g, ''), 10);
    Alert.alert(
      'Xác nhận thanh toán',
      `Tổng hóa đơn: ${formatCurrency(amount)}\n\nSố tiền sẽ được chia đều cho tất cả người đặt cơm.\nAdmin sẽ chuyển khoản ${formatCurrency(amount)} lại cho bạn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await orderService.submitPayment(amount);
              const msg = result.data?.message ||
                `${result.data?.participants} người × ${formatCurrency(result.data?.amount_per_person || 0)}\n\nAdmin sẽ chuyển khoản ${formatCurrency(amount)} cho bạn. Kiểm tra mục "Hoàn tiền" để theo dõi.`;
              Alert.alert('✅ Thành công', msg, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Thanh toán thất bại');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card title="💰 Nhập hóa đơn">
            <Text style={styles.desc}>Nhập số tiền thực tế bạn đã thanh toán. Hệ thống sẽ chia đều cho tất cả người đặt cơm hôm nay.</Text>
            <Input label="Tổng tiền hóa đơn (VND)" placeholder="500000" keyboardType="numeric" value={totalBill} onChangeText={setTotalBill} error={error || undefined} />
            <Input label="Ghi chú (tùy chọn)" placeholder="Quán Cơm Tấm 37" value={note} onChangeText={setNote} />

            <Text style={styles.warning}>⚠️ Sau khi xác nhận, tất cả người đặt sẽ bị trừ tiền đều nhau. Admin sẽ chuyển khoản tổng tiền cho bạn — theo dõi tại mục "Hoàn tiền".</Text>

            <Button title="Xác nhận thanh toán" onPress={handleSubmit} loading={loading} disabled={!totalBill} style={{ marginTop: spacing.md }} />
            <Button title="Quay lại" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  desc: { fontSize: 14, color: colors.gray[500], marginBottom: spacing.md, lineHeight: 20 },
  warning: { fontSize: 13, color: colors.warning, marginTop: spacing.sm, lineHeight: 18 },
});
