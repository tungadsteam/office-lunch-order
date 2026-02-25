import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import DashboardScreen from '../screens/Home/DashboardScreen';
import OrderDetailsScreen from '../screens/Home/OrderDetailsScreen';
import PaymentScreen from '../screens/Payment/PaymentScreen';
import DepositScreen from '../screens/Deposit/DepositScreen';
import AdminDashboard from '../screens/Admin/AdminDashboard';
import ApprovalsScreen from '../screens/Admin/ApprovalsScreen';
import { COLORS } from '../utils/constants';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.white, shadowOpacity: 0.1 },
            headerTintColor: COLORS.primary,
            headerTitleStyle: { fontWeight: '600' },
            cardStyle: { backgroundColor: COLORS.background },
          }}
        >
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{ title: 'Chi tiết đặt cơm' }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{ title: 'Nhập hóa đơn' }}
          />
          <Stack.Screen
            name="Deposit"
            component={DepositScreen}
            options={{ title: 'Nạp tiền' }}
          />
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboard}
            options={{ title: 'Admin' }}
          />
          <Stack.Screen
            name="Approvals"
            component={ApprovalsScreen}
            options={{ title: 'Duyệt nạp tiền' }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
