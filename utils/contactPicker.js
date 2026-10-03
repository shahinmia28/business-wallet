import * as Contacts from 'expo-contacts';
import { Alert } from 'react-native';

const normalizeBangladeshiPhone = (rawPhone = '') => {
  if (!rawPhone) return '';

  let digits = rawPhone.replace(/[^\d+]/g, '');

  if (!digits) return '';

  if (digits.startsWith('+88')) {
    digits = digits.slice(3);
  }

  if (digits.startsWith('88')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('+')) {
    digits = digits.replace('+', '');
  }

  if (!digits.startsWith('0') && digits.startsWith('1')) {
    digits = `0${digits}`;
  }

  const cleaned = digits.replace(/\D/g, '');

  if (cleaned.length > 11) {
    return cleaned.slice(0, 11);
  }

  return cleaned;
};

const getContactName = (contact) => {
  if (contact?.name) return contact.name;
  const parts = [contact?.firstName, contact?.lastName].filter(Boolean);
  return parts.join(' ') || 'Selected contact';
};

export const pickPhoneFromContacts = async ({ currentName = '' } = {}) => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Contact access is needed so you can choose a phone number from your device contacts.',
      );
      return null;
    }

    const result = await Contacts.presentContactPickerAsync();
    const contact = result?.data ?? result;

    if (!contact) return null;

    const phoneNumbers = Array.isArray(contact.phoneNumbers)
      ? contact.phoneNumbers.filter((item) => item && item.number)
      : [];

    if (!phoneNumbers.length) {
      Alert.alert(
        'No mobile number',
        'This contact does not have a phone number.',
      );
      return null;
    }

    const contactName = currentName || getContactName(contact);

    if (phoneNumbers.length === 1) {
      return {
        name: contactName,
        phone: normalizeBangladeshiPhone(phoneNumbers[0].number),
      };
    }

    return new Promise((resolve) => {
      const options = phoneNumbers.map((item, index) => ({
        text: `${item.label || `Number ${index + 1}`} — ${normalizeBangladeshiPhone(item.number)}`,
        onPress: () => {
          resolve({
            name: contactName,
            phone: normalizeBangladeshiPhone(item.number),
          });
        },
      }));

      Alert.alert(
        'Choose phone number',
        getContactName(contact),
        [
          ...options,
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        ],
        { cancelable: true },
      );
    });
  } catch (error) {
    console.warn('Contact picker failed:', error?.message || error);
    Alert.alert('Contact error', 'Unable to open device contacts right now.');
    return null;
  }
};

export default pickPhoneFromContacts;
