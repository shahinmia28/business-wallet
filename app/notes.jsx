import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NoteEditor from '../components/NoteEditor';
import { useData } from '../context/DataContext';

export default function NotesPage() {
  const { notes, addNote, editNote, deleteNote } = useData();
  const [selectedNote, setSelectedNote] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  // pinned আগে, তারপর বাকিগুলো — createdAt এর উল্টো ক্রমে
  const sorted = [...notes].sort((a, b) => {
    if (b.pinned !== a.pinned) return b.pinned - a.pinned;
    return (
      new Date(b.updatedAt || b.createdAt) -
      new Date(a.updatedAt || a.createdAt)
    );
  });

  const openNew = () => {
    setSelectedNote(null);
    setShowEditor(true);
  };
  const openNote = (note) => {
    setSelectedNote(note);
    setShowEditor(true);
  };

  const renderNote = ({ item }) => {
    const date = dayjs(item.updatedAt || item.createdAt).format('DD MMM YYYY');
    return (
      <TouchableOpacity
        style={styles.noteCard}
        activeOpacity={0.75}
        onPress={() => openNote(item)}
      >
        <View style={styles.noteCardRow}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {item.title || 'শিরোনামহীন'}
          </Text>
          {item.pinned ? (
            <Ionicons name='bookmark' size={15} color='#2F4F4F' />
          ) : null}
        </View>
        <Text style={styles.noteDate}>{date}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name='arrow-back' size={22} color='#1B1B1D' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>নোটস</Text>
        <TouchableOpacity onPress={openNew} style={styles.addBtn}>
          <Ionicons name='add' size={24} color='#EAEDED' />
        </TouchableOpacity>
      </View>

      {/* List */}
      {sorted.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name='document-outline' size={54} color='#D7DCDC' />
          <Text style={styles.emptyText}>কোনো নোট নেই</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
          renderItem={renderNote}
        />
      )}

      {/* Editor */}
      <NoteEditor
        visible={showEditor}
        note={selectedNote}
        onClose={() => setShowEditor(false)}
        onSave={(data) => {
          if (data.id) {
            editNote(data);
          } else {
            addNote({ ...data, pinned: 0 });
            setShowEditor(false);
          }
        }}
        onDelete={(id) => {
          deleteNote(id);
          setShowEditor(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  iconBtn: { padding: 6 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1D',
  },
  addBtn: {
    backgroundColor: '#2F4F4F',
    borderRadius: 12,
    padding: 6,
  },
  noteCard: {
    backgroundColor: '#EAEDED',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  noteCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1B1D',
    flex: 1,
    marginRight: 8,
  },
  noteDate: {
    fontSize: 11,
    color: '#3A3A3C',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 15,
    color: '#3A3A3C',
    fontWeight: '600',
  },
});
