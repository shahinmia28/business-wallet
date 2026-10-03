import * as FileSystem from 'expo-file-system/legacy';

export const CUSTOMER_PRESCRIPTION_DIR = `${FileSystem.documentDirectory}customer_prescriptions/`;
export const PROFILE_IMAGE_DIR = `${FileSystem.documentDirectory}profile_images/`;

export const ensureCustomerPrescriptionDir = async () => {
  await FileSystem.makeDirectoryAsync(CUSTOMER_PRESCRIPTION_DIR, {
    intermediates: true,
  });
  return CUSTOMER_PRESCRIPTION_DIR;
};

export const ensureProfileImageDir = async () => {
  await FileSystem.makeDirectoryAsync(PROFILE_IMAGE_DIR, {
    intermediates: true,
  });
  return PROFILE_IMAGE_DIR;
};

export const deletePrescriptionImage = async (filePath) => {
  if (!filePath) return;

  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }
  } catch (error) {
    console.warn(
      'Failed to delete prescription image:',
      error?.message || error,
    );
  }
};

export const saveCustomerPrescriptionImage = async ({
  uri,
  customerId,
  previousPath = null,
}) => {
  if (!uri) return null;

  const extension = uri.toLowerCase().endsWith('.png') ? '.png' : '.jpg';
  const targetPath = `${CUSTOMER_PRESCRIPTION_DIR}customer_${customerId || 'new'}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}${extension}`;

  await ensureCustomerPrescriptionDir();
  await FileSystem.copyAsync({
    from: uri,
    to: targetPath,
  });

  if (previousPath && previousPath !== targetPath) {
    await deletePrescriptionImage(previousPath);
  }

  return targetPath;
};

export const deleteProfileImage = async (filePath) => {
  if (!filePath) return;

  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }
  } catch (error) {
    console.warn('Failed to delete profile image:', error?.message || error);
  }
};

export const saveProfileImage = async ({
  uri,
  ownerId,
  ownerType = 'customer',
  previousPath = null,
}) => {
  if (!uri) return null;

  const extension = uri.toLowerCase().endsWith('.png') ? '.png' : '.jpg';
  const targetPath = `${PROFILE_IMAGE_DIR}${ownerType}_${ownerId || 'new'}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}${extension}`;

  await ensureProfileImageDir();
  await FileSystem.copyAsync({
    from: uri,
    to: targetPath,
  });

  if (previousPath && previousPath !== targetPath) {
    await deleteProfileImage(previousPath);
  }

  return targetPath;
};
