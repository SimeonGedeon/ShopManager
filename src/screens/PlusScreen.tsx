import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function PlusScreen() {
  return <View style={s.box}><Text style={s.txt}>⚙️ Plus</Text></View>;
}

const s = StyleSheet.create({ box: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }, txt: { fontSize: 18, color: colors.text } });
