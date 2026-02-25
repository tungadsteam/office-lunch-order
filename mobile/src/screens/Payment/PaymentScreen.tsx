import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { ordersApi } from '../../api/orders';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function PaymentScreen({ navigation }: any) {
  const [totalBill, setTotalBill] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const amount = parseInt(totalBill.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    Alert.alert(
      'Xác nhận thanh toán',
      `Tổng hóa đơn: ${amount.toLocaleString('vi-VN')} đ\n\nSố tiền sẽ được chia đều cho tất cả người đặt cơm.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await ordersApi.submitPayment(amount);
              Alert.alert(
                '✅ Thành công',
                `Đã quyết toán!\n${result.data?.participants} người × ${result.data?.amount_per_person?.toLocaleString('vi-VN')} đ/người`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Thanh toán thất bại');
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Card title="💰 Nhập hóa đơn">
            <Text style={styles.description}>
              Nhập tổng số tiền bạn đã thanh toán. Hệ thống sẽ tự động chia đều cho tất cả người đặt cơm.
            </Text>

            <Input
              label="Tổng tiền hóa đơn (VND)"
              placeholder="Ví dụ: 500000"
              keyboardType="numeric"
              value={totalBill}
              onChangeText={setTotalBill}
            />

            {totalBill && parseInt(totalBill) > 0 && (
              <View style={styles.preview}>
                <Text style={styles.previewAmount}>
                  {parseInt(totalBill.replace(/[^0-9]/g, '') || '0').toLocaleString('vi-VN')} đ
                </Text>
              </View>
            )}

            <Button
              title="Submit thanh toán"
              onPress={handleSubmit}
              loading={loading}
              disabled={!totalBill}
              style={styles.submitButton}
            />

            <Button
              title="Quay lại"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  preview: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  previewAmount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  submitButton: { marginTop: SPACING.sm },
  cancelButton: { marginTop: SPACING.sm },
});
