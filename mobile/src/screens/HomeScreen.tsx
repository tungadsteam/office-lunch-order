import { View, Text, Button, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user, balance, fetchBalance, placeOrder } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBalance().finally(() => setRefreshing(false));
  }, [fetchBalance]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Welcome, {user?.fullName}!</Text>
      <Text style={styles.balance}>Current Balance: {balance.toLocaleString()} VND</Text>
      <Button title="Place Today's Order" onPress={placeOrder} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balance: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default HomeScreen;
