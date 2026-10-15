import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const contactInfo = [
  {
    label: 'Developer',
    value: 'Shahin Mia',
    icon: 'person',
    linkPage: '/about',
  },
  {
    label: 'Phone',
    value: '01777296933',
    icon: 'phone',
    link: 'tel:+8801777296933',
  },
  {
    label: 'Email',
    value: 'contact.shahinmia@gmail.com',
    icon: 'email',
    link: 'mailto:contact.shahinmia@gmail.com',
  },
  {
    label: 'Website',
    value: 'shahinmia.netlify.app',
    icon: 'language',
    link: 'https://shahinmia.netlify.app',
  },
  {
    label: 'Address',
    value: 'Bhuapur, Tangail, Dhaka, Bangladesh',
    icon: 'location-on',
    type: 'address',
  },
];

export default function Contact() {
  const router = useRouter();

  const handlePress = (item) => {
    if (item.linkPage) {
      router.push(item.linkPage);
      return;
    }

    const url =
      item.link ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.value)}`;

    Linking.openURL(url).catch((error) => {
      console.warn('contact link open error', error);
      Alert.alert('Error', item.type === 'address' ? 'Google Maps খোলা যায়নি' : 'লিংকটি খোলা যায়নি');
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeading}>
        <Text style={styles.eyebrow}>WE’RE HERE TO HELP</Text>
        <Text style={styles.pageTitle}>Get in touch</Text>
        <Text style={styles.intro}>
          Have a question or need a hand? Choose the best way to reach us.
        </Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroIcon}>
          <Ionicons name='chatbubbles' size={29} color='#2F4F4F' />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>PERSONAL SUPPORT</Text>
          <Text style={styles.heroTitle}>Let’s make business simpler.</Text>
          <Text style={styles.heroText}>
            Reach out directly. We’d be happy to hear from you.
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Contact information</Text>
        <Text style={styles.sectionCaption}>Tap any option to connect</Text>
      </View>

      <View style={styles.contactCard}>
        {contactInfo.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            activeOpacity={0.72}
            onPress={() => handlePress(item)}
            accessibilityRole='link'
            accessibilityLabel={`${item.label}: ${item.value}`}
            style={[
              styles.contactRow,
              index < contactInfo.length - 1 && styles.contactRowDivider,
            ]}
          >
            <View style={styles.contactIcon}>
              <MaterialIcons name={item.icon} size={21} color='#52756F' />
            </View>
            <View style={styles.contactCopy}>
              <Text style={styles.contactLabel}>{item.label}</Text>
              <Text style={styles.contactValue}>{item.value}</Text>
            </View>
            <Ionicons name='chevron-forward' size={18} color='#A3AEAA' />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Ionicons name='lock-closed-outline' size={16} color='#718181' />
        <Text style={styles.footerText}>
          Your message and contact details are treated with care.
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
    paddingTop: 14,
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
    minHeight: 150,
    backgroundColor: '#2F4F4F',
    borderRadius: 24,
    padding: 19,
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
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#D7E0DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: '#B9CCC6',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    marginBottom: 5,
  },
  heroText: {
    color: '#D0DBD8',
    fontSize: 11,
    lineHeight: 17,
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
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECEA',
    paddingHorizontal: 15,
    overflow: 'hidden',
  },
  contactRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1EF',
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#52756F18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactCopy: {
    flex: 1,
    marginRight: 8,
  },
  contactLabel: {
    color: '#87918F',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactValue: {
    color: '#263330',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 17,
    paddingHorizontal: 4,
  },
  footerText: {
    flex: 1,
    color: '#718181',
    fontSize: 11,
    lineHeight: 17,
  },
});
