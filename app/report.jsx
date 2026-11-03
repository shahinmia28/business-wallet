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

  /* ================= MONTH DATA ================= */

  const monthlyIncomes = useMemo(
    () => filterByMonth(incomes, selectedMonth),
    [incomes, selectedMonth],
  );

  const monthlyExpenses = useMemo(
    () => filterByMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const productStats = useMemo(
    () => summarizeProducts(monthlyIncomes, selectedMonth),
    [monthlyIncomes, selectedMonth],
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
  const expensePercents = expenseData.items.map((item) => item.percent);
  const minExpensePercent = Math.min(...expensePercents);
  const maxExpensePercent = Math.max(...expensePercents);

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
        <Text style={styles.sectionTitle}>মাসিক হিসাব</Text>
        <View style={styles.metricsGrid}>
          <SummaryMetric
            label='মোট বিক্রি'
            amount={totalSell}
            color='#2F4F4F'
          />
          <SummaryMetric
            label='মোট লাভ'
            amount={totalProfit}
            percent={profitPercent}
            color='#2F4F4F'
          />
          <SummaryMetric
            label='মোট খরচ'
            amount={totalExpense}
            percent={expensePercent}
            color='#3A3A3C'
          />
          <SummaryMetric
            label='মোট ব্যালেন্স'
            amount={totalBalance}
            percent={balancePercent}
            color='#2F4F4F'
          />
        </View>
      </View>

      {/* ================= PRODUCT DETAILS ================= */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>মাসিক বিক্রি ও লাভের বিস্তারিত</Text>
        <View style={styles.metricsGrid}>
          <Metric
            label='মোট পণ্য বিক্রি'
            value={`${formatAmount(productStats.count)}টি`}
          />
          <Metric
            label='প্রতিদিন গড় পণ্য'
            value={`${formatAmount(productStats.averageDailyCount)}টি`}
          />
          <Metric
            label='প্রতি পণ্যের গড় দাম'
            value={`${formatAmount(productStats.averagePrice)}৳`}
          />
          <Metric
            label='প্রতিদিন গড় বিক্রি'
            value={`${formatAmount(productStats.averageDailySales)}৳`}
          />
          <Metric
            label='প্রতি পণ্যে গড় লাভ'
            value={`${formatAmount(productStats.averageProfit)}৳`}
          />
          <Metric
            label='প্রতিদিন গড় লাভ'
            value={`${formatAmount(productStats.averageDailyProfit)}৳`}
          />

          <Metric
            label='সর্বোচ্চ দামের পণ্য'
            value={
              productStats.highest
                ? `${formatAmount(productStats.highest.price)}৳`
                : '—'
            }
          />
          <Metric
            label='সর্বোচ্চ লাভের পণ্য '
            value={
              productStats.highest
                ? `${formatAmount(productStats.highest.profit)}৳`
                : '—'
            }
          />
          <Metric
            label='সর্বনিম্ন দামের পণ্য'
            value={
              productStats.lowest
                ? `${formatAmount(productStats.lowest.price)}৳`
                : '—'
            }
          />
          <Metric
            label='সর্বনিম্ন লাভের পণ্য'
            value={
              productStats.lowest
                ? `${formatAmount(productStats.lowest.profit)}৳`
                : '—'
            }
          />
        </View>
      </View>

      {/* ================= EXPENSE DETAILS ================= */}
      <View style={[styles.card, { marginBottom: 100 }]}>
        <Text style={styles.sectionTitle}>খরচের বিস্তারিত</Text>
        <View style={styles.metricsGrid}>
          {expenseData.items.map((item) => (
            <ExpenseMetric
              key={item.reason}
              name={item.reason}
              amount={item.amount}
              percent={item.percent}
              color={getExpenseColor(
                item.percent,
                minExpensePercent,
                maxExpensePercent,
              )}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

/* ================= HELPERS ================= */

function filterByMonth(data, selectedMonth) {
  const startOfMonth = selectedMonth.startOf('month').toDate();
  const endOfMonth = selectedMonth.endOf('month').toDate();
  return data.filter((item) => {
    const date = new Date(item.date);
    return date >= startOfMonth && date <= endOfMonth;
  });
}

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

function summarizeProducts(monthlyIncomes, selectedMonth) {
  const products = monthlyIncomes
    .map((income) => ({
      price: Number(income.selAmount),
      profit: Number(income.amount || 0),
    }))
    .filter(
      (product) =>
        Number.isFinite(product.price) &&
        product.price >= 0 &&
        Number.isFinite(product.profit),
    );
  const count = products.length;
  const totalSales = products.reduce((sum, product) => sum + product.price, 0);
  const totalProfit = products.reduce(
    (sum, product) => sum + product.profit,
    0,
  );
  const today = dayjs();
  const daysToAverage =
    selectedMonth.year() === today.year() &&
    selectedMonth.month() === today.month()
      ? today.date()
      : selectedMonth.daysInMonth();
  const highest = products.reduce(
    (result, product) =>
      !result || product.price > result.price ? product : result,
    null,
  );
  const lowest = products.reduce(
    (result, product) =>
      !result || product.price < result.price ? product : result,
    null,
  );

  return {
    count,
    averageDailyCount: daysToAverage ? count / daysToAverage : 0,
    averagePrice: count ? totalSales / count : 0,
    averageDailySales: daysToAverage ? totalSales / daysToAverage : 0,
    averageDailyProfit: daysToAverage ? totalProfit / daysToAverage : 0,
    averageProfit: count ? totalProfit / count : 0,
    highest,
    lowest,
  };
}

function formatAmount(value) {
  return Math.round(Number(value) || 0).toLocaleString('bn-BD');
}

function getExpenseColor(percent, minPercent, maxPercent) {
  const low = [220, 38, 38];
  const high = [127, 29, 29];
  const range = maxPercent - minPercent;
  const intensity = range === 0 ? 0.5 : (percent - minPercent) / range;
  const channels = low.map((channel, index) =>
    Math.round(channel + (high[index] - channel) * intensity),
  );
  return `#${channels
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

/* ================= COMPONENT ================= */

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SummaryMetric({ label, amount, percent, color }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={[styles.summaryAmount, { color }]}>
        {formatAmount(amount)}৳
      </Text>
      <View style={styles.rowHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        {percent !== undefined ? (
          <Text style={[styles.summaryPercent, { color }]}>{percent}%</Text>
        ) : null}
      </View>
    </View>
  );
}

function ExpenseMetric({ name, amount, percent, color }) {
  return (
    <View style={[styles.expenseMetric, { borderColor: color }]}>
      <Text style={[styles.summaryAmount, { color }]}>
        {formatAmount(amount)}৳
      </Text>
      <View style={styles.rowHeader}>
        <Text style={styles.metricLabel} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.summaryPercent, { color }]}>{percent}%</Text>
      </View>
    </View>
  );
}

/* ================= COLORS ================= */

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
    marginVertical: 10,
  },

  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    boxShadow: '-2px 5px 20px 1px rgba(27, 27, 29, 0.125)',
  },

  monthText: {
    marginHorizontal: 40,
    marginVertical: 6,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    boxShadow: '-2px 5px 20px 1px rgba(27, 27, 29, 0.125)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  productRevenue: {
    color: '#2F4F4F',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  detailSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 2,
  },
  detailSectionTitle: {
    color: '#2F4F4F',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailDivider: {
    backgroundColor: '#E4E9E7',
    height: 1,
    marginBottom: 12,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metric: {
    width: '48%',
    minHeight: 76,
    justifyContent: 'center',
    backgroundColor: '#F3F6F5',
    borderRadius: 12,
    marginBottom: 10,
    padding: 10,
  },
  metricValue: {
    color: '#2F4F4F',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricLabel: {
    color: '#3A3A3C',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryMetric: {
    width: '48%',
    minHeight: 96,
    justifyContent: 'space-between',
    backgroundColor: '#F3F6F5',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E9E7',
  },
  summaryAmount: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'left',
    marginBottom: 12,
  },
  summaryPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  expenseMetric: {
    width: '48%',
    minHeight: 96,
    justifyContent: 'space-between',
    backgroundColor: '#FFF7F7',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  productPriceRow: {
    borderTopColor: '#E4E9E7',
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: 2,
    paddingTop: 12,
  },
  productPriceItem: {
    flex: 1,
    paddingHorizontal: 6,
  },
  productPriceLabel: {
    color: '#707070',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  productPrice: {
    color: '#2F4F4F',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  bestSeller: {
    color: '#2F4F4F',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  noteText: {
    color: '#707070',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyText: {
    color: '#8e0202',
    textAlign: 'center',
  },

  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
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
});
