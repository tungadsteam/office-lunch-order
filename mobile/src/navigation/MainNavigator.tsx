import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/main/DashboardScreen';
import OrderTodayScreen from '../screens/main/OrderTodayScreen';
import PaymentScreen from '../screens/main/PaymentScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import DepositScreen from '../screens/main/DepositScreen';
import SnackMenuListScreen from '../screens/main/SnackMenuListScreen';
import SnackMenuDetailScreen from '../screens/main/SnackMenuDetailScreen';
import CreateSnackMenuScreen from '../screens/main/CreateSnackMenuScreen';
import MyReimbursementsScreen from '../screens/main/MyReimbursementsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import PendingDepositsScreen from '../screens/admin/PendingDepositsScreen';
import PendingReimbursementsScreen from '../screens/admin/PendingReimbursementsScreen';
import UsersListScreen from '../screens/admin/UsersListScreen';
import { MainStackParamList } from '../types/navigation.types';
import { colors } from '../styles/colors';

const Stack = createStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white, shadowOpacity: 0.1 },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OrderToday" component={OrderTodayScreen} options={{ title: 'Cơm hôm nay' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Nhập hóa đơn' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Lịch sử' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Tài khoản' }} />
      <Stack.Screen name="Deposit" component={DepositScreen} options={{ title: 'Nạp tiền' }} />
      <Stack.Screen name="SnackMenuList" component={SnackMenuListScreen} options={{ title: 'Đồ ăn vặt' }} />
      <Stack.Screen name="SnackMenuDetail" component={SnackMenuDetailScreen} options={{ title: 'Chi tiết đơn' }} />
      <Stack.Screen name="CreateSnackMenu" component={CreateSnackMenuScreen} options={{ title: 'Tạo menu ăn vặt' }} />
      <Stack.Screen name="MyReimbursements" component={MyReimbursementsScreen} options={{ title: 'Hoàn tiền của tôi' }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
      <Stack.Screen name="PendingDeposits" component={PendingDepositsScreen} options={{ title: 'Duyệt nạp tiền' }} />
      <Stack.Screen name="PendingReimbursements" component={PendingReimbursementsScreen} options={{ title: 'Duyệt hoàn tiền' }} />
      <Stack.Screen name="UsersList" component={UsersListScreen} options={{ title: 'Quản lý Users' }} />
    </Stack.Navigator>
  );
}
