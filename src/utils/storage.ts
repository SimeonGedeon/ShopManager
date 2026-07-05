import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = { TOKEN: '@shop_token', USER: '@shop_user' };

export const getToken = () => AsyncStorage.getItem(KEYS.TOKEN);
export const setToken = (t: string) => AsyncStorage.setItem(KEYS.TOKEN, t);
export const removeToken = () => AsyncStorage.removeItem(KEYS.TOKEN);

export const getUser = async () => { const r = await AsyncStorage.getItem(KEYS.USER); return r ? JSON.parse(r) : null; };
export const setUser = (u: any) => AsyncStorage.setItem(KEYS.USER, JSON.stringify(u));
export const removeUser = () => AsyncStorage.removeItem(KEYS.USER);