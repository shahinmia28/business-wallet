import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PrivacyPolicy() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Privacy Policy</Text>

      <View style={styles.card}>
        <Text style={styles.paragraph}>
          <MaterialIcons name='privacy-tip' size={20} color='#2980b9' /> Your
          privacy is our top priority. This app does not track or collect any
          personal data. All information entered remains securely on your
          device.
        </Text>

        <Text style={styles.paragraph}>
          <MaterialIcons name='lock' size={20} color='#8e44ad' /> We do not
          share, store, or transmit your data to any third parties. The app
          functions entirely offline, ensuring your information stays private.
        </Text>

        <Text style={styles.paragraph}>
          <MaterialIcons name='check-circle' size={20} color='#27ae60' /> By
          using this app, you can safely manage your daily income and expenses
          without worrying about privacy or data leaks.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
    color: '#34495e',
  },
});
