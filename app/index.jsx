import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontAwesome } from '@expo/vector-icons';
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

      <View style={styles.openCalcBtnContainer}>
        {calcResult !== null && (
          <Text style={{ marginBottom: 10, fontSize: 12, color: '#686868' }}>
            Result = {calcResult}
          </Text>
        )}
        <TouchableOpacity
          style={styles.openCalcBtn}
          onPress={() => setCalcVisible(true)}
        >
          <FontAwesome name='calculator' size={35} color='#ff8000' />
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
    backgroundColor: '#ffffff',
    height: '100%',
  },
  openCalcBtn: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 100,
    alignItems: 'center',
    boxShadow: '0 6px 30px #00000022',
  },
  openCalcBtnContainer: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    alignItems: 'center',
  },
  openCalcBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
