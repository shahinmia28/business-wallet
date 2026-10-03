import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  deletePrescriptionImage,
  deleteProfileImage,
} from '../utils/customerPrescription';

export default function PrescriptionPhotoPicker({
  value,
  onChange,
  label = 'Prescription Photo',
  allowCamera = true,
  variant = 'default',
}) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const isAvatar = variant === 'avatar';

  const pickImage = async (source) => {
    try {
      const permissionResult =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission required',
          source === 'camera'
            ? 'Camera access is required to take a prescription photo.'
            : 'Gallery access is required to select a prescription photo.',
        );
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: false,
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 0.8,
            });

      if (result.canceled || !result.assets?.length) return;
      onChange(result.assets[0].uri);
    } catch (error) {
      console.warn(
        'Prescription image selection failed:',
        error?.message || error,
      );
      Alert.alert('Image error', 'Prescription photo could not be selected.');
    }
  };

  const handleRemove = async () => {
    if (value && typeof value === 'string') {
      if (value.includes('customer_prescriptions')) {
        await deletePrescriptionImage(value);
      }
      if (value.includes('profile_images')) {
        await deleteProfileImage(value);
      }
    }
    onChange(null);
  };

  return (
    <View style={[styles.section, isAvatar && styles.avatarSection]}>
      {!isAvatar ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.previewBox, isAvatar && styles.avatarPreviewBox]}>
        {value ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setViewerVisible(true)}
            style={styles.roundPhotoButton}
          >
            <Image
              source={{ uri: value }}
              style={styles.roundPhotoImage}
              resizeMode='cover'
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => pickImage('library')}
            style={styles.emptyRoundPhoto}
          >
            <Ionicons name='add' size={26} color='#2F4F4F' />
          </TouchableOpacity>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => pickImage('library')}
            accessibilityLabel='Select image from gallery'
          >
            <Ionicons name='images-outline' size={16} color='#fff' />
          </TouchableOpacity>

          {allowCamera ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => pickImage('camera')}
              accessibilityLabel='Take a photo with camera'
            >
              <Ionicons name='camera-outline' size={16} color='#fff' />
            </TouchableOpacity>
          ) : null}

          {value ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.removeBtn]}
              onPress={handleRemove}
              accessibilityLabel='Remove image'
            >
              <Ionicons name='trash-outline' size={16} color='#fff' />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {viewerVisible && value ? (
        <View style={styles.viewerOverlay} pointerEvents='box-none'>
          <View style={styles.viewerBackdrop} />
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewerVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: value }}
            resizeMode='contain'
            style={styles.viewerImage}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  avatarSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 8,
  },
  previewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  avatarPreviewBox: {
    backgroundColor: 'transparent',
    padding: 0,
    alignItems: 'center',
  },
  roundPhotoButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#D7DCDC',
    borderWidth: 2,
    borderColor: '#2F4F4F',
  },
  roundPhotoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAEDED',
  },
  emptyRoundPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAEDED',
    borderWidth: 2,
    borderColor: '#2F4F4F',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#3A3A3C',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2F4F4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    backgroundColor: '#1B1B1D',
  },
  viewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 27, 29, 0.82)',
  },
  viewerHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 30,
  },
  closeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  viewerImage: {
    width: '100%',
    height: '100%',
    zIndex: 25,
  },
});
