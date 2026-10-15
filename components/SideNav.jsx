import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
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
  }, [overlayAnim, slideAnim, visible]);

  const go = (path, label) => {
    router.push(path);
    setSelected(label);
    onClose();
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
          <Text style={styles.headerText}>Business Wallet</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
          style={styles.menuScroll}
        >
          <MenuItem
            icon='home'
            label='Home'
            onPress={() => go('/', 'Home')}
            selected={selected === 'Home'}
          />

          <MenuItem
            icon='phone'
            label='Contact'
            onPress={() => go('/contact', 'Contact')}
            selected={selected === 'Contact'}
          />
          <MenuItem
            icon='shield-lock'
            label='Privacy Policy'
            onPress={() => go('/privacy', 'Privacy Policy')}
            selected={selected === 'Privacy Policy'}
          />

          <MenuItem
            icon='cloud-upload'
            label='Backup & Restore'
            onPress={() => go('/backup', 'Backup & Restore')}
            selected={selected === 'Backup & Restore'}
            accent
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function MenuItem({ icon, label, onPress, selected, accent }) {
  const color = accent ? '#2F4F4F' : selected ? '#1B1B1D' : '#3A3A3C';

  const bg = accent
    ? selected
      ? '#EAEDED'
      : '#EAEDED'
    : selected
      ? '#EAEDED'
      : 'transparent';

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text
        style={[
          styles.itemText,
          { color },
          (selected || accent) && { fontWeight: '600' },
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
    backgroundColor: '#EAEDED',
    paddingTop: 0,
    elevation: 10,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#D7DCDC',
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 8,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#9e8044',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },

  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAEDED',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  itemText: {
    fontSize: 15,
    color: '#595959',
  },
});
