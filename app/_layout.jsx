import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';

import Header from '../components/Header';
import SideNav from '../components/SideNav';
import { DataProvider } from '../context/DataContext';
import { useSQLite } from '../hooks/useSQLite';

// শুধু এই পেজগুলোতে global Header দেখাবে
const HEADER_PAGES = [
  '/',
  '/index',
  '/all',
  '/notes',
  '/today',
  '/report',
  '/expenseForm',
  '/incomeForm',
  '/about',
  '/contact',
  '/privacy',
];

export default function Layout() {
  const dbReady = useSQLite();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const showHeader = HEADER_PAGES.includes(pathname);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <DataProvider>
      <StatusBar style='dark' backgroundColor='#ffffff' />

      {/* শুধু home পেজে global Header */}
      {showHeader && <Header onMenu={() => setMenuOpen(true)} />}

      <Stack screenOptions={{ headerShown: false }} />

      <SideNav visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <Toast />
    </DataProvider>
  );
}
