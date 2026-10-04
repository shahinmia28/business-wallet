import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useData } from '../context/DataContext';

export default function Report() {
  const { incomes, expenses } = useData();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  const startOfMonth = selectedMonth.startOf('month').toDate();
  const endOfMonth = selectedMonth.endOf('month').toDate();

  const filterByMonth = (data) =>
    data.filter((i) => {
      const d = new Date(i.date);
      return d >= startOfMonth && d <= endOfMonth;
    });

  /* ================= MONTH DATA ================= */

  const monthlyIncomes = useMemo(
    () => filterByMonth(incomes),
    [incomes, selectedMonth],
  );

  const monthlyExpenses = useMemo(
    () => filterByMonth(expenses),
    [expenses, selectedMonth],
  );

  /* ================= TOTALS ================= */

  const totalSell = monthlyIncomes.reduce(
    (s, i) => s + Number(i.selAmount || 0),
    0,
  );

  const totalProfit = monthlyIncomes.reduce(
    (s, i) => s + Number(i.amount || 0),
    0,
  );

  const totalExpense = monthlyExpenses.reduce(
    (s, i) => s + Number(i.amount || 0),
    0,
  );
  const totalBalance = totalProfit - totalExpense;

  /* ================= PERCENTAGES ================= */

  const profitPercent =
    totalSell === 0 ? 0 : Math.round((totalProfit / totalSell) * 100);

  const expensePercent =
    totalProfit === 0 ? 0 : Math.round((totalExpense / totalProfit) * 100);

  const balancePercent =
    totalProfit === 0 ? 0 : Math.round((totalBalance / totalProfit) * 100);

  /* ================= EXPENSE DETAILS ================= */

  const expenseData = useMemo(
    () => summarize(monthlyExpenses),
    [monthlyExpenses],
  );

  return (
    <ScrollView style={styles.container}>
      {/* ===== TOP BAR ===== */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Feather name='arrow-left' size={22} color='#1B1B1D' />
        </TouchableOpacity>

        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={{
              padding: 10,
              borderRadius: 20,
            }}
            onPress={() => setSelectedMonth(selectedMonth.subtract(1, 'month'))}
          >
            <Feather name='chevron-left' size={25} color='#1B1B1D' />
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {selectedMonth.format('MMMM YYYY')}
          </Text>

          <TouchableOpacity
            style={{
              padding: 10,
              borderRadius: 50,
            }}
            onPress={() => setSelectedMonth(selectedMonth.add(1, 'month'))}
          >
            <Feather name='chevron-right' size={25} color='#1B1B1D' />
          </TouchableOpacity>
        </View>

        <View style={{ width: 22 }} />
      </View>

      {/* ================= SUMMARY CARD ================= */}
      <View style={styles.card}>
        {/* ===== TOTAL SELL (BIG) ===== */}
        <Text style={styles.totalSellBig}>{totalSell}৳</Text>
        {/* <Text style={styles.subLabel}>মোট বিক্রি</Text> */}

        {/* ===== TOTAL PROFIT ===== */}
        <View style={{ marginTop: 16 }}>
          <View style={styles.rowHeader}>
            <Text style={styles.profitText}>
              লাভ = <Text style={styles.amountText}>{totalProfit}৳</Text>
            </Text>
            <Text style={styles.percentText}>{profitPercent}%</Text>
          </View>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${profitPercent}%`,
                  backgroundColor: '#2F4F4F',
                },
              ]}
            />
          </View>
        </View>

        {/* ===== TOTAL EXPENSE ===== */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.rowHeader}>
            <Text style={styles.expenseText}>
              খরচ = <Text style={styles.amountText}>{totalExpense}৳</Text>
            </Text>
            <Text style={styles.percentText}>{expensePercent}%</Text>
          </View>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${expensePercent}%`,
                  backgroundColor: '#3A3A3C',
                },
              ]}
            />
          </View>
        </View>

        {/* ===== TOTAL BALANCE ===== */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.rowHeader}>
            <Text style={styles.balanceText}>
              ব্যালেন্স = <Text style={styles.amountText}>{totalBalance}৳</Text>
            </Text>
            <Text style={styles.percentText}>{balancePercent}%</Text>
          </View>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${balancePercent}%`,
                  backgroundColor: '#2F4F4F',
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* ================= EXPENSE DETAILS ================= */}
      <View style={[styles.card, { marginBottom: 100 }]}>
        <Text style={styles.sectionTitle}>খরচের বিস্তারিত</Text>

        {expenseData.items.map((i, idx) => (
          <HorizontalBar
            key={idx}
            name={i.reason}
            amount={i.amount}
            percent={i.percent}
            color={EXPENSE_COLORS[idx % EXPENSE_COLORS.length]}
          />
        ))}
      </View>
    </ScrollView>
  );
}

/* ================= HELPERS ================= */

function summarize(data) {
  const map = {};
  data.forEach((i) => {
    map[i.reason] = (map[i.reason] || 0) + Number(i.amount);
  });

  const total = Object.values(map).reduce((s, v) => s + v, 0);

  const items = Object.keys(map)
    .map((key) => ({
      reason: key,
      amount: map[key],
      percent: total === 0 ? 0 : Math.round((map[key] / total) * 100),
    }))
    .sort((a, b) => b.percent - a.percent);

  return { total, items };
}

/* ================= COMPONENT ================= */

function HorizontalBar({ name, amount, percent, color }) {
  return (
    <View style={styles.rowItem}>
      <View style={styles.rowHeader}>
        <Text style={styles.reason}>{name}</Text>
        <Text style={styles.value}>
          {amount}৳ · {percent}%
        </Text>
      </View>

      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${percent}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

/* ================= COLORS ================= */

const EXPENSE_COLORS = ['#2F4F4F', '#3A3A3C', '#1B1B1D', '#b2b3b3', '#707070'];

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    paddingTop: 0,
    height: '100%',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D7DCDC',
    borderRadius: 20,
  },

  monthText: {
    marginHorizontal: 40,
    marginVertical: 6,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#EAEDED',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  totalSellBig: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2F4F4F',
    textAlign: 'center',
    marginTop: 6,
  },

  amountText: {
    fontWeight: '700',
    marginTop: 6,
  },

  percentText: {
    fontWeight: '700',
  },

  profitText: {
    fontWeight: '700',
    color: '#2F4F4F',
  },

  expenseText: {
    fontWeight: '700',
    color: '#8e0202',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },

  sellText: {
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 4,
  },

  percentLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },

  rowItem: {
    marginBottom: 14,
  },

  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  reason: {
    fontWeight: '600',
    color: '#3A3A3C',
  },

  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
  },

  progressBg: {
    height: 10,
    backgroundColor: '#D7DCDC',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  balanceText: {
    fontWeight: '700',
    color: '#2F4F4F',
  },
});
