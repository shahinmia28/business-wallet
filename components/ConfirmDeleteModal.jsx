import { useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ConfirmDeleteModal({ visible, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const scale = useState(new Animated.Value(0.8))[0];
  const opacity = useState(new Animated.Value(0))[0];

  const animateIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => callback && callback());
  };

  const handleClose = () => {
    animateOut(onClose);
    setText('');
  };

  if (visible) animateIn();

  return (
    <Modal visible={visible} transparent={true} animationType='fade'>
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.container, { transform: [{ scale }], opacity }]}
        >
          <Text style={styles.header}>❗ সকল হিসাব ডিলিট করবেন?</Text>
          <Text style={styles.subText}>
            নিশ্চিত করতে নিচে লিখুন:{' '}
            <Text style={styles.deleteText}>DELETE</Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder='DELETE লিখুন'
            value={text}
            onChangeText={setText}
            textAlign='center'
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                text === 'DELETE'
                  ? styles.confirmButton
                  : styles.disabledButton,
              ]}
              onPress={() => {
                if (text === 'DELETE') {
                  onConfirm();
                  handleClose();
                }
              }}
              disabled={text !== 'DELETE'}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
  deleteText: {
    fontWeight: 'bold',
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: '#888' },
  confirmButton: { backgroundColor: 'red' },
  disabledButton: { backgroundColor: '#f5a5a5' },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
