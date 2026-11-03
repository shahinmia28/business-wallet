import { Feather, FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const combinedData = useMemo(() => {
    return [
      ...incomes.map((i) => ({ ...i, type: 'income' })),
      ...expenses.map((e) => ({ ...e, type: 'expense' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, incomes]);

  const availableYears = useMemo(
    () =>
      [...new Set(
        combinedData
          .map((item) => new Date(item.date))
          .filter((date) => !Number.isNaN(date.getTime()))
          .map((date) => date.getFullYear()),
      )].sort((a, b) => b - a),
    [combinedData],
  );

  const filteredData = useMemo(() => {
    return combinedData.filter((item) => {
      const d = new Date(item.date);
      if (mode === 'all' && selectedYear !== null)
        return d.getFullYear() === selectedYear;
      if (mode === 'today')
        return d.toDateString() === selectedDate.toDateString();
      if (mode === 'month')
        return (
          d.getMonth() === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        );
      return true;
    });
  }, [mode, combinedData, selectedDate, selectedYear]);

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
  const totalProducts = filteredData.filter(
    (item) => item.type === 'income',
  ).length;
  const profitPercent =
    totalSell === 0 ? 0 : Math.round((totalIncome / totalSell) * 100);
  const expensePercent =
    totalIncome === 0 ? 0 : Math.round((totalExpense / totalIncome) * 100);
  const balancePercent =
    totalIncome === 0 ? 0 : Math.round((balance / totalIncome) * 100);

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

  const changeSelectedPeriod = (amount) => {
    if (mode === 'all' && selectedYear !== null) {
      const yearIndex = availableYears.indexOf(selectedYear);
      const nextYear = availableYears[yearIndex - amount];
      if (nextYear !== undefined) setSelectedYear(nextYear);
      return;
    }

    setSelectedDate((currentDate) =>
      mode === 'month'
        ? new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + amount,
            1,
          )
        : new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() + amount,
          ),
    );
  };

  const selectMonth = (monthIndex) => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), monthIndex, 1),
    );
    setMode('month');
    setShowMonthPicker(false);
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    setMode('all');
    setShowYearPicker(false);
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
    const getHeaderTitle = () => {
      let dateText = '';
      if (mode === 'today') dateText = formatBDDate(selectedDate);
      else if (mode === 'month')
        dateText = `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
      else dateText = selectedYear === null ? 'সব' : `${selectedYear}`;
      return `${dateText}`;
    };

    return (
      <View style={styles.stickyHeader}>
        <View style={styles.dateAndDeleteBox}>
          <View style={styles.dateControl}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowPicker(true)}
            >
              <FontAwesome name='calendar' size={18} />
              <Text style={styles.dateText} numberOfLines={1}>
                {formatBDDate(selectedDate)}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setShowConfirmDelete(true)}
            style={[styles.iconActionBtn, styles.deleteActionBtn]}
            accessibilityLabel='সব মুছুন'
          >
            <Feather name='trash-2' size={18} color='#a10217' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleBackup}
            disabled={backingUp}
            style={[styles.iconActionBtn, backingUp && { opacity: 0.5 }]}
            accessibilityLabel='PDF শেয়ার'
          >
            {backingUp ? (
              <Text style={styles.pdfIconText}>...</Text>
            ) : (
              <FontAwesome name='file-pdf-o' size={18} color='#2F4F4F' />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.summaryContainer}>
          <View style={styles.titleBox}>
            <Text style={styles.titleLabel}>{getHeaderTitle()}</Text>
            <Text style={styles.summaryTitle}>{totalProducts}টি</Text>
            <View style={styles.percentRow}>
              <Text style={styles.percentLabel}>লাভ</Text>
              <Text style={styles.percentValue}>{profitPercent}%</Text>
            </View>
            <View style={styles.percentRow}>
              <Text style={styles.percentLabel}>খরচ</Text>
              <Text style={styles.expensePercentValue}>{expensePercent}%</Text>
            </View>
            <View style={styles.percentRow}>
              <Text style={styles.percentLabel}>ব্যালেন্স</Text>
              <Text
                style={[
                  styles.percentValue,
                  balancePercent < 0 && styles.negativePercent,
                ]}
              >
                {balancePercent}%
              </Text>
            </View>
          </View>
          <View style={styles.summaryBoxes}>
            <SummaryList
              totalExpense={totalExpense}
              totalIncome={totalIncome}
              totalSell={totalSell}
            />
          </View>
        </View>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => changeSelectedPeriod(-1)}
            disabled={mode === 'all' && selectedYear === null}
            accessibilityLabel={
              mode === 'month'
                ? 'আগের মাস'
                : mode === 'all'
                  ? 'আগের বছর'
                  : 'আগের দিন'
            }
          >
            <Feather name='chevron-left' size={28} color='#2F4F4F' />
          </TouchableOpacity>
          {['today', 'month', 'all'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeActive]}
              onPress={() => {
                if (m === 'month') {
                  setShowMonthPicker(true);
                } else if (m === 'all') {
                  setShowYearPicker(true);
                } else {
                  setMode(m);
                }
              }}
            >
              <Text style={[styles.modeText, mode === m && { color: 'white' }]}>
                {m === 'today' ? 'আজ' : m === 'month' ? 'মাস' : 'সব'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => changeSelectedPeriod(1)}
            disabled={mode === 'all' && selectedYear === null}
            accessibilityLabel={
              mode === 'month'
                ? 'পরের মাস'
                : mode === 'all'
                  ? 'পরের বছর'
                  : 'পরের দিন'
            }
          >
            <Feather name='chevron-right' size={28} color='#2F4F4F' />
          </TouchableOpacity>
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

      {/* <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
        <FontAwesome name='home' size={22} color='white' />
      </TouchableOpacity> */}

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
            if (d) {
              setSelectedDate(d);
              setMode('today');
            }
            setShowPicker(false);
          }}
        />
      )}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType='fade'
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowMonthPicker(false)}
        >
          <Pressable style={styles.monthModal} onPress={() => {}}>
            <Text style={styles.monthModalTitle}>
              {selectedDate.getFullYear()} সালের মাস নির্বাচন
            </Text>
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthOption,
                    mode === 'month' &&
                      selectedDate.getMonth() === index &&
                      styles.selectedMonthOption,
                  ]}
                  onPress={() => selectMonth(index)}
                >
                  <Text
                    style={[
                      styles.monthOptionText,
                        mode === 'month' &&
                          selectedDate.getMonth() === index &&
                          styles.selectedMonthOptionText,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={showYearPicker}
        transparent
        animationType='fade'
        onRequestClose={() => setShowYearPicker(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowYearPicker(false)}
        >
          <Pressable style={styles.monthModal} onPress={() => {}}>
            <Text style={styles.monthModalTitle}>বছর নির্বাচন</Text>
            <ScrollView
              style={styles.yearList}
              contentContainerStyle={styles.monthGrid}
            >
              <TouchableOpacity
                style={[
                  styles.monthOption,
                  styles.allYearsOption,
                  selectedYear === null && styles.selectedMonthOption,
                ]}
                onPress={() => selectYear(null)}
              >
                <Text
                  style={[
                    styles.monthOptionText,
                    selectedYear === null && styles.selectedMonthOptionText,
                  ]}
                >
                  সব বছরের ডেটা
                </Text>
              </TouchableOpacity>
              {availableYears.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.monthOption,
                    selectedYear === year && styles.selectedMonthOption,
                  ]}
                  onPress={() => selectYear(year)}
                >
                  <Text
                    style={[
                      styles.monthOptionText,
                      selectedYear === year && styles.selectedMonthOptionText,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    flex: 1.15,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    boxShadow: '-2px 5px 20px 1px rgba(27, 27, 29, 0.125)',
  },
  titleLabel: {
    color: '#6c7575',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  summaryTitle: {
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2F4F4F',
  },
  percentRow: {
    alignItems: 'center',
    borderTopColor: '#E4E9E7',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 7,
  },
  percentLabel: {
    color: '#6c7575',
    fontSize: 12,
    fontWeight: '600',
  },
  percentValue: {
    color: '#2F4F4F',
    fontSize: 14,
    fontWeight: '800',
  },
  expensePercentValue: {
    color: '#a10217',
    fontSize: 14,
    fontWeight: '800',
  },
  negativePercent: {
    color: '#a10217',
  },
  summaryBoxes: { flex: 1.85 },
  dateAndDeleteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    gap: 6,
  },
  dateControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateArrow: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEDED',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEDED',
    paddingHorizontal: 9,
    height: 40,
    borderRadius: 12,
    gap: 7,
  },
  dateText: {
    flexShrink: 1,
    fontSize: 12,
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEDED',
    borderRadius: 12,
  },
  deleteActionBtn: {
    backgroundColor: '#FCE8E8',
  },
  pdfIconText: {
    color: '#2F4F4F',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  monthModal: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
  },
  monthModalTitle: {
    color: '#1B1B1D',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  yearList: {
    maxHeight: 420,
  },
  allYearsOption: {
    width: '100%',
  },
  monthOption: {
    width: '31%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6F5',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  selectedMonthOption: {
    backgroundColor: '#2F4F4F',
  },
  monthOptionText: {
    color: '#3A3A3C',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedMonthOptionText: {
    color: '#ffffff',
  },
  deleteAllBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#EAEDED',
  },
  modeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 15,
    gap: 6,
  },
  modeBtn: {
    flex: 1,
    marginHorizontal: 4,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    boxShadow: '0 6px 30px #00000022',
  },
  modeActive: { backgroundColor: '#2F4F4F' },
  modeText: { fontWeight: 'bold', color: '#464646' },
  deleteAllBtnContainer: { flexDirection: 'row', justifyContent: 'flex-end' },
  itemCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 5,
  },
  incomeCard: { backgroundColor: '#edf4f4' },
  expenseCard: { backgroundColor: '#f2e5e5' },
  itemText: { flex: 1, textAlign: 'center' },
  incomeText: { color: '#2F4F4F', fontWeight: 'bold' },
  expenseText: { color: '#1B1B1D', fontWeight: 'bold' },
  homeBtn: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#2F4F4F',
    padding: 16,
    borderRadius: 50,
  },
});

const MONTH_NAMES = [
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
