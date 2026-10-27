import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { getShopProfile, insertMemo } from '../../database/db';

export default function NewMemoPage() {
  const router = useRouter();
  const draftCreationStarted = useRef(false);

  useEffect(() => {
    if (draftCreationStarted.current) return undefined;
    draftCreationStarted.current = true;
    let active = true;
    const createDraft = async () => {
      try {
        const shopProfile = await getShopProfile();
        if (!shopProfile) {
          Toast.show({
            type: 'error',
            text1: 'আগে দোকানের তথ্য যোগ করুন',
          });
          if (active) router.replace('/memo/shop');
          return;
        }

        const result = await insertMemo({
          date: new Date().toISOString(),
          shopName: shopProfile.name,
          shopPhone: shopProfile.phone,
          shopAddress: shopProfile.address,
          shopDescription: shopProfile.description,
        });
        if (active) router.replace(`/memo/${result.lastInsertRowId}`);
      } catch (error) {
        console.error('Cash memo draft create failed', error);
        Toast.show({
          type: 'error',
          text1: 'নতুন মেমো খোলা যায়নি',
          text2: error.message,
        });
        if (active) router.back();
      }
    };

    createDraft();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size='large' color='#2F4F4F' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
