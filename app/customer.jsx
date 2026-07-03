import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAllCustomers, getCustomerSummary } from '../database/db';

export default function CustomerPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalCustomer: 0,
    totalSale: 0,
    totalPayment: 0,
    totalDue: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        getAllCustomers(),
        getCustomerSummary(),
      ]);
      setCustomers(list);
      setSummary(sum);
    } catch (e) {
      console.warn('customer load error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)),
  );

  const fmt = (n) =>
    '৳ ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='arrow-back' size={24} color='#11181C' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>কাস্টমার</Text>
        <TouchableOpacity
          onPress={() => router.push('/addcustomer')}
          style={styles.addBtn}
        >
          <Ionicons name='add' size={24} color='#fff' />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <SummaryItem
          label='মোট কাস্টমার'
          value={summary.totalCustomer}
          icon='people-outline'
          color='#008080ac'
          isCount
        />
        <View style={styles.divider} />
        <SummaryItem
          label='মোট বিক্রয়'
          value={fmt(summary.totalSale)}
          icon='trending-up-outline'
          color='#14b8a6'
        />
        <View style={styles.divider} />
        <SummaryItem
          label='আদায়'
          value={fmt(summary.totalPayment)}
          icon='cash-outline'
          color='#6366f1'
        />
        <View style={styles.divider} />
        <SummaryItem
          label='বাকি'
          value={fmt(summary.totalDue)}
          icon='alert-circle-outline'
          color='#f59e0b'
        />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name='search-outline' size={18} color='#888' />
        <TextInput
          style={styles.searchInput}
          placeholder='নাম বা ফোন দিয়ে খুঁজুন...'
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name='close-circle' size={18} color='#888' />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator
          size='large'
          color='#008080ac'
          style={{ marginTop: 40 }}
        />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons
            name='account-off-outline'
            size={54}
            color='#ccc'
          />
          <Text style={styles.emptyText}>
            {search ? 'কোনো ফলাফল নেই' : 'কোনো কাস্টমার নেই'}
          </Text>
          {!search && (
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => router.push('/addcustomer')}
            >
              <Text style={styles.emptyAddText}>+ কাস্টমার যোগ করুন</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {filtered.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.card}
              onPress={() => router.push(`/customer/${c.id}`)}
              activeOpacity={0.75}
            >
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {c.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{c.name}</Text>
                {c.phone ? (
                  <Text style={styles.cardPhone}>
                    <Ionicons name='call-outline' size={12} color='#888' />{' '}
                    {c.phone}
                  </Text>
                ) : null}
              </View>

              {/* Due */}
              <View style={styles.cardRight}>
                <Text
                  style={[
                    styles.dueAmount,
                    { color: c.due > 0 ? '#f59e0b' : '#14b8a6' },
                  ]}
                >
                  {fmt(c.due)}
                </Text>
                <Text style={styles.dueLabel}>
                  {c.due > 0 ? 'বাকি' : 'পরিশোধ'}
                </Text>
              </View>

              <Ionicons name='chevron-forward' size={18} color='#ccc' />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function SummaryItem({ label, value, icon, color, isCount }) {
  return (
    <View style={styles.summaryItem}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
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
    marginBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#11181C' },
  addBtn: {
    backgroundColor: '#008080ac',
    borderRadius: 12,
    padding: 6,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 6px 30px #00000022',
    marginBottom: 14,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 13, fontWeight: 'bold' },
  summaryLabel: { fontSize: 10, color: '#888', textAlign: 'center' },
  divider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    boxShadow: '0 2px 10px #00000015',
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#11181C' },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#aaa' },
  emptyAddBtn: {
    backgroundColor: '#008080ac',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  emptyAddText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
    boxShadow: '0 4px 20px #00000015',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#6366f1' },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#11181C' },
  cardPhone: { fontSize: 12, color: '#888' },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  dueAmount: { fontSize: 14, fontWeight: 'bold' },
  dueLabel: { fontSize: 10, color: '#aaa' },
});
