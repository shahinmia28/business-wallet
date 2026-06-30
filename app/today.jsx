import { FontAwesome } from '@expo/vector-icons';
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
    (item) => safeISODate(item.date) === todayISO
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
                <Text style={styles.summaryTitle}>আজকের হিসাব</Text>
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

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => router.push('/')}
      >
        <FontAwesome name='home' size={24} color='white' />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryContainer: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  titleBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    boxShadow: '0 6px 30px #00000022',
    backgroundColor: '#ffffff',
    borderRadius: 22,
  },
  summaryTitle: {
    fontSize: 23,
    fontWeight: 600,
    padding: 10,
    textAlign: 'center',
    color: '#109b8b',
  },
  summaryBoxes: {
    flex: 2,
  },

  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  incomeCard: { backgroundColor: '#dcfce7' },
  expenseCard: { backgroundColor: '#fee2e2' },
  itemText: { flex: 1, textAlign: 'center' },
  incomeText: { color: '#16a34a', fontWeight: 'bold' },
  expenseText: { color: '#b91c1c', fontWeight: 'bold' },
  homeButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});
