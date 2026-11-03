import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Feather, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Calculator from '../components/Calculator'; // Import your calculator
import CardMenu from '../components/CardMenu';
import FormButton from '../components/FormButton';
import Summary from '../components/Summary';

export default function Home() {
  const [calcVisible, setCalcVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Summary />
      <CardMenu />
      <FormButton />

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/products')}
          accessibilityRole='button'
          accessibilityLabel='পণ্যের তালিকা'
        >
          <Feather name='package' size={25} color='#9e8044' />
          <Text style={styles.quickActionLabel}>পণ্য</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/memo')}
          accessibilityRole='button'
          accessibilityLabel='ক্যাশ মেমো তৈরি করুন'
        >
          <FontAwesome name='file-text-o' size={25} color='#9e8044' />
          <Text style={styles.quickActionLabel}>মেমো</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => setCalcVisible(true)}
          accessibilityRole='button'
          accessibilityLabel='ক্যালকুলেটর খুলুন'
        >
          <FontAwesome name='calculator' size={25} color='#9e8044' />
          <Text style={styles.quickActionLabel}>ক্যালকুলেটর</Text>
        </TouchableOpacity>
      </View>

      {/* Calculator Modal */}
      <Calculator visible={calcVisible} onClose={() => setCalcVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    height: '100%',
  },
  quickActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    paddingHorizontal: 4,
    borderRadius: 18,
    backgroundColor: '#fff',
    boxShadow: '-2px 5px 20px 1px rgba(27, 27, 29, 0.125)',
  },
  quickActionLabel: {
    color: '#2F4F4F',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 7,
  },
});
