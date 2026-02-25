import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';
import { User } from '../types/user.types';

export const storage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  },
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },
  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  },
  async getUser(): Promise<User | null> {
    const s = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return s ? JSON.parse(s) : null;
  },
  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
  },
};
