import { FontAwesome } from '@expo/vector-icons';
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

  return (
    <View style={styles.container}>
      {/* ===== Header ===== */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setSelectedNote(null);
            setShowEditor(true);
          }}
        >
          <FontAwesome name='plus' size={22} color='#333' />
        </TouchableOpacity>
      </View>

      {/* ===== Home Button ===== */}
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => router.push('/')}
      >
        <FontAwesome name='home' size={22} color='white' />
      </TouchableOpacity>

      {/* ===== Notes List ===== */}
      <FlatList
        data={notes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noteCard}
            activeOpacity={0.85}
            onPress={() => {
              setSelectedNote(item);
              setShowEditor(true);
            }}
          >
            <Text style={styles.noteTitle}>
              {item.pinned ? '📌 ' : ''}
              {item.title || 'Untitled'}
            </Text>

            <Text style={styles.noteDate}>
              {dayjs(item.updatedAt || item.createdAt).format('DD MMM YYYY')}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* ===== Note Editor ===== */}
      <NoteEditor
        visible={showEditor}
        note={selectedNote}
        onClose={() => setShowEditor(false)}
        onSave={(data) => {
          if (data.id) {
            editNote(data);
          } else {
            addNote({
              ...data,
              pinned: 0,
            });
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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#ffffff',
  },

  header: {
    marginRight: 25,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  noteCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 18,
    boxShadow: '0 6px 30px #00000022',
  },

  noteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },

  noteDate: {
    fontSize: 12,
    color: '#6b7280',
  },

  homeButton: {
    zIndex: 100,
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 50,
    boxShadow: '0 6px 30px #00000022',
  },
});
