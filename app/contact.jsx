import { Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // expo-router use করলে
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Contact() {
  const router = useRouter();

  const contactInfo = [
    {
      label: 'Name',
      value: 'Shahin Mia',
      type: 'text',
      icon: <MaterialIcons name='person' size={20} color='#2980b9' />,
      linkPage: '/about', // Name tap করলে About page এ যাবে
    },
    {
      label: 'Phone',
      value: '01777296933',
      type: 'tel',
      link: 'tel:+8801777296933',
      icon: <FontAwesome name='phone' size={20} color='#27ae60' />,
    },
    {
      label: 'Email',
      value: 'contact.shahinmia@gmail.com',
      type: 'email',
      link: 'mailto:contact.shahinmia@gmail.com',
      icon: <MaterialIcons name='email' size={20} color='#e67e22' />,
    },
    {
      label: 'Website',
      value: 'shahinmia.netlify.app',
      type: 'link',
      link: 'https://shahinmia.netlify.app',
      icon: <Entypo name='globe' size={20} color='#8e44ad' />,
    },
    {
      label: 'Address',
      value: 'Bhuapur, Tangail, Dhaka, Bangladesh',
      type: 'text',
      icon: <Entypo name='location-pin' size={20} color='#c0392b' />,
    },
  ];

  const handlePress = (item) => {
    if (item.linkPage) {
      router.push(item.linkPage); // Name card click => About page
    } else if (item.link) {
      Linking.openURL(item.link);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Contact Us</Text>

      {contactInfo.map((item, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.6}
          onPress={() => handlePress(item)}
          style={styles.card}
        >
          <View style={styles.labelRow}>
            {item.icon}
            <Text style={styles.label}>{item.label}</Text>
          </View>
          <Text
            style={item.link || item.linkPage ? styles.valueLink : styles.value}
          >
            {item.value}
          </Text>
        </TouchableOpacity>
      ))}
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
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginLeft: 8,
  },
  value: {
    fontSize: 16,
    color: '#34495e',
  },
  valueLink: {
    fontSize: 16,
    color: '#2980b9',
    textDecorationLine: 'underline',
  },
});
