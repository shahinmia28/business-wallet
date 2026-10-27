import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { deleteMemoById, getAllMemos } from '../../database/db';

const formatDate = (date) => {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-GB');
};

const memoTotal = (memo) => {
  const subtotal = memo.items.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );
  const discount =
    memo.discountType === 'percent'
      ? Math.floor(
          (subtotal *
            Math.min(100, Math.max(0, Number(memo.discountValue || 0)))) /
            100,
        )
      : Math.min(subtotal, Math.max(0, Number(memo.discountValue || 0)));
  return Math.max(0, subtotal - discount);
};

export default function MemoListPage() {
  const router = useRouter();
  const [memos, setMemos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMemos = useCallback(async () => {
    try {
      setMemos(await getAllMemos());
    } catch (error) {
      console.error('Cash memo load failed', error);
      Toast.show({ type: 'error', text1: 'মেমো লোড করা যায়নি' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMemos();
    }, [loadMemos]),
  );

  const confirmDelete = (memo) => {
    Alert.alert('মেমো মুছবেন?', 'এই মেমোটি স্থায়ীভাবে মুছে যাবে।', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'মুছুন',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMemoById(memo.id);
            await loadMemos();
            Toast.show({ type: 'success', text1: 'মেমো মুছে গেছে' });
          } catch (error) {
            console.error('Cash memo delete failed', error);
            Toast.show({ type: 'error', text1: 'মেমো মুছতে সমস্যা হয়েছে' });
          }
        },
      },
    ]);
  };

  const filteredMemos = memos.filter((memo) => {
    const query = search.trim().toLocaleLowerCase();
    return (
      !query ||
      memo.customerName.toLocaleLowerCase().includes(query) ||
      memo.phone.toLocaleLowerCase().includes(query)
    );
  });

  const renderMemo = ({ item }) => (
    <TouchableOpacity
      style={styles.memoCard}
      activeOpacity={0.75}
      onPress={() => router.push(`/memo/${item.id}`)}
    >
      <View style={styles.memoMain}>
        <Text style={styles.memoNumber}>
          মেমো নং: BW-{String(item.id).padStart(4, '0')}
        </Text>
        <Text style={styles.customerName} numberOfLines={1}>
          {item.customerName || 'নামবিহীন কাস্টমার'}
        </Text>
        <Text style={styles.meta}>
          {item.phone || 'ফোন নম্বর নেই'} · {formatDate(item.date)}
        </Text>
        <Text style={styles.meta}>
          {item.items.length}টি পণ্য
          {item.note ? ` · ${item.note}` : ''}
        </Text>
        <Text style={styles.total}>
          ৳ {memoTotal(item).toLocaleString('en-IN')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(item)}
        accessibilityRole='button'
        accessibilityLabel='মেমো মুছুন'
      >
        <Ionicons name='trash-outline' size={21} color='#b42318' />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name='arrow-back' size={23} color='#2F4F4F' />
        </TouchableOpacity>
        <Text style={styles.title}>ক্যাশ মেমো</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/memo/shop')}
          accessibilityRole='button'
          accessibilityLabel='দোকানের তথ্য সম্পাদনা'
        >
          <Ionicons name='storefront-outline' size={21} color='#2F4F4F' />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/memo/new')}
          accessibilityRole='button'
          accessibilityLabel='নতুন মেমো'
        >
          <Ionicons name='add' size={25} color='#fff' />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name='search' size={19} color='#667085' />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder='নাম বা ফোন নম্বর দিয়ে খুঁজুন'
          placeholderTextColor='#8a9299'
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name='close-circle' size={19} color='#8a9299' />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color='#2F4F4F' />
      ) : (
        <FlatList
          data={filteredMemos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMemo}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps='handled'
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {search ? 'কোনো মেমো পাওয়া যায়নি' : 'এখনো কোনো মেমো তৈরি হয়নি'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 26,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 18,
  },
  backButton: { width: 42, paddingVertical: 6 },
  title: { flex: 1, fontSize: 21, fontWeight: '700', color: '#1B1B1D' },
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F4F4F',
  },
  searchBox: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d9dfdf',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1B1B1D', paddingVertical: 10 },
  listContent: { paddingBottom: 40, flexGrow: 1 },
  memoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7f6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  memoMain: { flex: 1 },
  memoNumber: { color: '#2F4F4F', fontSize: 12, fontWeight: '700', marginBottom: 3 },
  customerName: { color: '#1B1B1D', fontSize: 16, fontWeight: '700' },
  meta: { color: '#667085', fontSize: 13, marginTop: 4 },
  total: { color: '#2F4F4F', fontSize: 15, fontWeight: '700', marginTop: 7 },
  deleteButton: { padding: 10 },
  loader: { marginTop: 40 },
  emptyText: { marginTop: 48, textAlign: 'center', color: '#667085' },
});
