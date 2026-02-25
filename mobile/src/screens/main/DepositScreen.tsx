import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Alert, Clipboard } from 'react-native';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { transactionService } from '../../api/services/transactionService';
import { adminService } from '../../api/services/adminService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { validateAmount } from '../../utils/validators';

export default function DepositScreen({ navigation }: any) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.getBankInfo().then(r => { if (r.success && r.data) setBankInfo(r.data); }).catch(() => {});
  }, []);

  const handleDeposit = async () => {
    const err = validateAmount(amount);
    if (err) { setError(err); return; }
    setError(null);

    const depositAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    setLoading(true);
    try {
      await transactionService.createDeposit({ amount: depositAmount, note: note || undefined });
      Alert.alert('✅ Đã gửi yêu cầu', 'Admin sẽ duyệt sớm nhất!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Gửi thất bại');
    } finally {
      setLoading(false);
    }
  };

  const copyAccount = () => {
    if (bankInfo.bank_account_number) {
      Clipboard.setString(bankInfo.bank_account_number);
      Alert.alert('✅', 'Đã copy số tài khoản');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card title="🏦 Thông tin chuyển khoản">
          <View style={styles.row}><Text style={styles.label}>Ngân hàng:</Text><Text style={styles.value}>{bankInfo.bank_name || '—'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Số TK:</Text><Text style={styles.value}>{bankInfo.bank_account_number || '—'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Chủ TK:</Text><Text style={styles.value}>{bankInfo.bank_account_name || '—'}</Text></View>
          <Button title="📋 Copy số TK" variant="ghost" size="sm" onPress={copyAccount} fullWidth={false} style={{ marginTop: spacing.sm }} />
          <Text style={styles.hint}>Chuyển khoản đúng số tiền rồi nhấn "Tôi đã nạp tiền" bên dưới.</Text>
        </Card>

        <Card title="💰 Xác nhận nạp tiền">
          <Input label="Số tiền (VND)" placeholder="500000" keyboardType="numeric" value={amount} onChangeText={setAmount} error={error || undefined} />
          <Input label="Ghi chú (tùy chọn)" placeholder="Nạp tiền tháng 2" value={note} onChangeText={setNote} />
          <Button title="Tôi đã nạp tiền" onPress={handleDeposit} loading={loading} disabled={!amount} />
          <Button title="Quay lại" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: 14, color: colors.gray[500] },
  value: { fontSize: 15, fontWeight: '600', color: colors.text },
  hint: { fontSize: 12, color: colors.warning, marginTop: spacing.sm, fontStyle: 'italic' },
});
