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
            <Ionicons name='bookmark' size={15} color='#f59e0b' />
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
          <Ionicons name='arrow-back' size={22} color='#374151' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>নোটস</Text>
        <TouchableOpacity onPress={openNew} style={styles.addBtn}>
          <Ionicons name='add' size={24} color='#fff' />
        </TouchableOpacity>
      </View>

      {/* List */}
      {sorted.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name='document-outline' size={54} color='#e5e7eb' />
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
    backgroundColor: '#f8f9fb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 25,
    marginBottom: 14,
  },
  iconBtn: { padding: 6 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  addBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 6,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    boxShadow: '0 4px 16px #00000010',
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
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  noteDate: {
    fontSize: 11,
    color: '#d1d5db',
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
    color: '#d1d5db',
    fontWeight: '600',
  },
});
