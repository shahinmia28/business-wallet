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

  const expenseCategories1 = ['বাজার', 'ঔষধ', 'বিদ্যুৎ', 'মোবাইল'];
  const expenseCategories2 = ['ভাড়া', 'শিক্ষা', 'পোশাক', 'গ্যাস'];
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

        {/* Icon Buttons 1*/}
        <View style={styles.iconRow}>
          {expenseCategories1.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.iconButton,
                reason === item && styles.selectedIconButton,
              ]}
              onPress={() => setReason(item)}
            >
              <Text style={{ color: '#3A3A3C' }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Icon Buttons 2 */}
        <View style={styles.iconRow}>
          {expenseCategories2.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.iconButton,
                reason === item && styles.selectedIconButton,
              ]}
              onPress={() => setReason(item)}
            >
              <Text style={{ color: '#3A3A3C' }}>{item}</Text>
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
          <Text style={{ color: '#3A3A3C' }}>{BDDateTime(selectedDate)}</Text>
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
        <FontAwesome name='calculator' size={35} color='#2F4F4F' />
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
    color: '#2F4F4F',
  },
  input: {
    backgroundColor: '#EAEDED',
    boxShadow: '0 8px 20px rgba(27, 27, 29, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#D7DCDC',
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
    boxShadow: '0 8px 20px rgba(27, 27, 29, 0.08)',
    borderRadius: 12,
    backgroundColor: '#EAEDED',
    borderWidth: 0.5,
    borderColor: '#D7DCDC',
  },
  selectedIconButton: { backgroundColor: '#D7DCDC' },

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

  backButton: { backgroundColor: '#3A3A3C' },
  submitButton: { backgroundColor: '#2F4F4F' },
  buttonText: { color: '#EAEDED', fontWeight: 'bold' },
  calcFloatBtn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#EAEDED',
    padding: 16,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 8px 20px rgba(27, 27, 29, 0.08)',
  },
});
