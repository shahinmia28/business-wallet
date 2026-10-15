import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const privacyPoints = [
  {
    icon: 'privacy-tip',
    title: 'Your privacy comes first',
    text: 'This app does not track or collect personal data. Information you enter remains securely on your device.',
    color: '#52756F',
  },
  {
    icon: 'lock',
    title: 'Your data stays yours',
    text: 'We do not share, store, or transmit your data to third parties. The app functions offline, helping keep your information private.',
    color: '#65708F',
  },
  {
    icon: 'check-circle',
    title: 'Manage with confidence',
    text: 'Use the app to manage your daily income and expenses with greater peace of mind about your privacy.',
    color: '#56816A',
  },
];

export default function PrivacyPolicy() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeading}>
        <Text style={styles.eyebrow}>YOUR INFORMATION, YOURS</Text>
        <Text style={styles.pageTitle}>Privacy Policy</Text>
        <Text style={styles.intro}>
          A clear overview of how this app handles your information.
        </Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroIcon}>
          <Ionicons name='shield-checkmark' size={31} color='#2F4F4F' />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Privacy, by design</Text>
          <Text style={styles.heroText}>
            Your business information is personal. This app is designed to help
            keep it that way.
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Our privacy principles</Text>
        <Text style={styles.sectionCaption}>Simple, transparent, and clear</Text>
      </View>

      {privacyPoints.map((point, index) => (
        <View key={point.title} style={styles.policyCard}>
          <View style={[styles.pointIcon, { backgroundColor: `${point.color}18` }]}>
            <MaterialIcons
              name={point.icon}
              size={21}
              color={point.color}
            />
          </View>
          <View style={styles.pointContent}>
            <View style={styles.pointTitleRow}>
              <Text style={styles.pointTitle}>{point.title}</Text>
              <Text style={styles.pointNumber}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>
            <Text style={styles.pointText}>{point.text}</Text>
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Ionicons name='information-circle-outline' size={18} color='#718181' />
        <Text style={styles.footerText}>
          We believe privacy should be easy to understand and built into the
          experience.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F7F6',
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 36,
  },
  pageHeading: {
    marginBottom: 19,
  },
  eyebrow: {
    color: '#718181',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  pageTitle: {
    color: '#1B1B1D',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  intro: {
    color: '#718181',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  hero: {
    minHeight: 148,
    backgroundColor: '#2F4F4F',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(234, 237, 237, 0.06)',
    top: -100,
    right: -45,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: '#D7E0DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroText: {
    color: '#D0DBD8',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeading: {
    marginTop: 25,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#1B1B1D',
    fontSize: 17,
    fontWeight: '800',
  },
  sectionCaption: {
    color: '#87918F',
    fontSize: 11,
    marginTop: 3,
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E8ECEA',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  pointIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  pointContent: {
    flex: 1,
  },
  pointTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pointTitle: {
    color: '#263330',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  pointNumber: {
    color: '#A1AAA7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pointText: {
    color: '#65716E',
    fontSize: 12,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 9,
    paddingHorizontal: 4,
  },
  footerText: {
    flex: 1,
    color: '#718181',
    fontSize: 11,
    lineHeight: 17,
  },
});
