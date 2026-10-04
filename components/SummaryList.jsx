import { StyleSheet, Text, View } from 'react-native';

export default function SummaryList({ totalExpense, totalIncome, totalSell }) {
  const balance = totalIncome - totalExpense;

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>বিক্রি</Text>
        <Text style={[styles.value, { color: '#1B1B1D' }]}>{totalSell}৳</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>লাভ</Text>
        <Text style={[styles.value, { color: '#3A3A3C' }]}>{totalIncome}৳</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>ব্যয়</Text>
        <Text style={[styles.value, { color: '#b6031b' }]}>
          {totalExpense}৳
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>ব্যালেন্স</Text>
        <Text
          style={[
            styles.value,
            { color: balance >= 0 ? '#1B1B1D' : '#3A3A3C' },
          ]}
        >
          {balance}৳
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  summaryContainer: {
    gap: 10,
  },

  card: {
    backgroundColor: '#EAEDED',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    // boxShadow: '0 8px 20px rgba(27, 27, 29, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
  },
});
