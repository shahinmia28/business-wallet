import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CardMenu() {
  const router = useRouter();

  return (
    <>
      <View style={styles.container}>
        {/* Today */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/today')}
        >
          <Ionicons name='calendar' size={30} color='#9e8044' />
          <Text style={[styles.label, { color: '#2F4F4F' }]}>আজ</Text>
        </TouchableOpacity>

        {/* All */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/all')}
        >
          <Feather name='list' size={30} color='#9e8044' />
          <Text style={[styles.label, { color: '#2F4F4F' }]}>সমস্ত হিসাব</Text>
        </TouchableOpacity>

        {/* Notes */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/notes')}
        >
          <MaterialCommunityIcons name='note-text' size={30} color='#9e8044' />
          <Text style={[styles.label, { color: '#2F4F4F' }]}>নোট</Text>
        </TouchableOpacity>
        {/* Notes */}
      </View>
      <View style={styles.container_2}>
        {/* Customer */}
        <TouchableOpacity
          style={styles.card2}
          onPress={() => router.push('/customer')}
        >
          <Ionicons name='person-add-outline' size={24} color='#00b4b7' />

          <Text style={[styles.label2, { color: '#2F4F4F' }]}>কাস্টমার</Text>
        </TouchableOpacity>

        {/* Supplier */}
        <TouchableOpacity
          style={styles.card2}
          onPress={() => router.push('/supplier')}
        >
          <Feather name='truck' size={24} color='#00b753' />

          <Text style={[styles.label2, { color: '#2F4F4F' }]}>সাপ্লায়ার</Text>
        </TouchableOpacity>
      </View>
    </>
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
    boxShadow: '-2px 10px 20px 1px rgba(27, 27, 29, 0.125)',
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  label: {
    fontWeight: 'normal',
    fontSize: 14,
    marginTop: 8,
  },

  container_2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10, // React Native version support করলে
  },

  card2: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
    boxShadow: '-2px 10px 20px 1px rgba(27, 27, 29, 0.125)',
  },

  label2: {
    fontWeight: 'semi-bold',
    fontSize: 16,
    marginLeft: 10,
  },
});
