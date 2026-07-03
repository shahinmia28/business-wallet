import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import EditDeleteModal from '../components/EditDeleteModal';
import EditForm from '../components/EditForm';
import SummaryList from '../components/SummaryList';
import { useData } from '../context/DataContext';
import formatBDDate from '../utils/BDDateTime';

import { generateBackupPDF, shareBackup } from '../utils/generateBackup';

export default function All() {
  const { expenses, incomes, deleteExpense, deleteIncome } = useData();
  const router = useRouter();

  const [mode, setMode] = useState('today');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const combinedData = useMemo(() => {
    return [
      ...incomes.map((i) => ({ ...i, type: 'income' })),
      ...expenses.map((e) => ({ ...e, type: 'expense' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, incomes]);

  const filteredData = useMemo(() => {
    return combinedData.filter((item) => {
      const d = new Date(item.date);
      if (mode === 'today')
        return d.toDateString() === selectedDate.toDateString();
      if (mode === 'month')
        return (
          d.getMonth() === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        );
      return true;
    });
  }, [mode, combinedData, selectedDate]);

  const totalSell = filteredData
    .filter((i) => i.type === 'income')
    .reduce((s, i) => s + Number(i.selAmount), 0);

  const totalIncome = filteredData
    .filter((i) => i.type === 'income')
    .reduce((s, i) => s + Number(i.amount), 0);

  const totalExpense = filteredData
    .filter((i) => i.type === 'expense')
    .reduce((s, i) => s + Number(i.amount), 0);

  const balance = totalIncome - totalExpense;

  const handleDeleteSingle = async () => {
    if (!selectedItem) return;
    selectedItem.type === 'income'
      ? await deleteIncome(selectedItem.id)
      : await deleteExpense(selectedItem.id);
    setShowOptionModal(false);
  };

  const handleDeleteAllConfirmed = async () => {
    for (const item of filteredData) {
      item.type === 'income'
        ? await deleteIncome(item.id)
        : await deleteExpense(item.id);
    }
    setShowConfirmDelete(false);
  };

  const handleBackup = async () => {
    if (backingUp) return;
    setBackingUp(true);
    try {
      const uri = await generateBackupPDF({ expenses, incomes });
      await shareBackup(uri);
    } catch (e) {
      alert('Backup ব্যর্থ: ' + e.message);
    } finally {
      setBackingUp(false);
    }
  };

  const renderItem = ({ item }) => (
    <>
      <TouchableOpacity
        style={[
          styles.itemCard,
          item.type === 'income' ? styles.incomeCard : styles.expenseCard,
          ,
        ]}
        onPress={() => {
          setSelectedItem(item);
          setShowOptionModal(true);
        }}
      >
        <Text style={styles.itemText}>{formatBDDate(item.date)}</Text>
        <Text
          style={[
            styles.itemText,
            item.type === 'income' ? styles.incomeText : styles.expenseText,
          ]}
        >
          {item.type === 'income' ? `৳${item.selAmount}` : 'ব্যয়'}
        </Text>
        <Text style={styles.itemText}>{item.reason}</Text>
        <Text
          style={[
            styles.itemText,
            item.type === 'income' ? styles.incomeText : styles.expenseText,
          ]}
        >
          {item.type === 'income' ? `৳${item.amount}` : `-৳${item.amount}`}
        </Text>
      </TouchableOpacity>
    </>
  );

  const StickyHeader = () => {
    const monthNames = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ];

    const getHeaderTitle = () => {
      let dateText = '';
      if (mode === 'today') dateText = formatBDDate(selectedDate);
      else if (mode === 'month')
        dateText = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
      else dateText = 'সব';
      return `${dateText}`;
    };

    return (
      <View style={styles.stickyHeader}>
        <View style={styles.summaryContainer}>
          <View style={styles.titleBox}>
            <Text style={styles.summaryTitle}>{getHeaderTitle()}</Text>
          </View>
          <View style={styles.summaryBoxes}>
            <SummaryList
              totalExpense={totalExpense}
              totalIncome={totalIncome}
              totalSell={totalSell}
            />
          </View>
        </View>
        <View style={styles.dateAndDeleteBox}>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowPicker(true)}
          >
            <FontAwesome name='calendar' size={18} />
            <Text style={{ marginLeft: 8 }}>{formatBDDate(selectedDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowConfirmDelete(true)}
            style={styles.deleteAllBtn}
          >
            <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>
              Delete All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleBackup}
            disabled={backingUp}
            style={[styles.deleteAllBtn, backingUp && { opacity: 0.5 }]}
          >
            <Text style={{ color: '#26acdc', fontWeight: 'bold' }}>
              {backingUp ? '...' : 'Backup'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modeRow}>
          {['today', 'month', 'all'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeText, mode === m && { color: 'white' }]}>
                {m === 'today' ? 'আজ' : m === 'month' ? 'এই মাস' : 'সব'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) =>
          item.id ? `${item.type}-${item.id}` : `${item.type}-${index}`
        }
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={<StickyHeader />}
        stickyHeaderIndices={[0]}
        style={{ backgroundColor: '#ffffff' }}
      />
      <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
        <FontAwesome name='home' size={22} color='white' />
      </TouchableOpacity>
      {showOptionModal && selectedItem && (
        <EditDeleteModal
          item={selectedItem}
          onClose={() => setShowOptionModal(false)}
          onEdit={() => {
            setShowOptionModal(false);
            setShowEditForm(true);
          }}
          onDelete={handleDeleteSingle}
        />
      )}
      {showEditForm && selectedItem && (
        <EditForm item={selectedItem} onClose={() => setShowEditForm(false)} />
      )}
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode='date'
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => {
            if (d) setSelectedDate(d);
            setShowPicker(false);
          }}
        />
      )}
      <ConfirmDeleteModal
        visible={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteAllConfirmed}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    paddingVertical: 5,
  },
  summaryContainer: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  titleBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    boxShadow: '0 6px 30px #00000022',
    backgroundColor: '#ffffff',
    borderRadius: 22,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 600,
    padding: 10,
    textAlign: 'center',
    color: '#109b8b',
  },
  summaryBoxes: { flex: 2 },
  dateAndDeleteBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    gap: 8,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0 6px 30px #00000022',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
  },
  deleteAllBtn: {
    flex: 1,
    boxShadow: '0 6px 30px #dc26261b',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeRow: { flexDirection: 'row', marginBottom: 15 },
  modeBtn: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    boxShadow: '0 6px 30px #00000022',
  },
  modeActive: { backgroundColor: '#22c55e' },
  modeText: { fontWeight: 'bold', color: '#464646' },
  deleteAllBtnContainer: { flexDirection: 'row', justifyContent: 'flex-end' },
  itemCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 5,
  },
  incomeCard: { backgroundColor: '#dcfce7' },
  expenseCard: { backgroundColor: '#fee2e2' },
  itemText: { flex: 1, textAlign: 'center' },
  incomeText: { color: '#16a34a', fontWeight: 'bold' },
  expenseText: { color: '#b91c1c', fontWeight: 'bold' },
  homeBtn: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 50,
    elevation: 5,
  },
});
