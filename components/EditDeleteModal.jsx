import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Label } from '@react-navigation/elements';
import Toast from 'react-native-toast-message';
import { useData } from '../context/DataContext';
import BDDateTime from '../utils/BDDateTime';

const expenseCategories = ['বাজার', 'বিল', 'ঔষধ', 'ভাড়া'];

export default function EditDeleteModal({ visible, item, onClose }) {
  if (!item) return null;

  const {
    editExpense,
    editIncome,
    deleteExpense,
    deleteIncome,
    addIncome,
    addExpense,
  } = useData();

  /* ================= STATE ================= */

  const [reason, setReason] = useState(item.reason || '');
  const [amount, setAmount] = useState(String(item.amount || ''));
  const [selAmount, setSelAmount] = useState(
    item.type === 'income' ? String(item.selAmount || '') : ''
  );

  const [selectedDate, setSelectedDate] = useState(new Date(item.date));
  const [showPicker, setShowPicker] = useState(false);

  /* ========== ANDROID BACK FIX ========== */
  useEffect(() => {
    if (!visible) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => sub.remove();
  }, [visible]);

  /* ================= UPDATE ================= */

  const handleUpdate = async () => {
    if (!amount) {
      Alert.alert('Error', 'Amount দিন');
      return;
    }

    if (item.type === 'income' && !selAmount) {
      Alert.alert('Error', 'Sel Amount দিন');
      return;
    }

    const payload =
      item.type === 'income'
        ? {
            id: item.id,
            reason: 'লাভ',
            amount: Number(amount),
            selAmount: Number(selAmount),
            date: selectedDate.toISOString(),
          }
        : {
            id: item.id,
            reason,
            amount: Number(amount),
            date: selectedDate.toISOString(),
          };

    item.type === 'income'
      ? await editIncome(payload)
      : await editExpense(payload);

    onClose();
  };

  /* ================= DELETE ================= */

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      item.type === 'income'
        ? 'এই আয়টি মুছে ফেলতে চান?'
        : 'এই খরচটি মুছে ফেলতে চান?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const backup = { ...item };

            item.type === 'income'
              ? await deleteIncome(item.id)
              : await deleteExpense(item.id);

            onClose();

            Toast.show({
              type: 'success',
              text1: 'Deleted',
              text2: 'UNDO করতে tap করুন',
              autoHide: false,
              onPress: async () => {
                backup.type === 'income'
                  ? await addIncome(backup)
                  : await addExpense(backup);
                Toast.hide();
              },
            });

            setTimeout(() => Toast.hide(), 5000);
          },
        },
      ]
    );
  };

  const headerColor =
    item.type === 'income' ? styles.incomeHeader : styles.expenseHeader;

  /* ================= UI ================= */

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={[styles.header, headerColor]}>
            Edit {item.type === 'income' ? 'Income (আয়)' : 'Expense (খরচ)'}
          </Text>

          {/* ===== INCOME ONLY ===== */}
          {item.type === 'income' && (
            <>
              <Label style={styles.label}>কত টাকা বিক্রি?</Label>
              <TextInput
                style={styles.input}
                keyboardType='numeric'
                value={selAmount}
                onChangeText={setSelAmount}
                placeholder='৳ কত টাকা বিক্রি?'
              />
            </>
          )}

          {/* ===== EXPENSE ONLY ===== */}
          {item.type === 'expense' && (
            <>
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
            </>
          )}

          {/* ===== AMOUNT ===== */}
          {item.type === 'income' && (
            <>
              <Label style={styles.label}>কত টাকা লাভ?</Label>
              <TextInput
                style={styles.input}
                keyboardType='numeric'
                placeholder='কত টাকা লাভ?'
                value={amount}
                onChangeText={setAmount}
              />
            </>
          )}

          {item.type === 'expense' && (
            <TextInput
              style={styles.input}
              keyboardType='numeric'
              placeholder='Amount'
              value={amount}
              onChangeText={setAmount}
            />
          )}

          {/* ===== DATE ===== */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowPicker(true)}
          >
            <Text>{BDDateTime(selectedDate)}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={selectedDate}
              mode='date'
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => {
                if (date) setSelectedDate(date);
                setShowPicker(false);
              }}
            />
          )}

          {/* ===== BUTTONS ===== */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleUpdate}>
              <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>
                Update
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleDelete}>
              <Text style={{ color: '#d01f1f', fontWeight: 'bold' }}>
                Delete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={{ fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  incomeHeader: { color: '#16a34a' },
  expenseHeader: { color: '#d01f1f' },
  label: {
    color: '#606060',
    fontSize: 15,
    fontWeight: 'semi-bold',
    marginBottom: 6,
    marginLeft: 4,
    textAlign: 'left',
  },
  input: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    boxShadow: '0 6px 30px #00000022',
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
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 6,
  },
});
