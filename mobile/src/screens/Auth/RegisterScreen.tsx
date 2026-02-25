import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { validateEmail, validatePassword, validateName } from '../../utils/validators';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    const e: Record<string, string> = {};
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (nameErr) e.name = nameErr;
    if (emailErr) e.email = emailErr;
    if (passErr) e.password = passErr;
    if (password !== confirmPassword) e.confirmPassword = 'Mật khẩu không khớp';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.emoji}>📝</Text>
            <Text style={styles.title}>Đăng ký</Text>
            <Text style={styles.subtitle}>Tạo tài khoản mới</Text>
          </View>

          <View style={styles.form}>
            <Input label="Họ tên" placeholder="Nguyen Van A" value={name} onChangeText={setName} error={errors.name} />
            <Input label="Email" placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={errors.email} />
            <Input label="Mật khẩu" placeholder="Tối thiểu 6 ký tự" secureTextEntry value={password} onChangeText={setPassword} error={errors.password} />
            <Input label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} error={errors.confirmPassword} />
            <Button title="Đăng ký" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.sm }} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 16, color: colors.gray[500], marginTop: spacing.xs },
  form: { marginBottom: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: colors.gray[500] },
  link: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
