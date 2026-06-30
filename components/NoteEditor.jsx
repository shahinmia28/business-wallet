import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

  /* ---------- UNDO / REDO ---------- */
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isUndoRedo = useRef(false);

  const saveTimer = useRef(null);
  const firstLoad = useRef(true);

  /* ---------- NOTE SYNC ---------- */
  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setPinned(note?.pinned || 0);
    setListMode(null);

    undoStack.current = [];
    redoStack.current = [];
    firstLoad.current = true;
  }, [note, visible]);

  /* ---------- NOTE HAS DATA? (🆕) ---------- */
  const hasContent = () => title.trim().length > 0 || content.trim().length > 0;

  /* ---------- AUTO SAVE + AUTO DELETE ---------- */
  useEffect(() => {
    if (!note?.id) return;

    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    // 🗑 existing note থেকে সব data মুছে ফেললে auto delete
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

  /* ---------- CLOSE HANDLER (🆕 SMART) ---------- */
  const handleClose = () => {
    // 🆕 নতুন note + কিছু লেখা আছে → auto create
    if (!note?.id && hasContent()) {
      onSave({ title, content, pinned });
    }
    onClose();
  };

  /* ---------- ANDROID BACK ---------- */
  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleClose(); // 🆕 smart close
        return true;
      }
    );

    return () => subscription.remove();
  }, [visible, title, content]);

  /* ---------- MANUAL SAVE ---------- */
  const handleSave = () => {
    if (!hasContent()) return;

    onSave({
      id: note?.id,
      title,
      content,
      pinned,
    });
    onClose();
  };

  /* ---------- SMART INPUT ---------- */
  const handleContentChange = (text) => {
    if (!isUndoRedo.current) {
      undoStack.current.push(content);
      redoStack.current = [];
    }
    isUndoRedo.current = false;

    const lines = text.split('\n');
    const prev = lines[lines.length - 2];

    if (
      listMode === 'number' &&
      text.endsWith('\n') &&
      prev?.match(/^(\d+)\.\s/)
    ) {
      const n = Number(prev.match(/^(\d+)/)[1]) + 1;
      lines[lines.length - 1] = `${n}. `;
      setContent(lines.join('\n'));
      return;
    }

    if (
      listMode === 'bullet' &&
      text.endsWith('\n') &&
      prev?.startsWith('• ')
    ) {
      lines[lines.length - 1] = '• ';
      setContent(lines.join('\n'));
      return;
    }

    setContent(text);
  };

  /* ---------- LIST INSERT ---------- */
  const insertList = (type) => {
    setListMode(type);
    const prefix = type === 'number' ? '1. ' : '• ';
    setContent((p) =>
      p === '' || p.endsWith('\n') ? p + prefix : p + '\n' + prefix
    );
  };

  /* ---------- UNDO ---------- */
  const undo = () => {
    if (!undoStack.current.length) return;
    isUndoRedo.current = true;
    const prev = undoStack.current.pop();
    redoStack.current.push(content);
    setContent(prev);
  };

  /* ---------- REDO ---------- */
  const redo = () => {
    if (!redoStack.current.length) return;
    isUndoRedo.current = true;
    const next = redoStack.current.pop();
    undoStack.current.push(content);
    setContent(next);
  };

  /* ---------- DELETE ---------- */
  const confirmDelete = () => {
    Alert.alert('Delete Note?', 'এই নোটটি মুছে ফেলতে চান?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <FontAwesome name='arrow-left' size={22} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {/* 💾 SAVE */}
            <TouchableOpacity onPress={handleSave}>
              <FontAwesome name='save' size={18} color='#9ca3af' />
            </TouchableOpacity>

            {/* ↩️ UNDO */}
            <TouchableOpacity
              onPress={undo}
              disabled={!undoStack.current.length}
            >
              <FontAwesome
                name='undo'
                size={18}
                color={undoStack.current.length ? '#2563eb' : '#9ca3af'}
              />
            </TouchableOpacity>

            {/* ↪️ REDO */}
            <TouchableOpacity
              onPress={redo}
              disabled={!redoStack.current.length}
            >
              <FontAwesome
                name='repeat'
                size={18}
                color={redoStack.current.length ? '#2563eb' : '#9ca3af'}
              />
            </TouchableOpacity>

            {/* Aa */}
            <TouchableOpacity onPress={() => setListMode(null)}>
              <FontAwesome
                name='font'
                size={18}
                color={listMode === null ? '#2563eb' : '#374151'}
              />
            </TouchableOpacity>

            {/* 1. */}
            <TouchableOpacity onPress={() => insertList('number')}>
              <FontAwesome
                name='list-ol'
                size={18}
                color={listMode === 'number' ? '#2563eb' : '#374151'}
              />
            </TouchableOpacity>

            {/* • */}
            <TouchableOpacity onPress={() => insertList('bullet')}>
              <FontAwesome
                name='list-ul'
                size={18}
                color={listMode === 'bullet' ? '#2563eb' : '#374151'}
              />
            </TouchableOpacity>

            {/* 📌 */}
            <TouchableOpacity onPress={() => setPinned((p) => (p ? 0 : 1))}>
              <FontAwesome
                name='thumb-tack'
                size={18}
                color={pinned ? '#f59e0b' : '#374151'}
              />
            </TouchableOpacity>

            {/* 🗑 */}
            {note?.id && (
              <TouchableOpacity onPress={confirmDelete}>
                <FontAwesome name='trash' size={18} color='#dc2626' />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TextInput
          style={styles.title}
          placeholder='Title'
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.content}
          placeholder='Write your note...'
          multiline
          value={content}
          onChangeText={handleContentChange}
        />
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 20 },

  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    elevation: 6,
    marginBottom: 6,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 25,
    alignItems: 'center',
    paddingEnd: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    marginBottom: 12,
  },

  content: {
    flex: 1,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
