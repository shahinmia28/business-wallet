import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Calculator from '../components/Calculator';
import { useData } from '../context/DataContext';
import BDDateTime from '../utils/BDDateTime';

export default function ExpenseForm() {
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const { addExpense } = useData();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!reason || !amount || !selectedDate) return;

    await addExpense({
      reason,
      amount: Number(amount),
      date: selectedDate.toISOString(), // DB তে পাঠানো হচ্ছে string হিসেবে
    });

    setReason('');
    setAmount('');
    setSelectedDate(new Date());
  };

  useEffect(() => setSelectedDate(new Date()), []);

  const expenseCategories = ['বাজার', 'বিল', 'ভাড়া', 'ঔষধ'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={styles.container}
      >
        <Text style={styles.header}>ব্যয় যোগ করুন</Text>

        {/* Reason */}
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder='ব্যয় কিভাবে হয়েছে ?'
        />

        {/* Icon Buttons */}
        <View style={styles.iconRow}>
          {expenseCategories.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.iconButton,
                reason === item && styles.selectedIconButton,
              ]}
              onPress={() => setReason(item)}
            >
              <Text style={{ color: '#5f5f5f' }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <TextInput
          style={styles.input}
          keyboardType='numeric'
          value={amount}
          onChangeText={setAmount}
          placeholder='৳ কত টাকা ?'
        />

        {/* Date Picker */}

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowPicker(true)}
        >
          <Text style={{ color: '#5f5f5f' }}>{BDDateTime(selectedDate)}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode='date'
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              if (date) setSelectedDate(date);
              setShowPicker(false);
            }}
          />
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.buttonText}>ফিরে যান</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>হিসাব করুন</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Calculator Floating Button */}
      <TouchableOpacity
        style={styles.calcFloatBtn}
        onPress={() => setShowCalc(true)}
      >
        <FontAwesome name='calculator' size={35} color='#ff8000' />
      </TouchableOpacity>

      {/* Calculator Modal */}
      <Calculator
        visible={showCalc}
        onClose={() => setShowCalc(false)}
        onResult={(res) => setAmount(String(res))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    height: '100%',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#ffffff',
    boxShadow: '0 6px 30px #00000022',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    boxShadow: '0 6px 30px #00000022',
    borderRadius: 12,
  },
  selectedIconButton: { backgroundColor: '#fd2c2c19' },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },

  backButton: { backgroundColor: '#374151' },
  submitButton: { backgroundColor: '#ef4444' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  calcFloatBtn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 20px #00000022',
  },
});
