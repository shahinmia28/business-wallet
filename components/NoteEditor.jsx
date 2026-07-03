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

// শেষ লাইন দেখে open করার সময় mode বোঝা
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
  // listMode = null মানে পরের Enter সাধারণ নতুন লাইন
  // listMode = 'number' মানে পরের Enter এ auto-number আসবে
  const [listMode, setListMode] = useState(null);

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isUndoRedo = useRef(false);
  const saveTimer = useRef(null);
  const firstLoad = useRef(true);

  /* ── sync ── */
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

  /* ── auto save / delete ── */
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

  /* ── close ── */
  const handleClose = () => {
    if (!note?.id && hasContent()) onSave({ title, content, pinned });
    onClose();
  };

  /* ── Android back ── */
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, title, content]);

  /* ── manual save ── */
  const handleSave = () => {
    if (!hasContent()) return;
    onSave({ id: note?.id, title, content, pinned });
    onClose();
  };

  /* ── content change ─────────────────────────────────────────
     listMode শুধু Enter এর আচরণ নিয়ন্ত্রণ করে।
     বাকি সব লেখা যেভাবে আছে সেভাবেই থাকে।
  ── */
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
        // আগের line এ content আছে? → পরের number দাও
        const hasText = prev.replace(/^\d+\.\s/, '').trim().length > 0;
        if (hasText) {
          const n = Number(prev.match(/^(\d+)/)[1]) + 1;
          lines[lines.length - 1] = `${n}. `;
          setContent(lines.join('\n'));
          return;
        } else {
          // খালি numbered line এ Enter → list শেষ, plain line
          lines[lines.length - 2] = ''; // empty number line মুছো
          lines[lines.length - 1] = '';
          setListMode(null);
          setContent(lines.join('\n'));
          return;
        }
      }
      // list mode আছে কিন্তু আগের line number না → plain Enter
    }

    setContent(text);
  };

  /* ── list বাটন ───────────────────────────────────────────────
     শুধু mode বদলায় + cursor এর পরে নতুন numbered line শুরু করে।
     আগের content অপরিবর্তিত।
  ── */
  const activateList = () => {
    setListMode('number');
    // content এর শেষে নতুন numbered line যোগ (যদি ইতিমধ্যে না থাকে)
    setContent((prev) => {
      const lines = prev.split('\n');
      const lastLine = lines[lines.length - 1] || '';
      // শেষ line ইতিমধ্যে numbered? তাহলে কিছু করার নেই
      if (/^\d+\.\s/.test(lastLine)) return prev;
      // শেষ numbered line খুঁজে পরবর্তী number বের করো
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

  /* ── plain text বাটন ─────────────────────────────────────────
     শুধু mode বদলায়।
     পরের Enter থেকে সাধারণ line আসবে।
     আগের list item গুলো যেভাবে আছে সেভাবেই থাকবে।
  ── */
  const activatePlain = () => {
    setListMode(null);
    // cursor এর পরে নতুন plain line শুরু করো (যদি শেষটা numbered হয়)
    setContent((prev) => {
      const lines = prev.split('\n');
      const lastLine = lines[lines.length - 1] || '';
      if (
        /^\d+\.\s/.test(lastLine) &&
        lastLine.replace(/^\d+\.\s/, '').trim() === ''
      ) {
        // শেষে খালি numbered line আছে → সরাও
        lines.pop();
        return lines.join('\n') + '\n';
      }
      return prev.endsWith('\n') ? prev : prev + '\n';
    });
  };

  /* ── undo / redo ── */
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

  /* ── delete ── */
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
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
            <Ionicons name='arrow-back' size={22} color='#374151' />
          </TouchableOpacity>
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
              <Text style={styles.saveBtnText}>সেভ</Text>
            </TouchableOpacity>
            {note?.id && (
              <TouchableOpacity onPress={confirmDelete} style={styles.iconBtn}>
                <Ionicons name='trash-outline' size={20} color='#ef4444' />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── TITLE ── */}
        <TextInput
          style={styles.titleInput}
          placeholder='শিরোনাম...'
          placeholderTextColor='#d1d5db'
          value={title}
          onChangeText={setTitle}
          multiline
        />

        <View style={styles.divider} />

        {/* ── CONTENT ── */}
        <TextInput
          style={styles.contentInput}
          placeholder='লিখুন...'
          placeholderTextColor='#d1d5db'
          multiline
          value={content}
          onChangeText={handleContentChange}
          textAlignVertical='top'
        />

        {/* ── TOOLBAR ── */}
        <View style={styles.toolbar}>
          {/* Undo */}
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

          {/* Redo */}
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

          <View style={styles.separator} />

          {/* Plain text */}
          <TouchableOpacity
            onPress={activatePlain}
            style={[styles.toolBtn, listMode === null && styles.toolBtnActive]}
          >
            <MaterialCommunityIcons
              name='format-text'
              size={22}
              color={listMode === null ? '#6366f1' : '#374151'}
            />
          </TouchableOpacity>

          {/* Ordered list */}
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

          {/* Mode indicator */}
          <View style={styles.modeIndicator}>
            <Text style={styles.modeText}>
              {listMode === 'number' ? '📋 লিস্ট মোড' : '📝 টেক্সট মোড'}
            </Text>
          </View>
        </View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: { padding: 8, borderRadius: 10 },
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    gap: 4,
  },
  toolBtn: { padding: 8, borderRadius: 10 },
  toolBtnActive: { backgroundColor: '#ede9fe' },
  separator: {
    width: 1,
    height: 22,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 6,
  },
  modeIndicator: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  modeText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
});
