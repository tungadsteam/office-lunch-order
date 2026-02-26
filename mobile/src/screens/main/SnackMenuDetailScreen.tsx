import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet,
  Alert, TouchableOpacity, RefreshControl, TextInput,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { snackService, SnackMenuDetail, SnackParticipant } from '../../api/services/snackService';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { formatCurrency } from '../../utils/formatters';

export default function SnackMenuDetailScreen({ route, navigation }: any) {
  const { menuId } = route.params;
  const { user } = useAuth();
  const [detail, setDetail] = useState<SnackMenuDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [addLoading, setAddLoading] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await snackService.getMenu(menuId);
      if (r.success && r.data) setDetail(r.data);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải thông tin menu');
    } finally {
      setLoading(false);
    }
  }, [menuId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAddItem = async () => {
    if (!itemName.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên món'); return; }
    const price = parseFloat(itemPrice);
    if (!price || price <= 0) { Alert.alert('Lỗi', 'Giá phải lớn hơn 0'); return; }
    const qty = parseInt(itemQty) || 1;

    setAddLoading(true);
    try {
      await snackService.addItem(menuId, itemName.trim(), price, qty);
      setShowAddModal(false);
      setItemName(''); setItemPrice(''); setItemQty('1');
      await load();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Thêm món thất bại');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveItem = (itemId: number) => {
    Alert.alert('Xóa món', 'Bạn có chắc muốn xóa?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            await snackService.removeItem(menuId, itemId);
            await load();
          } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Xóa thất bại');
          }
        },
      },
    ]);
  };

  const handleSettle = () => {
    const total = detail?.grand_total || 0;
    Alert.alert(
      'Chốt đơn & Trừ tiền',
      `Tổng cộng: ${formatCurrency(total)}\n\nHệ thống sẽ trừ tiền từng người theo đơn của họ.\nAdmin sẽ chuyển khoản ${formatCurrency(total)} cho bạn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chốt đơn',
          onPress: async () => {
            setSettleLoading(true);
            try {
              const r = await snackService.settle(menuId);
              Alert.alert('✅ Thành công', r.message || 'Đã chốt đơn!', [
                { text: 'OK', onPress: () => { load(); } },
              ]);
            } catch (e: any) {
              Alert.alert('Lỗi', e.response?.data?.message || 'Chốt đơn thất bại');
            } finally {
              setSettleLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !detail) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  const { menu, participants, grand_total, is_creator, my_items } = detail;
  const isOrdering = menu.status === 'ordering';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <Card>
            <View style={styles.headerRow}>
              <Text style={styles.menuTitle}>{menu.title}</Text>
              <Badge
                label={menu.status === 'ordering' ? 'Đang đặt' : 'Đã chốt'}
                color={menu.status === 'ordering' ? colors.primary : colors.success}
              />
            </View>
            <Text style={styles.creator}>Tạo bởi: {menu.creator_name}</Text>
            {menu.notes ? <Text style={styles.notes}>{menu.notes}</Text> : null}
            <Text style={styles.total}>Tổng: {formatCurrency(grand_total)}</Text>
          </Card>

          {/* My items + Add button */}
          {isOrdering && (
            <Card title="🛒 Món của bạn">
              {my_items.length === 0 ? (
                <Text style={styles.emptyItems}>Bạn chưa thêm món nào</Text>
              ) : (
                my_items.map((item: any) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.item_name}</Text>
                      <Text style={styles.itemMeta}>{formatCurrency(item.price)} × {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemSubtotal}>{formatCurrency(item.price * item.quantity)}</Text>
                    <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              <Button
                title="+ Thêm món"
                variant="outline"
                size="sm"
                onPress={() => setShowAddModal(true)}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          )}

          {/* All participants */}
          {participants.length > 0 && (
            <Card title={`👥 Danh sách đặt (${participants.length} người)`}>
              {participants.map((p: SnackParticipant) => (
                <View key={p.user_id} style={styles.participantBlock}>
                  <View style={styles.participantHeader}>
                    <Text style={styles.participantName}>{p.user_name}</Text>
                    <Text style={styles.participantTotal}>{formatCurrency(p.user_total)}</Text>
                  </View>
                  {p.items.map(item => (
                    <Text key={item.id} style={styles.subItem}>
                      • {item.item_name} ({formatCurrency(item.price)} × {item.quantity})
                    </Text>
                  ))}
                </View>
              ))}
            </Card>
          )}

          {/* Settle button - only creator can chốt */}
          {isOrdering && is_creator && participants.length > 0 && (
            <Button
              title="💰 Chốt đơn & Trừ tiền"
              size="lg"
              onPress={handleSettle}
              loading={settleLoading}
              style={styles.settleBtn}
            />
          )}

          {/* Settled info */}
          {menu.status === 'settled' && (
            <Card style={styles.settledCard}>
              <Text style={styles.settledText}>✅ Đã chốt đơn</Text>
              <Text style={styles.settledAmount}>Tổng: {formatCurrency(menu.total_amount)}</Text>
              <Text style={styles.settledNote}>Admin sẽ chuyển khoản hoàn lại cho người tạo menu</Text>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add item modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Thêm món</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Tên món (VD: Trà sữa trân châu)"
              value={itemName}
              onChangeText={setItemName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Giá (VD: 35000)"
              keyboardType="numeric"
              value={itemPrice}
              onChangeText={setItemPrice}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Số lượng (mặc định 1)"
              keyboardType="numeric"
              value={itemQty}
              onChangeText={setItemQty}
            />
            <View style={styles.modalBtns}>
              <Button
                title="Hủy"
                variant="ghost"
                onPress={() => { setShowAddModal(false); setItemName(''); setItemPrice(''); setItemQty('1'); }}
                style={{ flex: 1 }}
              />
              <Button
                title="Thêm"
                onPress={handleAddItem}
                loading={addLoading}
                style={{ flex: 1, marginLeft: spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  loadingText: { textAlign: 'center', marginTop: 80, color: colors.gray[500] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  menuTitle: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1, marginRight: spacing.sm },
  creator: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  notes: { fontSize: 13, color: colors.gray[500], marginTop: 4, fontStyle: 'italic' },
  total: { fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
  emptyItems: { fontSize: 14, color: colors.gray[400], textAlign: 'center', paddingVertical: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: colors.text, fontWeight: '500' },
  itemMeta: { fontSize: 12, color: colors.gray[500] },
  itemSubtotal: { fontSize: 14, fontWeight: '600', color: colors.primary, marginRight: spacing.sm },
  removeBtn: { padding: 4 },
  removeBtnText: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  participantBlock: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  participantHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  participantName: { fontSize: 15, fontWeight: '600', color: colors.text },
  participantTotal: { fontSize: 15, fontWeight: '700', color: colors.primary },
  subItem: { fontSize: 13, color: colors.gray[500], marginTop: 2, marginLeft: spacing.sm },
  settleBtn: { marginVertical: spacing.md },
  settledCard: { backgroundColor: '#D4EDDA', marginTop: spacing.md },
  settledText: { fontSize: 16, fontWeight: '700', color: '#155724' },
  settledAmount: { fontSize: 18, fontWeight: '800', color: '#155724', marginTop: 4 },
  settledNote: { fontSize: 13, color: '#155724', marginTop: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  modalInput: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 8, padding: spacing.sm, fontSize: 15, marginBottom: spacing.sm, color: colors.text },
  modalBtns: { flexDirection: 'row', marginTop: spacing.sm },
});
