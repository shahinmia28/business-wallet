import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import Toast from 'react-native-toast-message';
import { insertCustomer } from '../database/db';

export default function AddCustomer() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'কাস্টমারের নাম দিন' });
      return;
    }
    setSaving(true);
    try {
      await insertCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        note: note.trim(),
        createdAt: dayjs().toISOString(),
      });
      Toast.show({ type: 'success', text1: 'কাস্টমার যোগ হয়েছে' });
      router.back();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'যোগ করা যায়নি', text2: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.wrapper}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>New Customer</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>নাম *</Text>
          <TextInput
            style={styles.input}
            placeholder='কাস্টমারের নাম'
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>ফোন নম্বর</Text>
          <TextInput
            style={styles.input}
            placeholder='01XXXXXXXXX'
            keyboardType='phone-pad'
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>ঠিকানা</Text>
          <TextInput
            style={styles.input}
            placeholder='ঠিকানা লিখুন'
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>নোট</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder='অতিরিক্ত তথ্য (ঐচ্ছিক)'
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    paddingHorizontal: 16,
    marginTop: 70,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    boxShadow: '0 6px 30px #00000022',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f4f6f8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#11181C',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  headerRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  headerTitle: {
    flex: 3,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#575757',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#dd0000', fontWeight: '400', fontSize: 15 },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
  },
  saveBtnText: { color: '#008080ff', fontWeight: '400', fontSize: 15 },
});
