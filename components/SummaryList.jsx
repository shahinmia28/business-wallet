import { StyleSheet, Text, View } from 'react-native';

export default function SummaryList({ totalExpense, totalIncome, totalSell }) {
  const balance = totalIncome - totalExpense;

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>বিক্রি</Text>
        <Text style={[styles.value, { color: '#2F4F4F' }]}>{totalSell}৳</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>লাভ</Text>
        <Text style={[styles.value, { color: '#2F4F4F' }]}>{totalIncome}৳</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>ব্যয়</Text>
        <Text
          style={[
            styles.value,
            {
              color: '#a10217',
              backgroundColor: '#fce0e4',
            },
          ]}
        >
          {totalExpense}৳
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>ব্যালেন্স</Text>
        <Text
          style={[
            styles.value,
            {
              color: balance >= 0 ? '#2F4F4F' : '#a10217',
            },
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
    backgroundColor: '#ffffff',
    borderWidth: 1.25,
    borderColor: '#dcccae',
    borderRadius: 18,
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c7575',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
});
