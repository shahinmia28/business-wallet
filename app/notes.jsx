import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import NoteEditor from '../components/NoteEditor';
import { useData } from '../context/DataContext';
import {
  authenticateNoteBiometric,
  hasNotePin,
  isNoteBiometricAvailable,
  saveNotePin,
  verifyNotePin,
} from '../utils/noteSecurity';

export default function NotesPage() {
  const { notes, addNote, editNote, deleteNote } = useData();
  const [selectedNote, setSelectedNote] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [securityVisible, setSecurityVisible] = useState(false);
  const [securityMode, setSecurityMode] = useState('unlock');
  const [pendingNote, setPendingNote] = useState(null);
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securityBusy, setSecurityBusy] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);

  useEffect(() => {
    hasNotePin()
      .then(setPinConfigured)
      .catch((error) => console.warn('note PIN status check failed', error));
  }, []);

  // pinned আগে, তারপর বাকিগুলো — createdAt এর উল্টো ক্রমে
  const sorted = [...notes].sort((a, b) => {
    if (b.pinned !== a.pinned) return b.pinned - a.pinned;
    return (
      new Date(b.updatedAt || b.createdAt) -
      new Date(a.updatedAt || a.createdAt)
    );
  });

  const openNew = () => {
    setSelectedNote(null);
    setShowEditor(true);
  };
  const openNote = async (note) => {
    if (!note.isLocked) {
      setSelectedNote(note);
      setShowEditor(true);
      return;
    }

    setPendingNote(note);
    try {
      if (!(await hasNotePin())) {
        startPinSetup(note);
        return;
      }
      if (await isNoteBiometricAvailable()) {
        const result = await authenticateNoteBiometric();
        if (result.success) {
          setSelectedNote(note);
          setShowEditor(true);
          return;
        }
      }
    } catch (error) {
      console.warn('note biometric unlock failed', error);
      if (String(error?.message || '').includes('Secure note locking')) {
        Alert.alert(
          'নোট আনলক করা যাচ্ছে না',
          'এই ডিভাইসে secure storage ব্যবহার করা যাচ্ছে না।',
        );
        return;
      }
    }

    setSecurityMode('unlock');
    setPin('');
    setSecurityError('');
    setSecurityVisible(true);
  };

  const startPinSetup = (note) => {
    setPendingNote(note);
    setSecurityMode('create');
    setPin('');
    setFirstPin('');
    setSecurityError('');
    setSecurityVisible(true);
  };

  const startPinChange = () => {
    setPendingNote(null);
    setSecurityMode('change-current');
    setPin('');
    setFirstPin('');
    setSecurityError('');
    setSecurityVisible(true);
  };

  const handleToggleLock = async (updatedNote) => {
    setSecurityBusy(true);
    try {
      if (updatedNote.isLocked) {
        if (!(await hasNotePin())) {
          setShowEditor(false);
          startPinSetup(updatedNote);
          return;
        }
        await editNote(updatedNote);
        setShowEditor(false);
        setSelectedNote(null);
      } else {
        await editNote(updatedNote);
        setSelectedNote(updatedNote);
      }
    } catch (error) {
      console.warn('note lock update failed', error);
      Alert.alert('সমস্যা হয়েছে', 'নোট লক করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleSecuritySubmit = async () => {
    setSecurityError('');
    if (securityMode === 'change-current') {
      if (!/^\d{4,8}$/.test(pin)) {
        setSecurityError('বর্তমান PIN লিখুন।');
        return;
      }
      setSecurityBusy(true);
      try {
        if (!(await verifyNotePin(pin))) {
          setSecurityError('বর্তমান PIN সঠিক নয়।');
          setPin('');
          return;
        }
        setPin('');
        setSecurityMode('change-create');
      } catch (error) {
        console.warn('current note PIN verification failed', error);
        setSecurityError('PIN যাচাই করা যায়নি। আবার চেষ্টা করুন।');
      } finally {
        setSecurityBusy(false);
      }
      return;
    }

    if (securityMode === 'change-create') {
      if (!/^\d{4,8}$/.test(pin)) {
        setSecurityError('৪ থেকে ৮ সংখ্যার একটি PIN দিন।');
        return;
      }
      setFirstPin(pin);
      setPin('');
      setSecurityMode('change-confirm');
      return;
    }

    if (securityMode === 'change-confirm') {
      if (pin !== firstPin) {
        setSecurityError('দুটি PIN মেলেনি। আবার দিন।');
        setPin('');
        return;
      }
      setSecurityBusy(true);
      try {
        await saveNotePin(pin);
        setPinConfigured(true);
        setSecurityVisible(false);
        setPin('');
        setFirstPin('');
      } catch (error) {
        console.warn('note PIN change failed', error);
        setSecurityError('নতুন PIN সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
      } finally {
        setSecurityBusy(false);
      }
      return;
    }

    if (securityMode === 'create' || securityMode === 'confirm') {
      if (!/^\d{4,8}$/.test(pin)) {
        setSecurityError('৪ থেকে ৮ সংখ্যার একটি PIN দিন।');
        return;
      }
      if (securityMode === 'create') {
        setFirstPin(pin);
        setPin('');
        setSecurityMode('confirm');
        return;
      }
      if (pin !== firstPin) {
        setSecurityError('দুটি PIN মেলেনি। আবার দিন।');
        setPin('');
        return;
      }

      setSecurityBusy(true);
      try {
        await saveNotePin(pin);
        setPinConfigured(true);
        if (pendingNote) {
          await editNote({ ...pendingNote, isLocked: 1 });
        }
        setSecurityVisible(false);
        setPendingNote(null);
        setPin('');
        setFirstPin('');
      } catch (error) {
        console.warn('note PIN setup failed', error);
        setSecurityError('PIN সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
      } finally {
        setSecurityBusy(false);
      }
      return;
    }

    if (!/^\d{4,8}$/.test(pin)) {
      setSecurityError('আপনার PIN লিখুন।');
      return;
    }
    setSecurityBusy(true);
    try {
      if (!(await verifyNotePin(pin))) {
        setSecurityError('PIN সঠিক নয়। আবার চেষ্টা করুন।');
        setPin('');
        return;
      }
      setSecurityVisible(false);
      setPin('');
      setSelectedNote(pendingNote);
      setShowEditor(true);
    } catch (error) {
      console.warn('note PIN verification failed', error);
      setSecurityError('PIN যাচাই করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSecurityBusy(false);
    }
  };

  const renderNote = ({ item }) => {
    const date = dayjs(item.updatedAt || item.createdAt).format('DD MMM YYYY');
    return (
      <TouchableOpacity
        style={styles.noteCard}
        activeOpacity={0.75}
        onPress={() => openNote(item)}
        accessibilityLabel={item.isLocked ? 'লক করা নোট, খুলতে চাপ দিন' : item.title || 'নোট'}
      >
        <View style={styles.noteCardRow}>
          <View style={styles.noteTitleGroup}>
            <Text style={styles.noteTitle} numberOfLines={1}>
              {item.title || 'শিরোনামহীন'}
            </Text>
            <View
              style={[
                styles.typeBadge,
                item.noteType === 'list' && styles.listTypeBadge,
              ]}
            >
              <Ionicons
                name={item.noteType === 'list' ? 'list' : 'document-text-outline'}
                size={12}
                color={item.noteType === 'list' ? '#65708F' : '#52756F'}
              />
              <Text
                style={[
                  styles.typeBadgeText,
                  item.noteType === 'list' && styles.listTypeBadgeText,
                ]}
              >
                {item.noteType === 'list' ? 'LIST' : 'TEXT'}
              </Text>
            </View>
          </View>
          {item.isLocked ? (
            <Ionicons name='lock-closed' size={16} color='#A14F4F' />
          ) : item.pinned ? (
            <Ionicons name='bookmark' size={15} color='#2F4F4F' />
          ) : null}
        </View>
        <Text style={styles.noteDate}>{date}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name='arrow-back' size={22} color='#1B1B1D' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>নোটস</Text>
        <View style={styles.headerButtons}>
          {pinConfigured ? (
            <TouchableOpacity
              onPress={startPinChange}
              style={styles.securitySettingsBtn}
              accessibilityRole='button'
              accessibilityLabel='নোটের PIN পরিবর্তন'
            >
              <Ionicons name='key-outline' size={19} color='#2F4F4F' />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={openNew} style={styles.addBtn}>
            <Ionicons name='add' size={24} color='#EAEDED' />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {sorted.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name='document-outline' size={54} color='#D7DCDC' />
          <Text style={styles.emptyText}>কোনো নোট নেই</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
          renderItem={renderNote}
        />
      )}

      {/* Editor */}
      <NoteEditor
        visible={showEditor}
        note={selectedNote}
        onClose={() => setShowEditor(false)}
        onToggleLock={handleToggleLock}
        onSave={async (data) => {
          if (data.id) {
            await editNote(data);
          } else {
            await addNote({ ...data, pinned: data.pinned ?? 0 });
          }
        }}
        onDelete={(id) => {
          deleteNote(id);
          setShowEditor(false);
        }}
      />

      <Modal
        visible={securityVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setSecurityVisible(false)}
      >
        <View style={styles.securityOverlay}>
          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Ionicons
                name={
                  securityMode === 'unlock' || securityMode === 'change-current'
                    ? 'lock-closed'
                    : 'shield-checkmark'
                }
                size={25}
                color='#52756F'
              />
            </View>
            <Text style={styles.securityTitle}>
              {securityMode === 'unlock'
                ? 'নোট আনলক করুন'
                : securityMode === 'change-current'
                  ? 'বর্তমান PIN দিন'
                  : securityMode === 'change-create'
                    ? 'নতুন PIN তৈরি করুন'
                    : securityMode === 'change-confirm' ||
                        securityMode === 'confirm'
                      ? 'PIN নিশ্চিত করুন'
                      : 'নোটের PIN তৈরি করুন'}
            </Text>
            <Text style={styles.securityDescription}>
              {securityMode === 'unlock'
                ? 'Biometric না হলে PIN দিয়ে নোট খুলুন।'
                : securityMode.startsWith('change-')
                  ? 'PIN পরিবর্তনের আগে বর্তমান PIN যাচাই করা হবে।'
                  : '৪–৮ সংখ্যার PIN দিয়ে locked note সুরক্ষিত রাখুন।'}
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={(value) => {
                setPin(value.replace(/\D/g, '').slice(0, 8));
                setSecurityError('');
              }}
              placeholder={
                securityMode === 'change-current'
                  ? 'বর্তমান PIN'
                  : '৪–৮ সংখ্যার PIN'
              }
              placeholderTextColor='#9AA5A1'
              keyboardType='number-pad'
              secureTextEntry
              maxLength={8}
              autoFocus
              accessibilityLabel='Note security PIN'
            />
            {securityError ? (
              <Text style={styles.securityError}>{securityError}</Text>
            ) : null}
            <TouchableOpacity
              style={[
                styles.securitySubmit,
                securityBusy && styles.securitySubmitDisabled,
              ]}
              onPress={handleSecuritySubmit}
              disabled={securityBusy}
              activeOpacity={0.8}
            >
              <Text style={styles.securitySubmitText}>
                {securityMode === 'unlock' ? 'আনলক' : 'চালিয়ে যান'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.securityCancel}
              onPress={() => {
                setSecurityVisible(false);
                setPin('');
                setFirstPin('');
                setSecurityError('');
                setPendingNote(null);
              }}
            >
              <Text style={styles.securityCancelText}>বাতিল</Text>
            </TouchableOpacity>
            <Text style={styles.securityFootnote}>
              Note lock অ্যাপের ভেতরে access নিয়ন্ত্রণ করে; database বা backup
              ফাইল encrypt করে না।
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  iconBtn: { padding: 6 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1D',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securitySettingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EFEC',
  },
  addBtn: {
    backgroundColor: '#2F4F4F',
    borderRadius: 12,
    padding: 6,
  },
  noteCard: {
    backgroundColor: '#EAEDED',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  noteCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#E8EFEC',
  },
  listTypeBadge: {
    backgroundColor: '#EEF0F6',
  },
  typeBadgeText: {
    color: '#52756F',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  listTypeBadgeText: {
    color: '#65708F',
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1B1D',
    flex: 1,
    marginRight: 7,
  },
  noteDate: {
    fontSize: 11,
    color: '#3A3A3C',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 15,
    color: '#3A3A3C',
    fontWeight: '600',
  },
  securityOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 29, 27, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  securityCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 22,
    alignItems: 'stretch',
  },
  securityIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E8EFEC',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 13,
  },
  securityTitle: {
    color: '#1B1B1D',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  securityDescription: {
    color: '#718181',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  pinInput: {
    height: 54,
    borderWidth: 1,
    borderColor: '#DCE5E1',
    borderRadius: 15,
    backgroundColor: '#F8FAF9',
    color: '#263330',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 7,
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  securityError: {
    color: '#A14F4F',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 9,
  },
  securitySubmit: {
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F4F4F',
    borderRadius: 15,
    marginTop: 15,
  },
  securitySubmitDisabled: {
    opacity: 0.6,
  },
  securitySubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  securityCancel: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 2,
  },
  securityCancelText: {
    color: '#718181',
    fontSize: 13,
    fontWeight: '700',
  },
  securityFootnote: {
    color: '#9AA5A1',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 2,
  },
});
