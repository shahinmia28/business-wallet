import { Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function About() {
  const openWebsite = () => {
    Linking.openURL('https://shahinmia.netlify.app');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>About Me</Text>

      <View style={styles.card}>
        {/* Intro */}
        <Text style={styles.paragraph}>
          <MaterialIcons name='person' size={18} color='#2980b9' /> Hello! I am{' '}
          <Text style={styles.highlight}>Shahin Mia</Text>, a passionate{' '}
          <Text style={styles.highlight}>MERN Stack Developer</Text> and{' '}
          <Text style={styles.highlight}>React Native Developer</Text> based in
          Bangladesh with over{' '}
          <Text style={styles.highlight}>
            5 years of professional experience
          </Text>
          .
        </Text>

        {/* App/Website */}
        <Text style={styles.paragraph}>
          <Entypo name='globe' size={18} color='#8e44ad' /> I have created
          several projects, including this daily income and expense management
          app, and my personal website:{' '}
          <TouchableOpacity onPress={openWebsite}>
            <Text style={styles.link}>shahinmia.netlify.app</Text>
          </TouchableOpacity>
          . I focus on building user-friendly and efficient applications that
          solve real problems.
        </Text>

        {/* Education */}
        <Text style={styles.paragraph}>
          <FontAwesome name='graduation-cap' size={18} color='#e67e22' /> I hold
          an{' '}
          <Text style={styles.highlight}>
            Honors degree in English Literature
          </Text>{' '}
          from the National University of Bangladesh, completed in 2021. My
          educational background, combined with technical expertise, allows me
          to approach projects creatively and professionally.
        </Text>

        {/* Closing */}
        <Text style={styles.paragraph}>
          I am constantly learning and improving my skills, aiming to deliver
          high-quality, scalable, and modern solutions for both web and mobile
          platforms.
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
    marginBottom: 14,
    color: '#34495e',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#2980b9',
  },
  link: {
    fontWeight: 'bold',
    color: '#2980b9',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
