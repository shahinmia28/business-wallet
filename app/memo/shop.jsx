import { Ionicons } from '@expo/vector-icons';
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
import Toast from 'react-native-toast-message';
import { getShopProfile, saveShopProfile } from '../../database/db';
import useKeyboardHeight from '../../hooks/useKeyboardHeight';

export default function ShopProfilePage() {
  const router = useRouter();
  const keyboardHeight = useKeyboardHeight();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getShopProfile()
      .then((profile) => {
        if (!profile) return;
        setName(profile.name || '');
        setPhone(profile.phone || '');
        setAddress(profile.address || '');
        setDescription(profile.description || '');
      })
      .catch((error) => {
        console.error('Shop profile load failed', error);
        Toast.show({ type: 'error', text1: 'দোকানের তথ্য লোড করা যায়নি' });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'দোকানের নাম লিখুন' });
      return;
    }

    setSaving(true);
    try {
      await saveShopProfile({ name, phone, address, description });
      Toast.show({ type: 'success', text1: 'দোকানের তথ্য সংরক্ষণ হয়েছে' });
      router.back();
    } catch (error) {
      console.error('Shop profile save failed', error);
      Toast.show({ type: 'error', text1: 'দোকানের তথ্য সংরক্ষণ করা যায়নি' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: keyboardHeight ? keyboardHeight + 96 : 36 },
        ]}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='none'
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name='arrow-back' size={23} color='#2F4F4F' />
          </TouchableOpacity>
          <Text style={styles.title}>দোকানের তথ্য</Text>
        </View>
        <Text style={styles.helpText}>
          এই তথ্য একবার সংরক্ষণ করলে প্রতিটি নতুন মেমোতে স্বয়ংক্রিয়ভাবে যুক্ত হবে।
        </Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder='দোকানের নাম *'
          editable={!loading}
          returnKeyType='next'
        />
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder='দোকানের ফোন নম্বর'
          keyboardType='phone-pad'
          editable={!loading}
          returnKeyType='next'
        />
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder='দোকানের ঠিকানা'
          editable={!loading}
          returnKeyType='next'
        />
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={description}
          onChangeText={setDescription}
          placeholder='দোকানের বিবরণ'
          multiline
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.saveButton, (loading || saving) && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading || saving}
        >
          <Ionicons name='save-outline' size={19} color='#fff' />
          <Text style={styles.saveButtonText}>
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'দোকানের তথ্য সংরক্ষণ'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, padding: 18, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButton: { width: 42, paddingVertical: 6 },
  title: { fontSize: 21, fontWeight: '700', color: '#1B1B1D' },
  helpText: { color: '#667085', lineHeight: 21, marginBottom: 18 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d9dfdf',
    borderRadius: 11,
    paddingHorizontal: 13,
    color: '#1B1B1D',
    fontSize: 15,
    marginBottom: 12,
  },
  descriptionInput: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  saveButton: {
    minHeight: 52,
    backgroundColor: '#2F4F4F',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
});
