import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Calculator from '../components/Calculator'; // Import your calculator
import CardMenu from '../components/CardMenu';
import FormButton from '../components/FormButton';
import Summary from '../components/Summary';

export default function Home() {
  const [calcVisible, setCalcVisible] = useState(false);
  const [calcResult, setCalcResult] = useState(null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Summary />
      <CardMenu />
      <FormButton />

      <TouchableOpacity
        style={styles.openMemoBtn}
        onPress={() => router.push('/memo')}
        accessibilityRole='button'
        accessibilityLabel='ক্যাশ মেমো তৈরি করুন'
      >
        <FontAwesome name='file-text-o' size={29} color='#2F4F4F' />
      </TouchableOpacity>

      <View style={styles.openCalcBtnContainer}>
        {calcResult !== null && (
          <Text
            selectable
            style={{
              marginBottom: 10,
              fontSize: 20,
              fontWeight: 'bold',
              borderColor: '#f0e9dc',
              borderWidth: 1.5,
              paddingHorizontal: 15,
              borderRadius: 8,

              color: '#2F4F4F',
              textSize: '12px',
            }}
          >
            {calcResult}
          </Text>
        )}
        <TouchableOpacity
          style={styles.openCalcBtn}
          onPress={() => setCalcVisible(true)}
        >
          <FontAwesome name='calculator' size={35} color='#2F4F4F' />
        </TouchableOpacity>
      </View>

      {/* Calculator Modal */}
      <Calculator
        visible={calcVisible}
        onClose={() => setCalcVisible(false)}
        onResult={(res) => setCalcResult(res)}
      />
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
  openCalcBtn: {
    backgroundColor: '#f0e9dc',
    padding: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  openCalcBtnContainer: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    alignItems: 'center',
  },
  openMemoBtn: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    width: 67,
    height: 67,
    backgroundColor: '#f0e9dc',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openCalcBtnText: {
    color: '#1B1B1D',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
