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
    [incomes, selectedMonth]
  );

  const monthlyExpenses = useMemo(
    () => filterByMonth(expenses),
    [expenses, selectedMonth]
  );

  /* ================= TOTALS ================= */

  const totalSell = monthlyIncomes.reduce(
    (s, i) => s + Number(i.selAmount || 0),
    0
  );

  const totalProfit = monthlyIncomes.reduce(
    (s, i) => s + Number(i.amount || 0),
    0
  );

  const totalExpense = monthlyExpenses.reduce(
    (s, i) => s + Number(i.amount || 0),
    0
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
    [monthlyExpenses]
  );

  return (
    <ScrollView style={styles.container}>
      {/* ===== TOP BAR ===== */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Feather name='arrow-left' size={22} />
        </TouchableOpacity>

        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() => setSelectedMonth(selectedMonth.subtract(1, 'month'))}
          >
            <Feather name='chevron-left' size={18} />
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {selectedMonth.format('MMMM YYYY')}
          </Text>

          <TouchableOpacity
            onPress={() => setSelectedMonth(selectedMonth.add(1, 'month'))}
          >
            <Feather name='chevron-right' size={18} />
          </TouchableOpacity>
        </View>

        <View style={{ width: 22 }} />
      </View>

      {/* ================= SUMMARY CARD ================= */}
      {/* ================= SUMMARY CARD ================= */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>মাসিক সারাংশ</Text>

        {/* ===== TOTAL SELL (BIG) ===== */}
        <Text style={styles.totalSellBig}>{totalSell}৳</Text>
        <Text style={styles.subLabel}>মোট বিক্রি</Text>

        {/* ===== TOTAL PROFIT ===== */}
        <View style={{ marginTop: 16 }}>
          <View style={styles.rowHeader}>
            <Text style={styles.profitText}>মোট লাভ</Text>
            <Text style={styles.percentText}>{profitPercent}%</Text>
          </View>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${profitPercent}%`,
                  backgroundColor: '#16a34a',
                },
              ]}
            />
          </View>

          <Text style={styles.amountText}>{totalProfit}৳</Text>
          <Text style={styles.helperText}>মোট বিক্রির উপর লাভ</Text>
        </View>

        {/* ===== TOTAL EXPENSE ===== */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.rowHeader}>
            <Text style={styles.expenseText}>মোট খরচ</Text>
            <Text style={styles.percentText}>{expensePercent}%</Text>
          </View>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${expensePercent}%`,
                  backgroundColor: '#dc2626',
                },
              ]}
            />
          </View>

          <Text style={styles.amountText}>{totalExpense}৳</Text>
          <Text style={styles.helperText}>মোট লাভের উপর খরচ</Text>
        </View>

        {/* ===== TOTAL BALANCE ===== */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.rowHeader}>
            <Text style={styles.balanceText}>মোট ব্যালেন্স</Text>
            <Text style={styles.percentText}>{balancePercent}%</Text>
          </View>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${balancePercent}%`,
                  backgroundColor: '#008080c7',
                },
              ]}
            />
          </View>

          <Text style={styles.amountText}>{totalBalance}৳</Text>
          <Text style={styles.helperText}>মোট লাভের উপর ব্যালেন্স</Text>
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

const EXPENSE_COLORS = ['#dc2626', '#ef4444', '#f87171', '#fecaca', '#ffd9d9'];

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
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
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  monthText: {
    marginHorizontal: 8,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },
  totalSellBig: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2563eb',
    textAlign: 'center',
    marginTop: 6,
  },

  subLabel: {
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 2,
  },

  amountText: {
    fontWeight: '700',
    marginTop: 6,
    color: '#111827',
  },

  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  percentText: {
    fontWeight: '700',
  },

  profitText: {
    fontWeight: '700',
    color: '#16a34a',
  },

  expenseText: {
    fontWeight: '700',
    color: '#dc2626',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  sellText: {
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },

  profitText: {
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 4,
  },

  expenseText: {
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 10,
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
    color: '#374151',
  },

  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  progressBg: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  balanceText: {
    fontWeight: '700',
    color: '#008080c7', // Teal for balance
  },
});
