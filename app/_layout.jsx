import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // 🆕 ADD
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';

import Header from '../components/Header';
import SideNav from '../components/SideNav';
import { DataProvider } from '../context/DataContext';
import { useSQLite } from '../hooks/useSQLite';

export default function Layout() {
  const dbReady = useSQLite();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <DataProvider>
      {/* 🔥 STATUS BAR FIX */}
      <StatusBar style='dark' backgroundColor='#ffffff' />

      {/* Header */}
      <Header onMenu={() => setMenuOpen(true)} />

      {/* Pages */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* Global SideNav */}
      <SideNav visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <Toast />
    </DataProvider>
  );
}
