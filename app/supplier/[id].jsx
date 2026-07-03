import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  deleteSupplier,
  deleteSupplierTransaction,
  getSupplierById,
  getSupplierTransactions,
  insertSupplierTransaction,
  updateSupplier,
  updateSupplierTransaction,
} from '../../database/db';
import BDDateTime from '../../utils/BDDateTime';
import {
  generateStatement,
  shareStatement,
} from '../../utils/generateStatement';

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function SupplierDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [supplier, setSupplier] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [txModal, setTxModal] = useState(false);
  const [editTx, setEditTx] = useState(null); // null = add, obj = edit
  const [editSupplierModal, setEditSupplierModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, txs] = await Promise.all([
        getSupplierById(Number(id)),
        getSupplierTransactions(Number(id)),
      ]);
      setSupplier(s);
      setTransactions(txs);
    } catch (e) {
      console.warn('load error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id]),
  );

  const handleCall = async (phone) => {
    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      await Linking.openURL(`tel:${cleanPhone}`);
    } catch (err) {
      Alert.alert('Error', 'Could not open phone dialer');
      console.log(err);
    }
  };

  const fmt = (n) =>
    '৳ ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const handleStatement = async () => {
    setGenerating(true);
    try {
      const pdfUri = await generateStatement({
        type: 'supplier',
        entity: supplier,
        transactions,
      });
      await shareStatement(pdfUri);
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'স্টেটমেন্ট তৈরি হয়নি',
        text2: e.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSupplier = () => {
    Alert.alert(
      'সাপ্লায়ার মুছবেন?',
      `"${supplier?.name}" এবং তার সব লেনদেন মুছে যাবে।`,
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'মুছুন',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSupplier(Number(id));
              Toast.show({ type: 'success', text1: 'সাপ্লায়ার মুছে গেছে' });
              router.back();
            } catch (e) {
              Toast.show({ type: 'error', text1: e.message });
            }
          },
        },
      ],
    );
  };

  const handleDeleteTx = (tx) => {
    Alert.alert('লেনদেন মুছবেন?', 'এই লেনদেন স্থায়ীভাবে মুছে যাবে।', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'মুছুন',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSupplierTransaction(tx.id);
            Toast.show({ type: 'success', text1: 'লেনদেন মুছে গেছে' });
            loadData();
          } catch (e) {
            Toast.show({ type: 'error', text1: e.message });
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#008080ac' />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#888' }}>সাপ্লায়ার পাওয়া যায়নি</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='arrow-back' size={24} color='#11181C' />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {supplier.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setEditSupplierModal(true)}
            style={styles.iconBtn}
          >
            <Ionicons name='create-outline' size={22} color='#008080' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleStatement}
            style={[styles.iconBtn, generating && { opacity: 0.5 }]}
            disabled={generating}
          >
            <Ionicons name='share-outline' size={22} color='#6366f1' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteSupplier}
            style={styles.iconBtn}
          >
            <Ionicons name='trash-outline' size={22} color='#ef4444' />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Info Card ── */}
        <View style={styles.infoCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {supplier.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.infoRows}>
            {supplier.phone ? (
              <Pressable
                onPress={() => handleCall(supplier.phone)}
                android_ripple={{ color: '#DCFCE7' }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F0FDF4',
                  borderWidth: 1,
                  borderColor: '#86EFAC',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 10,
                }}
              >
                <InfoRow icon='call-outline' text={supplier.phone} />
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#22C55E',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Ionicons name='call' size={16} color='#fff' />
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: '700',
                      marginLeft: 5,
                      fontSize: 13,
                    }}
                  >
                    Call
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {supplier.name ? (
              <InfoRow icon='person-outline' text={supplier.name} />
            ) : null}
            {supplier.address ? (
              <InfoRow icon='location-outline' text={supplier.address} />
            ) : null}
            {supplier.note ? (
              <InfoRow icon='document-text-outline' text={supplier.note} />
            ) : null}
          </View>
        </View>

        {/* ── Summary Bar ── */}
        <View style={styles.summaryCard}>
          <SumItem
            label='মোট ক্রয়'
            value={fmt(supplier.totalPurchase)}
            color='#ef4444'
          />
          <View style={styles.sumDivider} />
          <SumItem
            label='পেমেন্ট'
            value={fmt(supplier.totalPayment)}
            color='#14b8a6'
          />
          <View style={styles.sumDivider} />
          <SumItem
            label='বাকি'
            value={fmt(supplier.due)}
            color={supplier.due > 0 ? '#f59e0b' : '#14b8a6'}
          />
        </View>

        {/* ── Transactions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>লেনদেনের ইতিহাস</Text>
          <Text style={styles.sectionCount}>{transactions.length} টি</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name='clipboard-text-off-outline'
              size={48}
              color='#ccc'
            />
            <Text style={styles.emptyText}>কোনো লেনদেন নেই</Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <TxCard
              key={tx.id}
              tx={tx}
              onEdit={() => {
                setEditTx(tx);
                setTxModal(true);
              }}
              onDelete={() => handleDeleteTx(tx)}
            />
          ))
        )}
      </ScrollView>

      {/* ── FAB: Add Transaction ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditTx(null);
          setTxModal(true);
        }}
      >
        <Ionicons name='add' size={28} color='#fff' />
      </TouchableOpacity>

      {/* ── Transaction Modal ── */}
      <TxModal
        visible={txModal}
        supplierId={Number(id)}
        editData={editTx}
        onClose={() => {
          setTxModal(false);
          setEditTx(null);
        }}
        onSaved={() => {
          setTxModal(false);
          setEditTx(null);
          loadData();
        }}
      />

      {/* ── Edit Supplier Modal ── */}
      <EditSupplierModal
        visible={editSupplierModal}
        supplier={supplier}
        onClose={() => setEditSupplierModal(false)}
        onSaved={() => {
          setEditSupplierModal(false);
          loadData();
        }}
      />
    </View>
  );
}

/* ═══════════════════════════════════════════════
   TX CARD
═══════════════════════════════════════════════ */
function TxCard({ tx, onEdit, onDelete }) {
  const fmt = (n) =>
    '৳ ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <View style={styles.txCard}>
      {/* Date + Invoice */}
      <View style={styles.txTop}>
        <Text style={styles.txDate}>{BDDateTime(tx.date)}</Text>
        {tx.invoiceNo ? (
          <Text style={styles.txInvoice}>#{tx.invoiceNo}</Text>
        ) : null}
        <View style={styles.txActions}>
          <TouchableOpacity onPress={onEdit} style={styles.txBtn}>
            <Ionicons name='create-outline' size={16} color='#008080' />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.txBtn}>
            <Ionicons name='trash-outline' size={16} color='#ef4444' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Amounts */}
      <View style={styles.txAmounts}>
        {tx.purchase > 0 && (
          <View style={styles.txChip}>
            <Text style={styles.txChipLabel}>ক্রয়</Text>
            <Text style={[styles.txChipValue, { color: '#ef4444' }]}>
              {fmt(tx.purchase)}
            </Text>
          </View>
        )}
        {tx.payment > 0 && (
          <View style={styles.txChip}>
            <Text style={styles.txChipLabel}>পেমেন্ট</Text>
            <Text style={[styles.txChipValue, { color: '#14b8a6' }]}>
              {fmt(tx.payment)}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      {tx.description ? (
        <Text style={styles.txDesc}>{tx.description}</Text>
      ) : null}
    </View>
  );
}

/* ═══════════════════════════════════════════════
   TRANSACTION MODAL (Add / Edit)
═══════════════════════════════════════════════ */
function TxModal({ visible, supplierId, editData, onClose, onSaved }) {
  const isEdit = !!editData;

  const [purchase, setPurchase] = useState('');
  const [payment, setPayment] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit ডেটা লোড
  const onShow = () => {
    if (isEdit) {
      setPurchase(editData.purchase > 0 ? String(editData.purchase) : '');
      setPayment(editData.payment > 0 ? String(editData.payment) : '');
      setDescription(editData.description || '');
      setInvoiceNo(editData.invoiceNo || '');
      setSelectedDate(editData.date ? new Date(editData.date) : new Date());
    } else {
      setPurchase('');
      setPayment('');
      setDescription('');
      setInvoiceNo('');
      setSelectedDate(new Date());
    }
  };

  const handleSave = async () => {
    const p = parseFloat(purchase) || 0;
    const py = parseFloat(payment) || 0;

    if (p === 0 && py === 0) {
      Toast.show({
        type: 'error',
        text1: 'ক্রয় অথবা পেমেন্ট দিন',
      });
      return;
    }
    if (!selectedDate) {
      Toast.show({ type: 'error', text1: 'তারিখ দিন' });
      return;
    }
    const date = dayjs(selectedDate).format('YYYY-MM-DD');

    setSaving(true);
    try {
      if (isEdit) {
        await updateSupplierTransaction({
          id: editData.id,
          purchase: p,
          payment: py,
          description,
          invoiceNo,
          date,
        });
        Toast.show({ type: 'success', text1: 'আপডেট হয়েছে' });
      } else {
        await insertSupplierTransaction({
          supplierId,
          purchase: p,
          payment: py,
          description,
          invoiceNo,
          date,
          createdAt: dayjs().toISOString(),
        });
        Toast.show({ type: 'success', text1: 'লেনদেন যোগ হয়েছে' });
      }
      onSaved();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onShow={onShow}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Buttons */}
            <View style={styles.modalBtns}>
              <Text style={styles.modalTitle}>
                {isEdit ? 'Edit Transaction' : 'New Transaction'}
              </Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
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
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowPicker(true)}
            >
              <Text style={{ color: '#5f5f5f' }}>
                {BDDateTime(selectedDate)}
              </Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={selectedDate}
                mode='date'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (date) setSelectedDate(date);
                  if (Platform.OS === 'android') setShowPicker(false);
                }}
              />
            )}

            <Text style={styles.modalLabel}>ক্রয় (টাকা)</Text>
            <TextInput
              style={styles.modalInput}
              value={purchase}
              onChangeText={setPurchase}
              placeholder='0'
              keyboardType='numeric'
            />

            <Text style={styles.modalLabel}>পেমেন্ট (টাকা)</Text>
            <TextInput
              style={styles.modalInput}
              value={payment}
              onChangeText={setPayment}
              placeholder='0'
              keyboardType='numeric'
            />

            <Text style={styles.modalLabel}>ইনভয়েস নং</Text>
            <TextInput
              style={styles.modalInput}
              value={invoiceNo}
              onChangeText={setInvoiceNo}
              placeholder='INV-001 (ঐচ্ছিক)'
            />

            <Text style={styles.modalLabel}>বিবরণ</Text>
            <TextInput
              style={[
                styles.modalInput,
                { minHeight: 70, textAlignVertical: 'top' },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder='বিবরণ (ঐচ্ছিক)'
              multiline
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════
   EDIT SUPPLIER MODAL
═══════════════════════════════════════════════ */
function EditSupplierModal({ visible, supplier, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const onShow = () => {
    setName(supplier?.name || '');
    setPhone(supplier?.phone || '');
    setAddress(supplier?.address || '');
    setNote(supplier?.note || '');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'নাম দিন' });
      return;
    }
    setSaving(true);
    try {
      await updateSupplier({
        id: supplier.id,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        note: note.trim(),
      });
      Toast.show({ type: 'success', text1: 'আপডেট হয়েছে' });
      onSaved();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onShow={onShow}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalBtns}>
            <Text style={styles.modalTitle}>Edit Supplier</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
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
          <Text style={styles.modalLabel}>নাম *</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder='সাপ্লায়ারের নাম'
          />

          <Text style={styles.modalLabel}>ফোন</Text>
          <TextInput
            style={styles.modalInput}
            value={phone}
            onChangeText={setPhone}
            placeholder='01XXXXXXXXX'
            keyboardType='phone-pad'
          />

          <Text style={styles.modalLabel}>ঠিকানা</Text>
          <TextInput
            style={styles.modalInput}
            value={address}
            onChangeText={setAddress}
            placeholder='ঠিকানা'
          />

          <Text style={styles.modalLabel}>নোট</Text>
          <TextInput
            style={[
              styles.modalInput,
              { minHeight: 60, textAlignVertical: 'top' },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder='নোট (ঐচ্ছিক)'
            multiline
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════
   SMALL HELPERS
═══════════════════════════════════════════════ */
function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color='#888' />
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
}

function SumItem({ label, value, color }) {
  return (
    <View style={styles.sumItem}>
      <Text style={[styles.sumValue, { color }]}>{value}</Text>
      <Text style={styles.sumLabel}>{label}</Text>
    </View>
  );
}

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f4f6f8', paddingHorizontal: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 50,
    marginBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#11181C',
    marginHorizontal: 8,
  },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 6, borderRadius: 10, backgroundColor: '#f4f6f8' },

  /* Info Card */
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    boxShadow: '0 6px 30px #00000022',
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: { fontSize: 26, fontWeight: 'bold', color: '#008080' },
  infoRows: { width: '100%', gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoRowText: { fontSize: 14, color: '#444' },

  /* Summary */
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px #00000015',
    marginBottom: 16,
  },
  sumItem: { flex: 1, alignItems: 'center', gap: 3 },
  sumValue: { fontSize: 14, fontWeight: 'bold' },
  sumLabel: { fontSize: 10, color: '#888' },
  sumDivider: { width: 1, backgroundColor: '#e5e7eb' },

  /* Section */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#11181C' },
  sectionCount: { fontSize: 12, color: '#888' },

  /* Empty */
  emptyBox: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: '#aaa' },

  /* Transaction Card */
  txCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    boxShadow: '0 4px 16px #00000012',
    gap: 8,
  },
  txTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txDate: { fontSize: 12, color: '#555', fontWeight: '600' },
  txInvoice: {
    fontSize: 11,
    color: '#008080',
    backgroundColor: '#e0f2f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txActions: { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  txBtn: { padding: 4 },
  txAmounts: { flexDirection: 'row', gap: 10 },
  txChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f4f6f8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  txChipLabel: { fontSize: 11, color: '#888' },
  txChipValue: { fontSize: 13, fontWeight: 'bold' },
  txDesc: { fontSize: 12, color: '#777', fontStyle: 'italic' },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 100,
    right: '47%',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#008080ac',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 20px #00808055',
  },

  /* Modal */
  modalOverlay: { flex: 1, justifyContent: 'flex-start' },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  modalSheet: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '90%',
  },

  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#f4f6f8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#11181C',
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modalTitle: {
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
