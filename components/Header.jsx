import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useData } from '../context/DataContext';

export default function Header({ onMenu }) {
  const { expenses, incomes } = useData();

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

  const balance = totalIncome - totalExpense;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Hamburger */}
        <TouchableOpacity onPress={onMenu}>
          <MaterialCommunityIcons name='menu' size={28} color='#1B1B1D' />
        </TouchableOpacity>

        <View style={styles.balance}>
          <MaterialCommunityIcons
            name='currency-bdt'
            size={18}
            color='#EAEDED'
          />
          <Text style={styles.balanceText}>{balance}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 50,
    marginBottom: 20,
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: '#EAEDED',
    // boxShadow: '0 8px 24px rgba(27, 27, 29, 0.08)',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2F4F4F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  balanceText: {
    color: '#EAEDED',
    fontWeight: 'bold',
  },
});
