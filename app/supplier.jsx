import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { getAllSuppliers, getSupplierSummary } from '../database/db';

export default function SupplierPage() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState({
    totalSupplier: 0,
    totalPurchase: 0,
    totalPayment: 0,
    totalDue: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewerImage, setViewerImage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        getAllSuppliers(),
        getSupplierSummary(),
      ]);
      setSuppliers(list);
      setSummary(sum);
    } catch (e) {
      console.warn('supplier load error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // পেজে ফোকাস আসলে রিলোড (add/edit/delete এর পরে)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)),
  );

  const fmt = (n) =>
    '৳ ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <>
      <View style={styles.wrapper}>
        {/* ===== Header ===== */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name='arrow-back' size={24} color='#1B1B1D' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>সাপ্লায়ার</Text>
          <TouchableOpacity
            onPress={() => router.push('/addsupplier')}
            style={styles.addBtn}
          >
            <Ionicons name='add' size={24} color='#EAEDED' />
          </TouchableOpacity>
        </View>

        {/* ===== Summary Card ===== */}
        <View style={styles.summaryCard}>
          <SummaryItem
            label='মোট সাপ্লায়ার'
            value={summary.totalSupplier}
            icon='people-outline'
            color='#2F4F4F'
            isCount
          />
          <View style={styles.divider} />
          <SummaryItem
            label='মোট ক্রয়'
            value={fmt(summary.totalPurchase)}
            icon='cart-outline'
            color='#3A3A3C'
          />
          <View style={styles.divider} />
          <SummaryItem
            label='মোট পেমেন্ট'
            value={fmt(summary.totalPayment)}
            icon='cash-outline'
            color='#2F4F4F'
          />
          <View style={styles.divider} />
          <SummaryItem
            label='বাকি'
            value={fmt(summary.totalDue)}
            icon='alert-circle-outline'
            color='#3A3A3C'
          />
        </View>

        {/* ===== Search ===== */}
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

        {/* ===== List ===== */}
        {loading ? (
          <ActivityIndicator
            size='large'
            color='#2F4F4F'
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
              {search ? 'কোনো ফলাফল নেই' : 'কোনো সাপ্লায়ার নেই'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => router.push('/addsupplier')}
              >
                <Text style={styles.emptyAddText}>+ সাপ্লায়ার যোগ করুন</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {filtered.map((s) => (
              <View key={s.id} style={styles.card}>
                {/* Avatar */}
                {s.profileImagePath ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setViewerImage(s.profileImagePath)}
                    style={styles.avatar}
                  >
                    <Image
                      source={{ uri: s.profileImagePath }}
                      style={styles.avatarImage}
                      resizeMode='cover'
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {s.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => router.push(`/supplier/${s.id}`)}
                  style={styles.cardBody}
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{s.name}</Text>
                    {s.phone ? (
                      <Text style={styles.cardPhone}>
                        <Ionicons name='call-outline' size={12} color='#888' />{' '}
                        {s.phone}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.cardRight}>
                    <Text
                      style={[
                        styles.dueAmount,
                        { color: s.due > 0 ? '#3A3A3C' : '#2F4F4F' },
                      ]}
                    >
                      {fmt(s.due)}
                    </Text>
                    <Text style={styles.dueLabel}>
                      {s.due > 0 ? 'বাকি' : 'পরিশোধ'}
                    </Text>
                  </View>

                  <Ionicons name='chevron-forward' size={18} color='#ccc' />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ===== Full Screen Image Viewer (wrapper এর বাইরে) ===== */}
      {viewerImage ? (
        <Pressable
          style={styles.viewerOverlay}
          onPress={() => setViewerImage(null)}
        >
          <Image
            source={{ uri: viewerImage }}
            style={{ width: screenWidth, height: screenHeight * 0.8 }}
            resizeMode='contain'
            onError={(e) =>
              console.warn(
                'viewer image error',
                viewerImage,
                e.nativeEvent?.error,
              )
            }
          />

          <TouchableOpacity
            onPress={() => setViewerImage(null)}
            style={styles.viewerHeader}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      ) : null}
    </>
  );
}

function SummaryItem({ label, value, icon, color, isCount }) {
  return (
    <View style={styles.summaryItem}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.summaryValue, { color }]}>
        {isCount ? value : value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 50,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B1B1D' },
  addBtn: {
    backgroundColor: '#2F4F4F',
    borderRadius: 12,
    padding: 6,
  },

  /* Summary */
  summaryCard: {
    backgroundColor: '#EAEDED',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '2px 0 10px 10px rgba(25, 25, 28, 0.089)',
    marginBottom: 14,
    marginHorizontal: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#3A3A3C',
    textAlign: 'center',
  },
  divider: {
    width: 1.5,
    height: 40,
    backgroundColor: '#D7DCDC',
  },

  /* Search */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEDED',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    boxShadow: '2px 0 10px 10px rgba(25, 25, 28, 0.089)',
    marginBottom: 14,
    marginHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1B1B1D',
  },

  /* Empty */
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#3A3A3C',
  },
  emptyAddBtn: {
    backgroundColor: '#2F4F4F',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  emptyAddText: {
    color: '#EAEDED',
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Supplier Card */
  card: {
    backgroundColor: '#d6dfdf',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
    marginHorizontal: 16,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D7DCDC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1D',
  },

  /* Image Viewer */
  viewerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 27, 29, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
  },
  viewerHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  closeText: {
    color: '#EAEDED',
    fontWeight: '700',
    fontSize: 16,
  },

  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1B1D',
  },
  cardPhone: {
    fontSize: 12,
    color: '#3A3A3C',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dueAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dueLabel: {
    fontSize: 10,
    color: '#3A3A3C',
  },
});
