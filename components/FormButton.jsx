import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FormButton() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Income */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/incomeForm')}
      >
        <Ionicons name='trending-up' size={28} color='#2F4F4F' />
        <Text style={[styles.label, { color: '#3A3A3C' }]}>আয়</Text>
      </TouchableOpacity>

      {/* Expense */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/expenseForm')}
      >
        <Ionicons name='trending-down' size={28} color='#b6031b' />
        <Text style={[styles.label, { color: '#3A3A3C' }]}>ব্যয়</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEDED',

    boxShadow: '0 8px 20px rgba(27, 27, 29, 0.08)',
  },
  label: {
    fontWeight: 'semi-bold',
    fontSize: 18,
    marginTop: 4,
  },
});
