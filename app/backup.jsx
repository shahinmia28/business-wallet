import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { restoreBackup, shareBackup } from '../utils/backup';

export default function BackupPage() {
  const router = useRouter();
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);

  /* ── Backup ── */
  const handleBackup = async () => {
    setBacking(true);
    try {
      await shareBackup();
      Toast.show({ type: 'success', text1: 'Backup শেয়ার হয়েছে ✅' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Backup ব্যর্থ', text2: e.message });
    } finally {
      setBacking(false);
    }
  };

  /* ── Restore ── */
  const handleRestore = async () => {
    Alert.alert(
      'Restore করবেন?',
      'Backup ফাইল থেকে ডেটা যোগ হবে। বিদ্যমান ডেটা থাকবে।',
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'হ্যাঁ, Restore করুন',
          onPress: async () => {
            setRestoring(true);
            try {
              const result = await restoreBackup();
              if (result.canceled) return;

              const s = result.stats;
              const msg = [
                s.expenses && `ব্যয়: ${s.expenses}`,
                s.incomes && `আয়: ${s.incomes}`,
                s.suppliers && `সাপ্লায়ার: ${s.suppliers}`,
                s.supplierTx && `সাপ্লায়ার লেনদেন: ${s.supplierTx}`,
                s.customers && `কাস্টমার: ${s.customers}`,
                s.customerTx && `কাস্টমার লেনদেন: ${s.customerTx}`,
                s.notes && `নোট: ${s.notes}`,
              ]
                .filter(Boolean)
                .join(', ');

              Toast.show({
                type: 'success',
                text1: 'Restore সম্পন্ন ✅',
                text2: msg || 'নতুন কোনো ডেটা ছিল না',
              });
            } catch (e) {
              Toast.show({
                type: 'error',
                text1: 'Restore ব্যর্থ',
                text2: e.message,
              });
            } finally {
              setRestoring(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name='arrow-back' size={22} color='#1B1B1D' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Backup & Restore</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Backup Card */}
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <MaterialCommunityIcons
              name='cloud-upload-outline'
              size={32}
              color='#2F4F4F'
            />
          </View>
          <Text style={styles.cardTitle}>ডেটা Backup করুন</Text>
          <Text style={styles.cardDesc}>
            সব ডেটা একটি JSON ফাইলে সংরক্ষণ হবে।{'\n'}
            ফাইলের নামে তারিখ থাকবে।{'\n'}
            WhatsApp, Google Drive বা যেকোনো জায়গায় রাখুন।
          </Text>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, backing && { opacity: 0.6 }]}
            onPress={handleBackup}
            disabled={backing}
          >
            <Ionicons name='share-outline' size={20} color='#fff' />
            <Text style={styles.btnText}>
              {backing ? 'তৈরি হচ্ছে...' : 'Backup ও Share করুন'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Restore Card */}
        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: '#D7DCDC' }]}>
            <MaterialCommunityIcons
              name='cloud-download-outline'
              size={32}
              color='#3A3A3C'
            />
          </View>
          <Text style={styles.cardTitle}>ডেটা Restore করুন</Text>
          <Text style={styles.cardDesc}>
            আগের Backup ফাইল (.json) বেছে নিন।{'\n'}
            বিদ্যমান ডেটা থাকবে, নতুন ডেটা যোগ হবে।{'\n'}
            Duplicate ডেটা skip হবে।{'\n'}
            Restore এর পর app reload করুন
          </Text>

          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnWarning,
              restoring && { opacity: 0.6 },
            ]}
            onPress={handleRestore}
            disabled={restoring}
          >
            <Ionicons name='folder-open-outline' size={20} color='#fff' />
            <Text style={styles.btnText}>
              {restoring ? 'Restore হচ্ছে...' : 'ফাইল বেছে Restore করুন'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 পরামর্শ</Text>
          {[
            'প্রতি সপ্তাহে অন্তত একবার Backup নিন',
            'Google Drive এ একটি folder বানান "BW Backup"',
            'পুরনো backup ফাইলগুলো রাখুন — নামে তারিখ আছে',
            'নতুন ফোনে বা reinstall এর পরে Restore করুন',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipDot}>›</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#EAEDED' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 50,
    marginBottom: 16,
  },
  iconBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1D' },

  card: {
    backgroundColor: '#EAEDED',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
    boxShadow: '0 8px 20px rgba(27, 27, 29, 0.08)',
    borderWidth: 1,
    borderColor: '#D7DCDC',
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D7DCDC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1B1D',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#3A3A3C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: '#2F4F4F' },
  btnWarning: { backgroundColor: '#3A3A3C' },
  btnText: { color: '#EAEDED', fontWeight: '700', fontSize: 15 },

  tipsCard: {
    backgroundColor: '#EAEDED',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    boxShadow: '0 8px 20px rgba(27, 27, 29, 0.08)',
    borderWidth: 1,
    borderColor: '#D7DCDC',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1D',
    marginBottom: 12,
  },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipDot: { color: '#2F4F4F', fontWeight: '700', fontSize: 16, marginTop: -1 },
  tipText: { fontSize: 13, color: '#3A3A3C', flex: 1, lineHeight: 19 },
});
