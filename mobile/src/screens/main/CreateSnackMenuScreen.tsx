import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
  Alert, StyleSheet,
} from 'react-native';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { snackService } from '../../api/services/snackService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

export default function CreateSnackMenuScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên menu');
      return;
    }

    setLoading(true);
    try {
      const r = await snackService.createMenu(title.trim(), notes.trim() || undefined);
      if (r.success) {
        Alert.alert('✅ Thành công', 'Đã tạo menu đồ ăn vặt!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Tạo menu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card title="🍡 Tạo menu đồ ăn vặt">
            <Input
              label="Tên menu *"
              placeholder="VD: Trà sữa chiều nay, Order đồ ăn vặt..."
              value={title}
              onChangeText={setTitle}
            />
            <Input
              label="Ghi chú (tùy chọn)"
              placeholder="Thông tin thêm..."
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <Button
              title="Tạo menu"
              onPress={handleCreate}
              loading={loading}
              disabled={!title.trim()}
              style={{ marginTop: spacing.md }}
            />
            <Button
              title="Hủy"
              variant="ghost"
              onPress={() => navigation.goBack()}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
});
