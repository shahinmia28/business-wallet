import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useData } from '../context/DataContext';
import SummaryList from './SummaryList';

export default function Summary() {
  const { expenses, incomes } = useData();
  const router = useRouter();

  // 🆕 আজকের তারিখ
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();

  // 🆕 Current Month Expenses
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date); // e.date অবশ্যই valid date string বা timestamp
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // 🆕 Current Month Incomes
  const monthIncomes = incomes.filter((i) => {
    const d = new Date(i.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);
  const totalSell = monthIncomes.reduce((s, i) => s + i.selAmount, 0);
  return (
    <View style={styles.container}>
      {/* Reports Card */}
      <TouchableOpacity
        style={styles.reportCard}
        activeOpacity={0.85}
        onPress={() => router.push('/report')}
      >
        <View style={styles.reportIcon}>
          <MaterialCommunityIcons name='chart-bar' size={32} color='#1B1B1D' />
        </View>
        <Text style={styles.reportText}>Reports</Text>
      </TouchableOpacity>

      {/* Summary Cards */}
      <View style={styles.SummaryBoxes}>
        <SummaryList
          totalExpense={totalExpense}
          totalIncome={totalIncome}
          totalSell={totalSell}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },

  reportCard: {
    flex: 1,
    backgroundColor: '#EAEDED',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',

    // boxShadow: '0 10px 24px rgba(27, 27, 29, 0.08)',
  },

  reportIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAEDED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  reportText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1D',
  },
  SummaryBoxes: {
    flex: 2,
  },
});
