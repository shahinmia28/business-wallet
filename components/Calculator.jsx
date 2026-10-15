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

const OPERATORS = ['+', '-', '*', '/'];

function evaluateExpression(expression) {
  const tokens = expression.match(/(?:\d+\.?\d*|\.\d+)|[()+\-*/%]/g) || [];
  if (!tokens.length || tokens.join('') !== expression.replace(/\s/g, '')) {
    throw new Error('Invalid expression');
  }

  let position = 0;

  const parseFactor = () => {
    let sign = 1;
    while (tokens[position] === '+' || tokens[position] === '-') {
      if (tokens[position] === '-') sign *= -1;
      position += 1;
    }

    let result;
    if (tokens[position] === '(') {
      position += 1;
      result = parseExpression();
      if (tokens[position] !== ')') throw new Error('Missing closing parenthesis');
      position += 1;
      result = { value: result.value, isPercent: false };
    } else {
      const token = tokens[position];
      if (!token || !/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
        throw new Error('Expected a number');
      }
      position += 1;
      result = { value: Number(token), isPercent: false };
    }

    if (tokens[position] === '%') {
      result = { value: result.value / 100, isPercent: true };
      position += 1;
    }

    return { value: sign * result.value, isPercent: result.isPercent };
  };

  const parseTerm = () => {
    let result = parseFactor();
    while (tokens[position] === '*' || tokens[position] === '/') {
      const operator = tokens[position];
      position += 1;
      const right = parseFactor();
      result = {
        value:
          operator === '*'
            ? result.value * right.value
            : result.value / right.value,
        isPercent: false,
      };
    }
    return result;
  };

  const parseExpression = () => {
    let result = parseTerm();
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position];
      position += 1;
      const right = parseTerm();
      const relativePercent = right.isPercent && !result.isPercent;
      const amount = relativePercent ? result.value * right.value : right.value;
      result = {
        value: operator === '+' ? result.value + amount : result.value - amount,
        isPercent: false,
      };
    }
    return result;
  };

  const result = parseExpression();
  if (position !== tokens.length || !Number.isFinite(result.value)) {
    throw new Error('Invalid expression');
  }

  const rounded = Number(result.value.toPrecision(12));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

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
  const justCalculated = useRef(false);

  useEffect(() => {
    if (!visible) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => sub.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible) return;
    setInput(initialValue);
    setSelection({ start: initialValue.length, end: initialValue.length });
    justCalculated.current = false;
  }, [visible, initialValue]);

  const calculateResult = (expression) => {
    try {
      return evaluateExpression(expression);
    } catch {
      return '';
    }
  };

  const insertValue = (value) => {
    let currentInput = input;
    let start = selection.start;
    let end = selection.end;

    if (justCalculated.current && !OPERATORS.includes(value) && value !== '%') {
      currentInput = '';
      start = 0;
      end = 0;
    }
    justCalculated.current = false;

    if (OPERATORS.includes(value)) {
      const before = currentInput.slice(0, start);
      const after = currentInput.slice(end);
      const lastCharacter = before.slice(-1);

      if (OPERATORS.includes(lastCharacter)) {
        if (value === '-' && ['*', '/'].includes(lastCharacter)) {
          const newInput = `${before}${value}${after}`;
          const cursor = start + 1;
          setInput(newInput);
          setSelection({ start: cursor, end: cursor });
          return;
        }

        const newInput = `${before.slice(0, -1)}${value}${after}`;
        const cursor = start;
        setInput(newInput);
        setSelection({ start: cursor, end: cursor });
        return;
      }

      if (!before && value !== '-') return;
      if (start !== end) {
        const newInput = `${before}${value}${after}`;
        const cursor = start + value.length;
        setInput(newInput);
        setSelection({ start: cursor, end: cursor });
        return;
      }
    }

    if (value === '%') {
      const before = currentInput.slice(0, start);
      const previousCharacter = before.slice(-1);
      if (!/\d|\)/.test(previousCharacter) || currentInput.slice(start, end) === '%') {
        return;
      }
      if (currentInput.slice(start, start + 1) === '%') return;
    }

    if (value === '.') {
      const before = currentInput.slice(0, start);
      const numberInProgress = before.split(/[+\-*/()%]/).pop();
      if (numberInProgress.includes('.')) return;
    }

    let insertedValue = value;
    if (
      /^\d$/.test(value) &&
      currentInput.slice(start - 1, start) === '%'
    ) {
      insertedValue = `*${value}`;
    }

    const newInput =
      currentInput.slice(0, start) + insertedValue + currentInput.slice(end);
    const cursor = start + insertedValue.length;
    setInput(newInput);
    setSelection({ start: cursor, end: cursor });
  };

  const handleAC = () => {
    setInput('');
    setSelection({ start: 0, end: 0 });
    justCalculated.current = false;
  };

  const handleBackspace = () => {
    const { start, end } = selection;
    if (start === end && start === 0) return;

    const deleteStart = start === end ? Math.max(start - 1, 0) : start;
    const newInput = input.slice(0, deleteStart) + input.slice(end);
    setInput(newInput);
    setSelection({ start: deleteStart, end: deleteStart });
    justCalculated.current = false;
  };

  const handleEqual = () => {
    const result = calculateResult(input);
    if (!result) return;
    setInput(result);
    setSelection({ start: result.length, end: result.length });
    justCalculated.current = true;
    onResult?.(result);
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
          <View style={styles.display}>
            <TextInput
              value={input}
              style={styles.input}
              selection={selection}
              onChangeText={(value) => {
                setInput(value.replace(/[^0-9.+*/%()-]/g, ''));
                justCalculated.current = false;
              }}
              onSelectionChange={(event) =>
                setSelection(event.nativeEvent.selection)
              }
              showSoftInputOnFocus={false}
              keyboardType='numeric'
              accessibilityLabel='Calculator expression'
            />

            <Text style={styles.result} selectable>
              {calculateResult(input)}
            </Text>
          </View>

          {buttons.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((button) => {
                const isOperator = [...OPERATORS, '%'].includes(button);
                const isEqual = button === '=';

                return (
                  <TouchableOpacity
                    key={button}
                    style={[
                      styles.key,
                      isOperator && styles.operatorKey,
                      isEqual && styles.equalKey,
                    ]}
                    onPress={() => {
                      if (button === 'AC') handleAC();
                      else if (button === '⌫') handleBackspace();
                      else if (button === '=') handleEqual();
                      else insertValue(button);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole='button'
                    accessibilityLabel={
                      button === '⌫' ? 'Backspace' : button
                    }
                  >
                    <Text
                      style={[
                        styles.keyText,
                        isOperator && styles.operatorText,
                        isEqual && styles.equalText,
                      ]}
                    >
                      {button}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#f0e9dc',
    padding: 16,
    borderRadius: 26,
    margin: 10,
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
    color: '#1B1B1D',
    textAlign: 'right',
    paddingVertical: 8,
  },
  result: {
    fontSize: 20,
    color: '#3A3A3C',
    textAlign: 'right',
    marginTop: 4,
    minHeight: 28,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  key: {
    flex: 1,
    height: 64,
    marginHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1B1B1D',
  },
  operatorKey: {
    backgroundColor: '#D7DCDC',
  },
  operatorText: {
    color: '#2F4F4F',
  },
  equalKey: {
    backgroundColor: '#2F4F4F',
    flex: 2,
  },
  equalText: {
    color: '#fff',
    fontSize: 26,
  },
});
