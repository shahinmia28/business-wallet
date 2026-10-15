import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const expertise = [
  { label: 'MERN Stack', icon: 'code-tags' },
  { label: 'React Native', icon: 'cellphone' },
  { label: 'Web & Mobile Apps', icon: 'web' },
];

export default function About() {
  const openWebsite = async () => {
    try {
      await Linking.openURL('https://shahinmia.netlify.app');
    } catch (error) {
      console.warn('developer website open error', error);
      Alert.alert('Error', 'ওয়েবসাইটটি খোলা যায়নি');
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeading}>
        <Text style={styles.eyebrow}>GET TO KNOW THE DEVELOPER</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SM</Text>
        </View>
        <View style={styles.availableBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.availableText}>Based in Bangladesh</Text>
        </View>
        <Text style={styles.name}>Shahin Mia</Text>
        <Text style={styles.role}>MERN Stack & React Native Developer</Text>
        <Text style={styles.heroDescription}>
          Building thoughtful digital products that make everyday tasks simpler.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name='briefcase-outline' size={20} color='#2F4F4F' />
          <Text style={styles.statValue}>5+ years</Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name='phone-portrait-outline' size={20} color='#2F4F4F' />
          <Text style={styles.statValue}>Web + Mobile</Text>
          <Text style={styles.statLabel}>Platforms</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <Ionicons name='sparkles-outline' size={18} color='#2F4F4F' />
          </View>
          <View>
            <Text style={styles.sectionTitle}>What I do</Text>
            <Text style={styles.sectionCaption}>
              Turning ideas into useful apps
            </Text>
          </View>
        </View>
        <Text style={styles.bodyText}>
          I create user-friendly and efficient applications for web and mobile.
          This business wallet app is one of my projects, designed to help keep
          daily income and expenses organised.
        </Text>
        <View style={styles.expertiseList}>
          {expertise.map((item) => (
            <View key={item.label} style={styles.expertiseChip}>
              <MaterialCommunityIcons
                name={item.icon}
                size={16}
                color='#2F4F4F'
              />
              <Text style={styles.expertiseText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <Ionicons name='school-outline' size={18} color='#2F4F4F' />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            <Text style={styles.sectionCaption}>A foundation beyond code</Text>
          </View>
        </View>
        <View style={styles.educationCard}>
          <View style={styles.educationMarker}>
            <View style={styles.educationDot} />
          </View>
          <View style={styles.educationContent}>
            <Text style={styles.educationDegree}>
              Honors in English Literature
            </Text>
            <Text style={styles.educationSchool}>
              National University of Bangladesh
            </Text>
            <Text style={styles.educationYear}>Completed in 2021</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerCard}>
        <View style={styles.footerIcon}>
          <Ionicons name='globe-outline' size={21} color='#EAEDED' />
        </View>
        <View style={styles.footerCopy}>
          <Text style={styles.footerTitle}>Explore my work</Text>
          <Text style={styles.footerDescription}>
            Visit my website to learn more about my projects.
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole='link'
          accessibilityLabel='Open Shahin Mia website'
          onPress={openWebsite}
          activeOpacity={0.8}
          style={styles.websiteButton}
        >
          <Ionicons name='arrow-up-right' size={20} color='#2F4F4F' />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole='link'
          onPress={openWebsite}
          activeOpacity={0.8}
          style={styles.websiteLink}
        >
          <Text style={styles.websiteText}>shahinmia.netlify.app</Text>
          <Ionicons name='arrow-forward' size={15} color='#EAEDED' />
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>Designed and built with care</Text>
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
    marginBottom: 18,
  },
  eyebrow: {
    color: '#718181',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 5,
  },
  pageTitle: {
    color: '#1B1B1D',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  hero: {
    backgroundColor: '#2F4F4F',
    borderRadius: 26,
    padding: 23,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 290,
    justifyContent: 'center',
  },
  heroGlow: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(234, 237, 237, 0.06)',
    top: -115,
    right: -65,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: '#D7E0DE',
    borderWidth: 3,
    borderColor: 'rgba(234, 237, 237, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  avatarText: {
    color: '#2F4F4F',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 1,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(234, 237, 237, 0.12)',
    marginBottom: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#A8D5B5',
  },
  availableText: {
    color: '#EAEDED',
    fontSize: 11,
    fontWeight: '600',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  role: {
    color: '#D6E0DE',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  heroDescription: {
    color: '#C4D1CE',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 12,
    maxWidth: 270,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECEA',
    gap: 5,
  },
  statValue: {
    color: '#1B1B1D',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    color: '#7B8583',
    fontSize: 11,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E8ECEA',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 13,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#EAEDED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#1B1B1D',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionCaption: {
    color: '#87918F',
    fontSize: 11,
    marginTop: 2,
  },
  bodyText: {
    color: '#596563',
    fontSize: 13,
    lineHeight: 21,
  },
  expertiseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },
  expertiseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F3',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  expertiseText: {
    color: '#36514E',
    fontSize: 11,
    fontWeight: '700',
  },
  educationCard: {
    flexDirection: 'row',
    backgroundColor: '#F7F9F8',
    borderRadius: 15,
    padding: 13,
    alignItems: 'stretch',
  },
  educationMarker: {
    width: 20,
    alignItems: 'center',
    paddingTop: 4,
    marginRight: 9,
  },
  educationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#66827D',
    borderWidth: 2,
    borderColor: '#D6E2DE',
  },
  educationContent: {
    flex: 1,
  },
  educationDegree: {
    color: '#263330',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  educationSchool: {
    color: '#65716E',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  educationYear: {
    color: '#87918F',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 7,
  },
  footerCard: {
    backgroundColor: '#1F3736',
    borderRadius: 22,
    padding: 17,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(234, 237, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  footerCopy: {
    flex: 1,
    minWidth: 150,
  },
  footerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footerDescription: {
    color: '#C0CECA',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  websiteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#D7E0DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(234, 237, 237, 0.16)',
    width: '100%',
  },
  websiteText: {
    color: '#EAEDED',
    fontSize: 12,
    fontWeight: '700',
  },
  footerNote: {
    color: '#98A29F',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
  },
});
