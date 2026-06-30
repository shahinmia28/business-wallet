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
        <Ionicons name='trending-up' size={28} color='#14b8a6' />
        <Text style={[styles.label, { color: '#14b8a6' }]}>আয়</Text>
      </TouchableOpacity>

      {/* Expense */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/expenseForm')}
      >
        <Ionicons name='trending-down' size={28} color='#ef4444' />
        <Text style={[styles.label, { color: '#ef4444' }]}>ব্যয়</Text>
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
    backgroundColor: 'white',
    boxShadow: '0 6px 30px #00000022',
    backgroundColor: '#ffffff',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 4,
  },
});
