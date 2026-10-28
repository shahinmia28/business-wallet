import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { getMemoById, getShopProfile, updateMemo } from '../../database/db';
import useKeyboardHeight from '../../hooks/useKeyboardHeight';
import { shareCashMemoPdf } from '../../utils/cashMemoPdf';
import { pickPhoneFromContacts } from '../../utils/contactPicker';

const emptyItem = () => ({
  id: `${Date.now()}-${Math.random()}`,
  name: '',
  price: '',
  quantity: '',
});

const numberFrom = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};

const money = (value) =>
  `৳ ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export default function MemoDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const keyboardHeight = useKeyboardHeight();
  const [memo, setMemo] = useState(null);
  const [items, setItems] = useState([emptyItem()]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [discountValue, setDiscountValue] = useState('0');
  const [discountType, setDiscountType] = useState('fixed');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showPaperPicker, setShowPaperPicker] = useState(false);
  const nameRefs = useRef({});
  const priceRefs = useRef({});
  const quantityRefs = useRef({});
  const handleBackRef = useRef(null);
  const saveMemoRef = useRef(null);
  const saveTimerRef = useRef(null);
  const initializedAutoSave = useRef(false);

  useEffect(() => {
    let active = true;
    const loadMemo = async () => {
      try {
        const loaded = await getMemoById(Number(id));
        if (!active) return;
        if (loaded) {
          setMemo(loaded);
          setCustomerName(loaded.customerName || '');
          setPhone(loaded.phone || '');
          setAddress(loaded.address || '');
          setDate(new Date(loaded.date));
          setItems(
            loaded.items.length
              ? [
                  ...loaded.items.map((item) => ({
                    ...item,
                    id: item.id || emptyItem().id,
                  })),
                  emptyItem(),
                ]
              : [emptyItem()],
          );
          setDiscountValue(String(loaded.discountValue || 0));
          setDiscountType(
            loaded.discountType === 'percent' ? 'percent' : 'fixed',
          );
        }
      } catch (error) {
        console.error('Cash memo load failed', error);
        Toast.show({ type: 'error', text1: 'মেমো খোলা যায়নি' });
      } finally {
        if (active) setLoading(false);
      }
    };
    loadMemo();
    return () => {
      active = false;
    };
  }, [id]);

  const normalizedItems = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.name.trim() || item.price !== '' || item.quantity !== '',
        )
        .map((item) => ({
          name: item.name.trim(),
          price: numberFrom(item.price),
          quantity: numberFrom(item.quantity),
        })),
    [items],
  );
  const subtotal = normalizedItems.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );
  const parsedDiscount = numberFrom(discountValue);
  const discountAmount =
    discountType === 'percent'
      ? Math.floor(
          (subtotal *
            Math.min(
              100,
              Math.max(0, Number.isFinite(parsedDiscount) ? parsedDiscount : 0),
            )) /
            100,
        )
      : Number.isFinite(parsedDiscount)
        ? Math.min(subtotal, Math.max(0, parsedDiscount))
        : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const updateItem = (itemId, key, value) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, [key]: value } : item,
      ),
    );
  };

  const addItem = (focus = true) => {
    const item = emptyItem();
    setItems((current) => [...current, item]);
    if (focus) setTimeout(() => nameRefs.current[item.id]?.focus(), 80);
  };

  const saveMemo = useCallback(async () => {
    const value = numberFrom(discountValue);
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      (discountType === 'percent' && value > 100)
    ) {
      throw new Error(
        'ডিসকাউন্ট শূন্য বা তার বেশি দিন; শতাংশ সর্বোচ্চ ১০০ হতে পারে।',
      );
    }
    for (const item of normalizedItems) {
      if (
        !Number.isFinite(item.price) ||
        !Number.isFinite(item.quantity) ||
        item.price < 0 ||
        item.quantity < 0
      ) {
        throw new Error('পণ্যের দাম ও পরিমাণ সঠিকভাবে লিখুন।');
      }
    }

    const memoData = {
      id: Number(id),
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      note: '',
      date: date.toISOString(),
      items: normalizedItems,
      discountValue: value,
      discountType,
      shopName: memo?.shopName || '',
      shopPhone: memo?.shopPhone || '',
      shopAddress: memo?.shopAddress || '',
      shopDescription: memo?.shopDescription || '',
    };
    await updateMemo(memoData);
    return { ...memoData, items: normalizedItems };
  }, [
    address,
    customerName,
    date,
    discountType,
    discountValue,
    id,
    memo?.shopAddress,
    memo?.shopDescription,
    memo?.shopName,
    memo?.shopPhone,
    normalizedItems,
    phone,
  ]);
  saveMemoRef.current = saveMemo;

  useEffect(() => {
    if (loading || !memo) return undefined;
    if (!initializedAutoSave.current) {
      initializedAutoSave.current = true;
      return undefined;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveMemo();
      } catch (error) {
        console.error('Cash memo auto-save failed', error);
        Toast.show({
          type: 'error',
          text1: 'অটো-সেভ করা যায়নি',
          text2: error.message,
        });
      } finally {
        setSaving(false);
      }
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    address,
    customerName,
    date,
    discountType,
    discountValue,
    items,
    loading,
    memo,
    phone,
    saveMemo,
  ]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (initializedAutoSave.current) {
        saveMemoRef.current?.().catch((error) => {
          console.error('Cash memo save on unmount failed', error);
        });
      }
    },
    [],
  );

  const handleShare = async (paperSize) => {
    setShowPaperPicker(false);
    setSharing(true);
    try {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const saved = await saveMemo();
      const shopProfile = await getShopProfile();
      await shareCashMemoPdf(
        {
          ...saved,
          shopName: shopProfile?.name ?? saved.shopName,
          shopPhone: shopProfile?.phone ?? saved.shopPhone,
          shopAddress: shopProfile?.address ?? saved.shopAddress,
          shopDescription:
            shopProfile?.description ?? saved.shopDescription,
        },
        paperSize,
      );
    } catch (error) {
      console.error('Cash memo PDF generation or share failed', error);
      Alert.alert(
        'PDF তৈরি/শেয়ার করা যায়নি',
        error.message || 'আবার চেষ্টা করুন।',
      );
    } finally {
      setSharing(false);
    }
  };

  const handleSelectContact = async () => {
    const selected = await pickPhoneFromContacts();
    if (!selected) return;

    setCustomerName(selected.name);
    setPhone(selected.phone);
  };

  const handleBack = async () => {
    setSaving(true);
    try {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await saveMemo();
      initializedAutoSave.current = false;
      router.back();
    } catch (error) {
      console.error('Cash memo save on exit failed', error);
      Alert.alert('সংরক্ষণ করা যায়নি', error.message || 'আবার চেষ্টা করুন।', [
        { text: 'থাকুন', style: 'cancel' },
        { text: 'তবু বের হন', onPress: () => router.back() },
      ]);
    } finally {
      setSaving(false);
    }
  };
  handleBackRef.current = handleBack;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!memo) return false;
        handleBackRef.current?.();
        return true;
      },
    );
    return () => subscription.remove();
  }, [memo]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#2F4F4F' />
      </View>
    );
  }

  if (!memo) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>মেমো পাওয়া যায়নি</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>ফিরে যান</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: keyboardHeight ? keyboardHeight + 98 : 38 },
        ]}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='none'
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name='arrow-back' size={23} color='#2F4F4F' />
          </TouchableOpacity>
          <View style={styles.titleArea}>
            <Text style={styles.title}>মেমো সম্পাদনা</Text>
            <Text style={styles.saveStatus}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'অটো-সেভ চালু'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowPaperPicker(true)}
            style={styles.headerAction}
            disabled={sharing}
            accessibilityLabel='PDF শেয়ার বা প্রিন্ট করুন'
          >
            <Ionicons name='share-outline' size={22} color='#2F4F4F' />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>কাস্টমারের তথ্য</Text>
        <View style={styles.customerLine}>
          <TextInput
            style={[styles.input, styles.customerInput]}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder='কাস্টমারের নাম'
            returnKeyType='next'
          />
          <View style={styles.customerPhoneField}>
            <TextInput
              style={[
                styles.input,
                styles.customerInput,
                styles.customerPhoneInput,
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder='ফোন নম্বর'
              keyboardType='phone-pad'
              returnKeyType='next'
            />
            <TouchableOpacity
              style={styles.contactPickerButton}
              onPress={handleSelectContact}
              accessibilityRole='button'
              accessibilityLabel='ফোনের কন্টাক্ট থেকে নাম ও নম্বর বাছাই করুন'
            >
              <Ionicons name='person-add-outline' size={20} color='#2F4F4F' />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.addressDateLine}>
          <TextInput
            style={[styles.input, styles.addressInput]}
            value={address}
            onChangeText={setAddress}
            placeholder='ঠিকানা'
            returnKeyType='done'
          />
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            accessibilityRole='button'
            accessibilityLabel='মেমোর তারিখ নির্বাচন'
          >
            <Ionicons name='calendar-outline' size={17} color='#2F4F4F' />
            <Text style={styles.dateText}>
              {date.toLocaleDateString('en-GB')}
            </Text>
          </TouchableOpacity>
        </View>
        {showDatePicker ? (
          <DateTimePicker
            value={date}
            mode='date'
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedDate) => {
              if (selectedDate) setDate(selectedDate);
              setShowDatePicker(false);
            }}
          />
        ) : null}

        <View style={styles.productsHeading}>
          <Text style={styles.sectionTitle}>পণ্যের তালিকা</Text>
        </View>

        {items.map((item, index) => {
          const itemTotal =
            (numberFrom(item.price) || 0) * (numberFrom(item.quantity) || 0);
          const hasValue =
            item.name || item.price !== '' || item.quantity !== '';
          return (
            <View style={styles.productCard} key={item.id}>
              <View style={styles.productRow}>
                <TextInput
                  ref={(ref) => {
                    nameRefs.current[item.id] = ref;
                  }}
                  style={[styles.input, styles.productNameInput]}
                  value={item.name}
                  onChangeText={(text) => updateItem(item.id, 'name', text)}
                  placeholder='পণ্যের নাম'
                  returnKeyType='next'
                  onSubmitEditing={() => priceRefs.current[item.id]?.focus()}
                />
                <TextInput
                  ref={(ref) => {
                    priceRefs.current[item.id] = ref;
                  }}
                  style={[styles.input, styles.productNumberInput]}
                  value={String(item.price)}
                  onChangeText={(text) => updateItem(item.id, 'price', text)}
                  placeholder='দাম'
                  keyboardType='decimal-pad'
                  returnKeyType='next'
                  onSubmitEditing={() => quantityRefs.current[item.id]?.focus()}
                />
                <TextInput
                  ref={(ref) => {
                    quantityRefs.current[item.id] = ref;
                  }}
                  style={[styles.input, styles.quantityInput]}
                  value={String(item.quantity)}
                  onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                  placeholder='পরিমাণ'
                  keyboardType='decimal-pad'
                  returnKeyType='done'
                  onSubmitEditing={() => hasValue && addItem()}
                />
                {items.length > 1 ? (
                  <TouchableOpacity
                    style={styles.removeItemButton}
                    onPress={() =>
                      setItems((current) =>
                        current.filter((row) => row.id !== item.id),
                      )
                    }
                    accessibilityLabel={`পণ্য ${index + 1} মুছুন`}
                  >
                    <Ionicons
                      name='close-circle-outline'
                      size={21}
                      color='#b42318'
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.lineTotal}>মোট: {money(itemTotal)}</Text>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.addItemButton}
          onPress={() => addItem()}
          accessibilityRole='button'
          accessibilityLabel='নতুন পণ্য যোগ করুন'
        >
          <Ionicons name='add-circle' size={50} color='#2F4F4F' />
        </TouchableOpacity>

        <View style={styles.discountRow}>
          <Text style={styles.label}>ডিসকাউন্ট :</Text>
          <TextInput
            style={[styles.input, styles.discountInput]}
            value={discountValue}
            onChangeText={setDiscountValue}
            placeholder='ডিসকাউন্ট'
            keyboardType='decimal-pad'
          />
          {[
            {
              value: 'percent',
              label: 'শতকরা ডিসকাউন্ট',
              icon: 'percent-outline',
            },
            {
              value: 'fixed',
              label: 'নির্দিষ্ট টাকার ডিসকাউন্ট',
              icon: 'currency-bdt',
            },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.discountIcon,
                discountType === option.value && styles.discountIconActive,
              ]}
              onPress={() => setDiscountType(option.value)}
              accessibilityRole='button'
              accessibilityLabel={option.label}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={21}
                color={discountType === option.value ? '#fff' : '#2F4F4F'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>পণ্যের মোট</Text>
            <Text style={styles.summaryValue}>{money(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              ডিসকাউন্ট
              {discountType === 'percent' ? ` (${discountValue || 0}%)` : ''}
            </Text>
            <Text style={styles.summaryValue}>− {money(discountAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>সর্বমোট</Text>
            <Text style={styles.grandTotal}>{money(total)}</Text>
          </View>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.shareButton, sharing && styles.disabledButton]}
            onPress={() => setShowPaperPicker(true)}
            disabled={sharing}
          >
            <Ionicons name='document-text-outline' size={19} color='#fff' />
            <Text style={styles.actionButtonText}>
              {sharing ? 'PDF তৈরি হচ্ছে...' : 'PDF শেয়ার / প্রিন্ট'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        visible={showPaperPicker}
        transparent
        animationType='fade'
        onRequestClose={() => setShowPaperPicker(false)}
      >
        <View style={styles.paperPickerBackdrop}>
          <View style={styles.paperPicker}>
            <Text style={styles.paperPickerTitle}>প্রিন্টের কাগজ নির্বাচন</Text>
            <Text style={styles.paperPickerDescription}>
              আপনার প্রিন্টারের কাগজের মাপ বেছে নিন
            </Text>
            {[
              { size: 'a4', title: 'A4 — সাধারণ পৃষ্ঠা' },
              { size: '58mm', title: '58mm — পোর্টেবল থার্মাল' },
              { size: '80mm', title: '80mm — থার্মাল রোল' },
            ].map((option) => (
              <TouchableOpacity
                key={option.size}
                style={styles.paperOption}
                onPress={() => handleShare(option.size)}
                disabled={sharing}
              >
                <Text style={styles.paperOptionText}>{option.title}</Text>
                <Ionicons name='chevron-forward' size={19} color='#2F4F4F' />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.paperPickerCancel}
              onPress={() => setShowPaperPicker(false)}
            >
              <Text style={styles.paperPickerCancelText}>বাতিল</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 26,
  },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, padding: 16, paddingBottom: 38 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  notFound: { color: '#475467', fontSize: 16, marginBottom: 14 },
  linkText: { color: '#2F4F4F', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backButton: { width: 42, paddingVertical: 6 },
  titleArea: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: '#1B1B1D' },
  saveStatus: { color: '#667085', fontSize: 11, marginTop: 2 },
  headerAction: { padding: 8 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 12,
  },
  label: {
    color: '#344054',
    fontSize: 17,
    fontWeight: '700',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#d9dfdf',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#1B1B1D',
    fontSize: 15,
    marginBottom: 10,
  },
  customerLine: { flexDirection: 'row', gap: 8 },
  customerInput: { flex: 1, minWidth: 0, paddingHorizontal: 9, fontSize: 13 },
  customerPhoneField: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerPhoneInput: { marginBottom: 10 },
  contactPickerButton: {
    width: 40,
    height: 46,
    borderWidth: 1,
    borderColor: '#d9dfdf',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  addressDateLine: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addressInput: { flex: 1, minWidth: 0, paddingHorizontal: 9, fontSize: 13 },
  dateButton: {
    minHeight: 46,
    width: 118,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#d9dfdf',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 10,
  },
  dateText: { color: '#1B1B1D', fontSize: 12 },
  productsHeading: {
    marginTop: 10,
  },
  addItemButton: {
    alignSelf: 'center',
    padding: 7,
    marginTop: 2,
    marginBottom: 8,
  },

  productCard: {
    backgroundColor: '#f5f7f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 5,
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  productNameInput: { flex: 2.2, paddingHorizontal: 7, fontSize: 13 },
  productNumberInput: {
    flex: 0.9,
    paddingHorizontal: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  quantityInput: {
    flex: 0.8,
    paddingHorizontal: 5,
    fontSize: 13,
    textAlign: 'center',
  },
  removeItemButton: { paddingLeft: 1 },
  lineTotal: {
    color: '#2F4F4F',
    textAlign: 'right',
    fontWeight: '700',
    fontSize: 12,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  discountIcon: {
    width: 60,
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#d9dfdf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountIconActive: { backgroundColor: '#2F4F4F', borderColor: '#2F4F4F' },
  discountInput: { flex: 1, marginBottom: 0 },
  summaryCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f5f7f6',
    marginTop: 2,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: { color: '#475467' },
  summaryValue: { color: '#344054', fontWeight: '600' },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#d9dfdf',
    marginTop: 6,
    paddingTop: 11,
  },
  grandTotalLabel: { color: '#2F4F4F', fontSize: 16, fontWeight: '700' },
  grandTotal: { color: '#2F4F4F', fontSize: 18, fontWeight: '800' },
  bottomActions: { gap: 9 },
  shareButton: {
    minHeight: 49,
    backgroundColor: '#9e8044',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  paperPickerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  paperPicker: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  paperPickerTitle: { color: '#1B1B1D', fontSize: 18, fontWeight: '700' },
  paperPickerDescription: {
    color: '#667085',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 14,
  },
  paperOption: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eaecf0',
  },
  paperOptionText: { color: '#344054', fontSize: 15, fontWeight: '600' },
  paperPickerCancel: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  paperPickerCancelText: { color: '#2F4F4F', fontSize: 14, fontWeight: '700' },
});
