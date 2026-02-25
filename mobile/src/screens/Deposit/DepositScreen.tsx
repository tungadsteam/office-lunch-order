import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { transactionsApi } from '../../api/transactions';
import { adminApi } from '../../api/admin';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function DepositScreen({ navigation }: any) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBankInfo();
  }, []);

  const loadBankInfo = async () => {
    try {
      const result = await adminApi.getBankInfo();
      if (result.success) {
        setBankInfo(result.data || {});
      }
    } catch (error) {
      console.error('Load bank info error:', error);
    }
  };

  const handleDeposit = async () => {
    const depositAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!depositAmount || depositAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await transactionsApi.createDeposit({
        amount: depositAmount,
        note: note || undefined,
      });
      Alert.alert(
        '✅ Đã gửi yêu cầu',
        'Yêu cầu nạp tiền đã được gửi. Admin sẽ duyệt sớm nhất!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Bank Info Card */}
        <Card title="🏦 Thông tin chuyển khoản">
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Ngân hàng:</Text>
            <Text style={styles.bankValue}>{bankInfo.bank_name || '—'}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Số tài khoản:</Text>
            <Text style={styles.bankValue}>{bankInfo.bank_account_number || '—'}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Chủ tài khoản:</Text>
            <Text style={styles.bankValue}>{bankInfo.bank_account_name || '—'}</Text>
          </View>
          <Text style={styles.bankNote}>
            Chuyển khoản đúng số tiền rồi nhấn "Tôi đã nạp tiền" bên dưới.
          </Text>
        </Card>

        {/* Deposit Form */}
        <Card title="💰 Nạp tiền vào quỹ">
          <Input
            label="Số tiền (VND)"
            placeholder="Ví dụ: 500000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Input
            label="Ghi chú (tùy chọn)"
            placeholder="VD: Nạp tiền tháng 2"
            value={note}
            onChangeText={setNote}
          />

          <Button
            title="Tôi đã nạp tiền"
            onPress={handleDeposit}
            loading={loading}
            disabled={!amount}
            style={styles.depositButton}
          />

          <Button
            title="Quay lại"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bankLabel: { fontSize: FONT_SIZES.sm, color: COLORS.gray },
  bankValue: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
  bankNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  depositButton: { marginTop: SPACING.sm },
  cancelButton: { marginTop: SPACING.sm },
});
