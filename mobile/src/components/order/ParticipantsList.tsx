import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Avatar from '../common/Avatar';
import { Order } from '../../types/order.types';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

interface Props {
  orders: Order[];
  buyerIds?: number[];
}

export default function ParticipantsList({ orders, buyerIds = [] }: Props) {
  const renderItem = ({ item }: { item: Order }) => {
    const isBuyer = buyerIds.includes(item.user_id);
    return (
      <View style={styles.item}>
        <Avatar name={item.name || 'U'} size={32} />
        <Text style={styles.name}>{item.name || `User #${item.user_id}`}</Text>
        {isBuyer && <Text style={styles.buyerTag}>🛒</Text>}
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.header}>Danh sách đặt cơm ({orders.length} người)</Text>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 14, fontWeight: '600', color: colors.gray[600], marginBottom: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  name: { marginLeft: spacing.sm, fontSize: 15, color: colors.text, flex: 1 },
  buyerTag: { fontSize: 16 },
});
