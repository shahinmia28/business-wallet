import { StyleSheet, Text, View } from 'react-native';

export default function SummaryList({ totalExpense, totalIncome, totalSell }) {
  const balance = totalIncome - totalExpense;

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>বিক্রি</Text>
        <Text style={[styles.value, { color: '#2563eb' }]}>{totalSell}৳</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>লাভ</Text>
        <Text style={[styles.value, { color: '#16a34a' }]}>{totalIncome}৳</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>ব্যয়</Text>
        <Text style={[styles.value, { color: '#dc2626' }]}>
          {totalExpense}৳
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>ব্যালেন্স</Text>
        <Text
          style={[
            styles.value,
            { color: balance >= 0 ? '#008080c7' : '#dc2626' },
          ]}
        >
          {balance}৳
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  /* -------- Summary -------- */
  summaryContainer: {
    gap: 10,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    boxShadow: '0 4px 30px #00000022',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
  },
});
