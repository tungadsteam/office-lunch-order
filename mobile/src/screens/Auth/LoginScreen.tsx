import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async () => {
    const e: Record<string, string> = {};
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr) e.email = emailErr;
    if (passErr) e.password = passErr;
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.emoji}>🍱</Text>
            <Text style={styles.title}>Quỹ Cơm Trưa</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
          </View>

          <View style={styles.form}>
            <Input label="Email" placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={errors.email} />
            <Input label="Mật khẩu" placeholder="Nhập mật khẩu" secureTextEntry value={password} onChangeText={setPassword} error={errors.password} />
            <Button title="Đăng nhập" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.sm }} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Đăng ký ngay</Text>
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
  emoji: { fontSize: 64, marginBottom: spacing.sm },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 16, color: colors.gray[500], marginTop: spacing.xs },
  form: { marginBottom: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: colors.gray[500] },
  link: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
