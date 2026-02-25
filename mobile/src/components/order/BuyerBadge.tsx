import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Avatar from '../common/Avatar';
import { User } from '../../types/user.types';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';

interface Props {
  buyers: User[];
  payerId?: number;
}

export default function BuyerBadge({ buyers, payerId }: Props) {
  if (!buyers || buyers.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Biệt đội đi mua</Text>
      {buyers.map((buyer) => (
        <View key={buyer.id} style={styles.row}>
          <Avatar name={buyer.name} size={28} />
          <Text style={styles.name}>{buyer.name}</Text>
          {buyer.id === payerId && <Text style={styles.payer}>💰 Đã trả</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#F57F17', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  name: { marginLeft: spacing.sm, fontSize: 14, color: colors.text, flex: 1 },
  payer: { fontSize: 12, color: colors.success, fontWeight: '600' },
});
