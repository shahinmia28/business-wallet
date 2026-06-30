import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Calculator({
  visible,
  onClose,
  onResult,
  initialValue = '',
}) {
  const [input, setInput] = useState(initialValue);
  const [selection, setSelection] = useState({
    start: initialValue.length,
    end: initialValue.length,
  });
  const inputRef = useRef();

  /* ---------- ANDROID BACK ---------- */
  useEffect(() => {
    if (!visible) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => sub.remove();
  }, [visible]);

  /* ---------- CALC ---------- */
  const calculateResult = (expr) => {
    if (!expr) return '0';
    try {
      const sanitized = expr.replace(/%/g, '/100');
      return eval(sanitized).toString();
    } catch {
      return '';
    }
  };

  const handlePress = (val) => {
    const { start, end } = selection;
    const newInput = input.slice(0, start) + val + input.slice(end);
    setInput(newInput);
    const cursor = start + val.length;
    setSelection({ start: cursor, end: cursor });
  };

  const handleAC = () => {
    setInput('');
    setSelection({ start: 0, end: 0 });
  };

  const handleBackspace = () => {
    const { start, end } = selection;
    if (start === 0 && end === 0) return;
    const newInput = input.slice(0, start - 1) + input.slice(end);
    setInput(newInput);
    const cursor = Math.max(start - 1, 0);
    setSelection({ start: cursor, end: cursor });
  };

  const handleEqual = () => {
    const res = calculateResult(input);
    if (!res) return;
    setInput(res);
    setSelection({ start: res.length, end: res.length });
    onResult?.(res);
  };

  const buttons = [
    ['AC', '⌫', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* DISPLAY */}
          <View style={styles.display}>
            <TextInput
              ref={inputRef}
              value={input}
              style={styles.input}
              selection={selection}
              onChangeText={setInput}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              showSoftInputOnFocus={false}
              keyboardType='numeric'
              selectable
            />

            <Text style={styles.result} selectable={true}>
              {calculateResult(input)}
            </Text>
          </View>

          {/* KEYPAD */}
          {buttons.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((btn) => {
                const isOperator = ['+', '-', '*', '/', '%'].includes(btn);
                const isEqual = btn === '=';

                return (
                  <TouchableOpacity
                    key={btn}
                    style={[
                      styles.key,
                      isOperator && styles.operatorKey,
                      isEqual && styles.equalKey,
                    ]}
                    onPress={() => {
                      if (btn === 'AC') handleAC();
                      else if (btn === '⌫') handleBackspace();
                      else if (btn === '=') handleEqual();
                      else handlePress(btn);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.keyText,
                        isOperator && styles.operatorText,
                        isEqual && styles.equalText,
                      ]}
                    >
                      {btn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },

  container: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 26,
    margin: 10,

    /* PREMIUM OUTER SHADOW */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },

  display: {
    marginBottom: 16,
  },

  input: {
    fontSize: 36,
    color: '#111827',
    textAlign: 'right',
    paddingVertical: 8,
  },

  result: {
    fontSize: 20,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  key: {
    flex: 1,
    height: 64,
    marginHorizontal: 6,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',

    /* SOFT SHADOW */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },

  keyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },

  operatorKey: {
    backgroundColor: '#eef2ff',
  },

  operatorText: {
    color: '#4f46e5',
  },

  equalKey: {
    backgroundColor: '#4f46e5',
    flex: 2,
  },

  equalText: {
    color: '#fff',
    fontSize: 26,
  },
});
