import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const TOOLBAR_HEIGHT = 52;

const detectListMode = (text) => {
  if (!text) return null;
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const last = lines[lines.length - 1] || '';
  return /^\d+\.\s/.test(last) ? 'number' : null;
};

export default function NoteEditor({
  visible,
  note,
  onSave,
  onDelete,
  onClose,
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(0);
  const [listMode, setListMode] = useState(null);

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isUndoRedo = useRef(false);
  const saveTimer = useRef(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    const c = note?.content || '';
    setTitle(note?.title || '');
    setContent(c);
    setPinned(note?.pinned || 0);
    setListMode(detectListMode(c));
    undoStack.current = [];
    redoStack.current = [];
    firstLoad.current = true;
  }, [note, visible]);

  const hasContent = () => title.trim().length > 0 || content.trim().length > 0;

  useEffect(() => {
    if (!note?.id) return;
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (!hasContent()) {
      onDelete(note.id);
      onClose();
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave({ id: note.id, title, content, pinned });
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [title, content, pinned]);

  const handleClose = () => {
    if (!note?.id && hasContent()) onSave({ title, content, pinned });
    onClose();
  };

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, title, content]);

  const handleSave = () => {
    if (!hasContent()) return;
    onSave({ id: note?.id, title, content, pinned });
    onClose();
  };

  const handleContentChange = (text) => {
    if (!isUndoRedo.current) {
      undoStack.current.push(content);
      redoStack.current = [];
    }
    isUndoRedo.current = false;

    if (listMode === 'number' && text.endsWith('\n')) {
      const lines = text.split('\n');
      const prev = lines[lines.length - 2] || '';
      if (prev.match(/^(\d+)\.\s/)) {
        const hasText = prev.replace(/^\d+\.\s/, '').trim().length > 0;
        if (hasText) {
          const n = Number(prev.match(/^(\d+)/)[1]) + 1;
          lines[lines.length - 1] = `${n}. `;
          setContent(lines.join('\n'));
          return;
        } else {
          lines[lines.length - 2] = '';
          lines[lines.length - 1] = '';
          setListMode(null);
          setContent(lines.join('\n'));
          return;
        }
      }
    }
    setContent(text);
  };

  const activateList = () => {
    setListMode('number');
    setContent((prev) => {
      const lines = prev.split('\n');
      const lastLine = lines[lines.length - 1] || '';
      if (/^\d+\.\s/.test(lastLine)) return prev;
      let nextN = 1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const m = lines[i].match(/^(\d+)\.\s/);
        if (m) {
          nextN = Number(m[1]) + 1;
          break;
        }
      }
      const prefix = `${nextN}. `;
      return prev === '' || prev.endsWith('\n')
        ? prev + prefix
        : prev + '\n' + prefix;
    });
  };

  const activatePlain = () => {
    setListMode(null);
    setContent((prev) => {
      const lines = prev.split('\n');
      const lastLine = lines[lines.length - 1] || '';
      if (
        /^\d+\.\s/.test(lastLine) &&
        lastLine.replace(/^\d+\.\s/, '').trim() === ''
      ) {
        lines.pop();
        return lines.join('\n') + '\n';
      }
      return prev.endsWith('\n') ? prev : prev + '\n';
    });
  };

  const undo = () => {
    if (!undoStack.current.length) return;
    isUndoRedo.current = true;
    redoStack.current.push(content);
    setContent(undoStack.current.pop());
  };
  const redo = () => {
    if (!redoStack.current.length) return;
    isUndoRedo.current = true;
    undoStack.current.push(content);
    setContent(redoStack.current.pop());
  };

  const confirmDelete = () => {
    Alert.alert('নোট মুছবেন?', 'এই নোটটি স্থায়ীভাবে মুছে যাবে।', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'মুছুন',
        style: 'destructive',
        onPress: () => {
          onDelete(note.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
            <Ionicons name='arrow-back' size={22} color='#374151' />
          </TouchableOpacity>
          {/* tool bar */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={undo}
              disabled={!undoStack.current.length}
              style={styles.toolBtn}
            >
              <MaterialCommunityIcons
                name='undo'
                size={22}
                color={undoStack.current.length ? '#374151' : '#d1d5db'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={redo}
              disabled={!redoStack.current.length}
              style={styles.toolBtn}
            >
              <MaterialCommunityIcons
                name='redo'
                size={22}
                color={redoStack.current.length ? '#374151' : '#d1d5db'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={activatePlain}
              style={[
                styles.toolBtn,
                listMode === null && styles.toolBtnActive,
              ]}
            >
              <MaterialCommunityIcons
                name='format-text'
                size={22}
                color={listMode === null ? '#6366f1' : '#374151'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={activateList}
              style={[
                styles.toolBtn,
                listMode === 'number' && styles.toolBtnActive,
              ]}
            >
              <MaterialCommunityIcons
                name='format-list-numbered'
                size={22}
                color={listMode === 'number' ? '#6366f1' : '#374151'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setPinned((p) => (p ? 0 : 1))}
              style={styles.iconBtn}
            >
              <Ionicons
                name={pinned ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={pinned ? '#f59e0b' : '#9ca3af'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Ionicons name='checkmark' size={16} color='#fff' />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            {note?.id && (
              <TouchableOpacity onPress={confirmDelete} style={styles.iconBtn}>
                <Ionicons name='trash-outline' size={20} color='#ef4444' />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* TITLE */}
        <TextInput
          style={styles.titleInput}
          placeholder='শিরোনাম...'
          placeholderTextColor='#d1d5db'
          value={title}
          onChangeText={setTitle}
          multiline
        />

        <View style={styles.divider} />

        {/* CONTENT — নিচে toolbar + keyboard এর জায়গা রাখো */}
        <TextInput
          style={styles.contentInput}
          placeholder='লিখুন...'
          placeholderTextColor='#d1d5db'
          multiline
          value={content}
          onChangeText={handleContentChange}
          textAlignVertical='top'
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 8, borderRadius: 10 },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolBtn: { padding: 8, borderRadius: 10 },
  toolBtnActive: { backgroundColor: '#ede9fe' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
    marginBottom: 4,
  },
  contentInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    paddingHorizontal: 20,
    paddingTop: 8,
    lineHeight: 26,
  },
});
