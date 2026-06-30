import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CardMenu() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Today */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/today')}
      >
        <Ionicons name='calendar' size={30} color='#14b8a6' />
        <Text style={[styles.label, { color: '#14b8a6' }]}>আজ</Text>
      </TouchableOpacity>

      {/* All */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/all')}>
        <Feather name='list' size={30} color='#9333ea' />
        <Text style={[styles.label, { color: '#9333ea' }]}>সমস্ত হিসাব</Text>
      </TouchableOpacity>

      {/* Notes */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/notes')}
      >
        <MaterialCommunityIcons name='note-text' size={30} color='#3b82f6' />
        <Text style={[styles.label, { color: '#3b82f6' }]}>নোট</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingVertical: 10,
  },
  card: {
    boxShadow: '0 6px 30px #00000022',
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 8,
  },
});
