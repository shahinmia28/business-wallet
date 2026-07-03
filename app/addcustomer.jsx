import { Ionicons } from '@expo/vector-icons';
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
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name='arrow-back' size={24} color='#11181C' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>নতুন কাস্টমার</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form Card */}
        <View style={styles.card}>
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

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name='checkmark-circle' size={22} color='#fff' />
          <Text style={styles.saveButtonText}>
            {saving ? 'সেভ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 50,
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#11181C' },
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008080ac',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
    gap: 8,
    boxShadow: '0 6px 30px #00000022',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
