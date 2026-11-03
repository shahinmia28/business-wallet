import * as FileSystem from 'expo-file-system/legacy';

const PRODUCT_IMAGE_DIR = `${FileSystem.documentDirectory}product_images/`;

export async function saveProductImage(uri) {
  if (!uri) return null;

  await FileSystem.makeDirectoryAsync(PRODUCT_IMAGE_DIR, {
    intermediates: true,
    idempotent: true,
  });

  const extension = uri.toLowerCase().endsWith('.png') ? '.png' : '.jpg';
  const targetPath = `${PRODUCT_IMAGE_DIR}product_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}${extension}`;

  await FileSystem.copyAsync({ from: uri, to: targetPath });
  return targetPath;
}

export async function deleteProductImage(path) {
  if (!path || !path.startsWith(PRODUCT_IMAGE_DIR)) return;

  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}
