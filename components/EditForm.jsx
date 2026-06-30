import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useData } from '../context/DataContext';

export default function EditForm({ visible, item, onClose }) {
  const { editExpense, editIncome } = useData();

  const [form, setForm] = useState({
    type: item.type,
    reason: item.reason,
    amount: String(item.amount),
    date: item.date.split('T')[0],
  });

  const handleSubmit = async () => {
    if (item.type === 'income') {
      await editIncome(item._id, { ...form, amount: Number(form.amount) });
    } else {
      await editExpense(item._id, { ...form, amount: Number(form.amount) });
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType='fade'>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.header}>Edit Entry</Text>

          <TextInput
            style={styles.input}
            placeholder='Reason'
            value={form.reason}
            onChangeText={(text) => setForm({ ...form, reason: text })}
          />

          <TextInput
            style={styles.input}
            placeholder='Amount'
            keyboardType='numeric'
            value={form.amount}
            onChangeText={(text) => setForm({ ...form, amount: text })}
          />

          <TextInput
            style={styles.input}
            placeholder='YYYY-MM-DD'
            value={form.date}
            onChangeText={(text) => setForm({ ...form, date: text })}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: 'green',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelText: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});
