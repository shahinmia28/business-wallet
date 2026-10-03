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
import PrescriptionPhotoPicker from '../components/PrescriptionPhotoPicker';
import { insertCustomer, updateCustomer } from '../database/db';
import { pickPhoneFromContacts } from '../utils/contactPicker';
import {
  saveCustomerPrescriptionImage,
  saveProfileImage,
} from '../utils/customerPrescription';

export default function AddCustomer() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [prescriptionPhotoUri, setPrescriptionPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSelectContact = async () => {
    const selected = await pickPhoneFromContacts({
      currentName: name,
      currentPhone: phone,
    });
    if (!selected) return;

    if (!name.trim() && selected.name) {
      setName(selected.name.trim());
    }

    if (selected.phone) {
      setPhone(selected.phone);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'কাস্টমারের নাম দিন' });
      return;
    }
    setSaving(true);
    try {
      const result = await insertCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        note: note.trim(),
        createdAt: dayjs().toISOString(),
      });

      const customerId = result?.lastInsertRowId ?? result?.insertId;
      if (profileImageUri && customerId) {
        const storedProfilePath = await saveProfileImage({
          uri: profileImageUri,
          ownerId: customerId,
          ownerType: 'customer',
        });

        await updateCustomer({
          id: customerId,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          note: note.trim(),
          profileImagePath: storedProfilePath,
        });
      }

      if (prescriptionPhotoUri && customerId) {
        const storedPhotoPath = await saveCustomerPrescriptionImage({
          uri: prescriptionPhotoUri,
          customerId,
        });

        await updateCustomer({
          id: customerId,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          note: note.trim(),
          prescriptionPhotoPath: storedPhotoPath,
        });
      }

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

          <PrescriptionPhotoPicker
            value={profileImageUri}
            onChange={setProfileImageUri}
            label='Profile Image'
            variant='avatar'
          />

          <Text style={styles.label}>নাম *</Text>
          <TextInput
            style={styles.input}
            placeholder='কাস্টমারের নাম'
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>ফোন নম্বর</Text>
          <View style={styles.phoneRow}>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder='01XXXXXXXXX'
              keyboardType='phone-pad'
              value={phone}
              onChangeText={setPhone}
            />
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={handleSelectContact}
              accessibilityLabel='Select phone number from contacts'
            >
              <Ionicons name='person-add-outline' size={20} color='#2F4F4F' />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>ঠিকানা</Text>
          <TextInput
            style={styles.input}
            placeholder='ঠিকানা লিখুন'
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>নোট</Text>
          <TextInput
            style={[styles.input]}
            placeholder='অতিরিক্ত তথ্য '
            value={note}
            onChangeText={setNote}
          />

          <PrescriptionPhotoPicker
            value={prescriptionPhotoUri}
            onChange={setPrescriptionPhotoUri}
            label='Prescription'
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#EAEDED',
    paddingHorizontal: 16,
    marginTop: 70,
  },

  card: {
    backgroundColor: '#EAEDED',
    borderRadius: 20,
    padding: 16,
    boxShadow: '0 8px 24px rgba(27, 27, 29, 0.08)',
    borderWidth: 1,
    borderColor: '#D7DCDC',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#EAEDED',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1B1B1D',
    borderWidth: 1,
    borderColor: '#D7DCDC',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
  },
  contactBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D7DCDC',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#1B1B1D',
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
  saveBtnText: { color: '#2F4F4F', fontWeight: '600', fontSize: 15 },
});
