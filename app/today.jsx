import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import EditDeleteModal from '../components/EditDeleteModal';
import SummaryList from '../components/SummaryList';
import { useData } from '../context/DataContext';
import formatBDDate from '../utils/BDDateTime';
import { safeISODate } from '../utils/safeDate';

export default function Today() {
  const { expenses, incomes } = useData();
  const router = useRouter();
  const todayISO = new Date().toISOString().split('T')[0];

  const [selectedItem, setSelectedItem] = useState(null);
  const [showOptionModal, setShowOptionModal] = useState(false);

  const combinedData = [
    ...incomes.map((i) => ({ ...i, type: 'income' })),
    ...expenses.map((e) => ({ ...e, type: 'expense' })),
  ];

  const filteredData = combinedData.filter(
    (item) => safeISODate(item.date) === todayISO,
  );

  const totalSell = filteredData
    .filter((i) => i.type === 'income')
    .reduce((sum, i) => sum + Number(i.selAmount), 0);

  const totalIncome = filteredData
    .filter((i) => i.type === 'income')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalExpense = filteredData
    .filter((i) => i.type === 'expense')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalProducts = filteredData.filter(
    (item) => item.type === 'income',
  ).length;
  const profitPercent =
    totalSell === 0 ? 0 : Math.round((totalIncome / totalSell) * 100);
  const expensePercent =
    totalIncome === 0 ? 0 : Math.round((totalExpense / totalIncome) * 100);
  const balancePercent =
    totalIncome === 0
      ? 0
      : Math.round(((totalIncome - totalExpense) / totalIncome) * 100);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.itemCard,
        item.type === 'income' ? styles.incomeCard : styles.expenseCard,
      ]}
      onPress={() => {
        setSelectedItem(item);
        setShowOptionModal(true);
      }}
    >
      <Text style={styles.itemText}>{formatBDDate(item.date)}</Text>
      <Text
        style={[
          styles.itemText,
          item.type === 'income' ? styles.incomeText : styles.expenseText,
        ]}
      >
        {item.type === 'income' ? `৳${item.selAmount}` : 'ব্যয়'}
      </Text>
      <Text style={styles.itemText}>{item.reason}</Text>
      <Text
        style={[
          styles.itemText,
          item.type === 'income' ? styles.incomeText : styles.expenseText,
        ]}
      >
        {item.type === 'income' ? `৳${item.amount}` : `-৳${item.amount}`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ backgroundColor: '#ffffff', height: '100%' }}>
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            <View style={styles.summaryContainer}>
              <View style={styles.titleBox}>
                <Text style={styles.titleLabel}>আজকের মোট পণ্য</Text>
                <Text style={styles.summaryTitle}>{totalProducts}টি</Text>
                <View style={styles.percentRow}>
                  <Text style={styles.percentLabel}>লাভ</Text>
                  <Text style={styles.profitPercent}>{profitPercent}%</Text>
                </View>
                <View style={styles.percentRow}>
                  <Text style={styles.percentLabel}>খরচ</Text>
                  <Text style={styles.expensePercent}>{expensePercent}%</Text>
                </View>
                <View style={styles.percentRow}>
                  <Text style={styles.percentLabel}>ব্যালেন্স</Text>
                  <Text
                    style={[
                      styles.balancePercent,
                      balancePercent < 0 && styles.negativeBalancePercent,
                    ]}
                  >
                    {balancePercent}%
                  </Text>
                </View>
              </View>
              <View style={styles.summaryBoxes}>
                <SummaryList
                  totalExpense={totalExpense}
                  totalIncome={totalIncome}
                  totalSell={totalSell}
                />
              </View>
            </View>
          </>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />

      {showOptionModal && (
        <EditDeleteModal
          item={selectedItem}
          onClose={() => setShowOptionModal(false)}
          onEdit={() => {
            setShowOptionModal(false);
            setShowEditForm(true);
          }}
        />
      )}
      {/* <TouchableOpacity
        style={styles.homeButton}
        onPress={() => router.push('/')}
      >
        <FontAwesome name='home' size={24} color='white' />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryContainer: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  titleBox: {
    flex: 1.15,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    boxShadow: '-2px 5px 20px 1px rgba(27, 27, 29, 0.125)',
  },
  titleLabel: {
    color: '#6c7575',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryTitle: {
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2F4F4F',
  },
  percentRow: {
    alignItems: 'center',
    borderTopColor: '#E4E9E7',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 7,
    marginTop: 5,
  },
  percentLabel: {
    color: '#6c7575',
    fontSize: 12,
    fontWeight: '600',
  },
  profitPercent: {
    color: '#2F4F4F',
    fontSize: 14,
    fontWeight: '800',
  },
  expensePercent: {
    color: '#a10217',
    fontSize: 14,
    fontWeight: '800',
  },
  balancePercent: {
    color: '#2F4F4F',
    fontSize: 14,
    fontWeight: '800',
  },
  negativeBalancePercent: {
    color: '#a10217',
  },
  summaryBoxes: {
    flex: 1.85,
  },

  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  incomeCard: { backgroundColor: '#edf4f4' },
  expenseCard: { backgroundColor: '#f2e5e5' },
  itemText: { flex: 1, textAlign: 'center' },
  incomeText: { color: '#2F4F4F', fontWeight: 'bold' },
  expenseText: { color: '#1B1B1D', fontWeight: 'bold' },
  // homeButton: {
  //   position: 'absolute',
  //   bottom: 100,
  //   right: 20,
  //   backgroundColor: '#2F4F4F',
  //   padding: 16,
  //   borderRadius: 50,
  // },
});
