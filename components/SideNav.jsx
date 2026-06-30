import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const MENU_WIDTH = 260;

export default function SideNav({ visible, onClose }) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState('Home');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const go = (path, label) => {
    router.push(path);
    setSelected(label);
    onClose(); // auto close
  };

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={{ fontSize: 24 }}>💰</Text>
          </View>
          <Text style={styles.headerText}>Daily Wallet</Text>
        </View>

        {/* Menu */}
        <MenuItem
          icon='home'
          label='Home'
          onPress={() => go('/', 'Home')}
          selected={selected === 'Home'}
        />
        <MenuItem
          icon='plus-circle'
          label='Income Form'
          onPress={() => go('/incomeForm', 'Income Form')}
          selected={selected === 'Income Form'}
        />
        <MenuItem
          icon='minus-circle'
          label='Expense Form'
          onPress={() => go('/expenseForm', 'Expense Form')}
          selected={selected === 'Expense Form'}
        />
        <MenuItem
          icon='clipboard-list'
          label='All Calculations'
          onPress={() => go('/all', 'All Calculations')}
          selected={selected === 'All Calculations'}
        />
        <MenuItem
          icon='calendar-today'
          label='Today'
          onPress={() => go('/today', 'Today')}
          selected={selected === 'Today'}
        />
        <MenuItem
          icon='information'
          label='About Me'
          onPress={() => go('/about', 'About Me')}
          selected={selected === 'About Me'}
        />
        <MenuItem
          icon='phone'
          label='Contact Me'
          onPress={() => go('/contact', 'Contact Me')}
          selected={selected === 'Contact Me'}
        />
        <MenuItem
          icon='shield-lock'
          label='Privacy Policy'
          onPress={() => go('/privacy', 'Privacy Policy')}
          selected={selected === 'Privacy Policy'}
        />
      </Animated.View>
    </View>
  );
}

function MenuItem({ icon, label, onPress, selected }) {
  return (
    <TouchableOpacity
      style={[styles.item, selected ? { backgroundColor: '#00808013' } : null]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={selected ? '#008080cc' : '#595959'}
      />
      <Text
        style={[
          styles.itemText,
          selected ? { color: '#008080cc', fontWeight: '600' } : null,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: '#ffffff',
    paddingTop: 0,
    elevation: 10,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#008080cc',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 55,
    height: 55,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flexShrink: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  itemText: {
    fontSize: 16,
    color: '#595959',
  },
});
