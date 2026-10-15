import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_STORAGE_KEY = 'business-wallet-note-pin-v1';

const ensureSecureStorage = async () => {
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    throw new Error('Secure note locking is not available on this device.');
  }
};

export const hasNotePin = async () => {
  await ensureSecureStorage();
  return (await SecureStore.getItemAsync(PIN_STORAGE_KEY)) !== null;
};

export const saveNotePin = async (pin) => {
  if (!/^\d{4,8}$/.test(pin)) {
    throw new Error('PIN must contain 4 to 8 digits.');
  }
  await ensureSecureStorage();
  const salt = Crypto.randomUUID();
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
  await SecureStore.setItemAsync(
    PIN_STORAGE_KEY,
    JSON.stringify({ salt, hash }),
  );
};

export const verifyNotePin = async (pin) => {
  await ensureSecureStorage();
  const savedValue = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
  if (!savedValue) return false;

  const saved = JSON.parse(savedValue);
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${saved.salt}:${pin}`,
  );
  return hash === saved.hash;
};

export const isNoteBiometricAvailable = async () => {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
};

export const authenticateNoteBiometric = () =>
  LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock your private note',
    cancelLabel: 'Use PIN',
    disableDeviceFallback: true,
  });
