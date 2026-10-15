import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const parseListContent = (content) => {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item && typeof item.text === 'string')
        .map((item, index) => ({
          id: item.id || `legacy-${index}`,
          text: item.text,
        }));
    }
  } catch {
    // Convert older numbered text notes to editable list rows.
  }

  return (content || '')
    .split('\n')
    .filter((line) => line.trim())
    .map((line, index) => ({
      id: `legacy-${index}`,
      text: line.replace(/^\s*\d+\.\s*/, '').replace(/^\s*\d+\s+/, ''),
    }));
};

export default function NoteEditor({
  visible,
  note,
  onSave,
  onDelete,
  onToggleLock,
  onClose,
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(0);
  const [noteType, setNoteType] = useState(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isUndoRedo = useRef(false);
  const saveTimer = useRef(null);
  const firstLoad = useRef(true);
  const listInputRefs = useRef({});
  const listIdCounter = useRef(0);
  const listItems =
    noteType === 'list' ? parseListContent(content) : [];

  useEffect(() => {
    setTitle(note?.title || '');
    const loadedType = note ? (note.noteType === 'list' ? 'list' : 'text') : null;
    const loadedContent = loadedType === 'list'
      ? JSON.stringify(parseListContent(note?.content || ''))
      : note?.content || '';
    setContent(loadedContent);
    setPinned(note?.pinned || 0);
    setNoteType(loadedType);
    undoStack.current = [];
    redoStack.current = [];
    firstLoad.current = true;
  }, [note, visible]);

  const saveNote = useCallback(() => {
    const hasNoteContent =
      title.trim().length > 0 ||
      (noteType === 'list'
        ? parseListContent(content).some((item) => item.text.trim())
        : content.trim().length > 0);
    if (!noteType || !hasNoteContent) return;
    onSave({
      id: note?.id,
      title,
      content,
      pinned,
      noteType,
      isLocked: note?.isLocked ? 1 : 0,
    });
  }, [content, note?.id, note?.isLocked, noteType, onSave, pinned, title]);

  useEffect(() => {
    if (!note?.id || !noteType) return;
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNote, 600);
    return () => clearTimeout(saveTimer.current);
  }, [note?.id, noteType, saveNote, title, content, pinned]);

  const handleClose = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveNote();
    onClose();
  }, [onClose, saveNote]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, handleClose]);

  const handleSave = () => {
    if (!noteType) return;
    const hasNoteContent =
      title.trim().length > 0 ||
      (noteType === 'list'
        ? parseListContent(content).some((item) => item.text.trim())
        : content.trim().length > 0);
    if (!hasNoteContent) {
      Alert.alert('নোট খালি', 'সেভ করার আগে কিছু লিখুন বা একটি task যোগ করুন।');
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveNote();
    onClose();
  };

  const handleContentChange = (text) => {
    if (!isUndoRedo.current) {
      undoStack.current.push(content);
      redoStack.current = [];
    }
    isUndoRedo.current = false;
    setContent(text);
  };

  const updateListItems = (items) => {
    if (!isUndoRedo.current) {
      undoStack.current.push(content);
      redoStack.current = [];
    }
    isUndoRedo.current = false;
    setContent(JSON.stringify(items));
  };

  const makeListId = () => `list-${Date.now()}-${listIdCounter.current++}`;

  const addListItem = (index) => {
    const nextItems = [...listItems];
    const nextItem = { id: makeListId(), text: '' };
    nextItems.splice(index, 0, nextItem);
    updateListItems(nextItems);
    setTimeout(() => listInputRefs.current[nextItem.id]?.focus(), 50);
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

  const chooseType = (type) => {
    setNoteType(type);
    if (type === 'list') {
      const firstItem = { id: makeListId(), text: '' };
      setContent(JSON.stringify([firstItem]));
      setTimeout(() => listInputRefs.current[firstItem.id]?.focus(), 50);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.headerIcon}
            accessibilityRole='button'
            accessibilityLabel='নোট বন্ধ করুন'
          >
            <Ionicons name='arrow-back' size={22} color='#263330' />
          </TouchableOpacity>

          {noteType ? (
            <View style={styles.typeBadge}>
              <Ionicons
                name={noteType === 'list' ? 'list' : 'document-text-outline'}
                size={15}
                color='#52756F'
              />
              <Text style={styles.typeBadgeText}>
                {noteType === 'list' ? 'Numbered list' : 'Plain text'}
              </Text>
            </View>
          ) : (
            <Text style={styles.headerTitle}>নতুন নোট</Text>
          )}

          <View style={styles.headerActions}>
            {noteType ? (
              <>
                <TouchableOpacity
                  onPress={undo}
                  disabled={!undoStack.current.length}
                  style={styles.headerIcon}
                  accessibilityLabel='Undo'
                >
                  <Ionicons
                    name='arrow-undo'
                    size={20}
                    color={undoStack.current.length ? '#52756F' : '#C9D1CE'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={redo}
                  disabled={!redoStack.current.length}
                  style={styles.headerIcon}
                  accessibilityLabel='Redo'
                >
                  <Ionicons
                    name='arrow-redo'
                    size={20}
                    color={redoStack.current.length ? '#52756F' : '#C9D1CE'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPinned((current) => (current ? 0 : 1))}
                  style={styles.headerIcon}
                  accessibilityLabel={pinned ? 'Unpin note' : 'Pin note'}
                >
                  <Ionicons
                    name={pinned ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={pinned ? '#52756F' : '#687571'}
                  />
                </TouchableOpacity>
                {note?.id ? (
                  <TouchableOpacity
                    onPress={() =>
                      onToggleLock?.({
                        id: note.id,
                        title,
                        content,
                        pinned,
                        noteType,
                        isLocked: note.isLocked ? 0 : 1,
                      })
                    }
                    style={styles.headerIcon}
                    accessibilityLabel={
                      note.isLocked ? 'নোট আনলক করুন' : 'নোট লক করুন'
                    }
                  >
                    <Ionicons
                      name={note.isLocked ? 'lock-closed' : 'lock-open-outline'}
                      size={19}
                      color={note.isLocked ? '#A14F4F' : '#687571'}
                    />
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, !noteType && styles.disabledSaveButton]}
              disabled={!noteType}
            >
              <Ionicons name='checkmark' size={17} color='#FFFFFF' />
              <Text style={styles.saveButtonText}>সেভ</Text>
            </TouchableOpacity>
            {note?.id ? (
              <TouchableOpacity
                onPress={confirmDelete}
                style={styles.headerIcon}
                accessibilityLabel='নোট মুছুন'
              >
                <Ionicons name='trash-outline' size={20} color='#A14F4F' />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {!noteType ? (
          <View style={styles.typePicker}>
            <View style={styles.pickerIcon}>
              <Ionicons name='document-text-outline' size={28} color='#52756F' />
            </View>
            <Text style={styles.pickerTitle}>কী ধরনের নোট লিখবেন?</Text>
            <Text style={styles.pickerDescription}>
              নোট তৈরি হওয়ার পর এর ধরন স্থায়ী থাকবে।
            </Text>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => chooseType('text')}
              activeOpacity={0.75}
            >
              <View style={[styles.optionIcon, styles.textOptionIcon]}>
                <Ionicons name='reader-outline' size={23} color='#52756F' />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Plain text</Text>
                <Text style={styles.optionDescription}>
                  ভাবনা, তথ্য বা বিস্তারিত লিখে রাখুন
                </Text>
              </View>
              <Ionicons name='chevron-forward' size={19} color='#A3AEAA' />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => chooseType('list')}
              activeOpacity={0.75}
            >
              <View style={[styles.optionIcon, styles.listOptionIcon]}>
                <Ionicons name='list' size={23} color='#65708F' />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Numbered list</Text>
                <Text style={styles.optionDescription}>
                  প্রতিটি লাইনে ১, ২, ৩ নম্বর দিয়ে কাজ সাজিয়ে রাখুন
                </Text>
              </View>
              <Ionicons name='chevron-forward' size={19} color='#A3AEAA' />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.titleInput}
              placeholder='শিরোনাম'
              placeholderTextColor='#9AA5A1'
              value={title}
              onChangeText={setTitle}
              multiline
              maxLength={120}
            />
            <View style={styles.titleDivider} />

            {noteType === 'list' ? (
              <ScrollView
                style={styles.listEditor}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
              >
                {listItems.map((item, index) => (
                  <View key={item.id} style={styles.listRow}>
                    <View style={styles.listNumber}>
                      <Text style={styles.listNumberText}>{index + 1}</Text>
                    </View>
                    <TextInput
                      ref={(ref) => {
                        if (ref) listInputRefs.current[item.id] = ref;
                        else delete listInputRefs.current[item.id];
                      }}
                      style={styles.listItemInput}
                      value={item.text}
                      onChangeText={(text) =>
                        updateListItems(
                          listItems.map((current) =>
                            current.id === item.id ? { ...current, text } : current,
                          ),
                        )
                      }
                      onSubmitEditing={() => addListItem(index + 1)}
                      placeholder='একটি item লিখুন'
                      placeholderTextColor='#A3AEAA'
                      returnKeyType='next'
                      blurOnSubmit={false}
                      accessibilityLabel={`List item ${index + 1}`}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        updateListItems(
                          listItems.filter((current) => current.id !== item.id),
                        )
                      }
                      style={styles.removeListItem}
                      accessibilityRole='button'
                      accessibilityLabel={`Item ${index + 1} মুছুন`}
                    >
                      <Ionicons name='close' size={18} color='#A3AEAA' />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addListItem}
                  onPress={() => addListItem(listItems.length)}
                  activeOpacity={0.75}
                >
                  <Ionicons name='add-circle-outline' size={21} color='#52756F' />
                  <Text style={styles.addListItemText}>আরেকটি item যোগ করুন</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <TextInput
                style={styles.contentInput}
                placeholder='আপনার নোট এখানে লিখুন...'
                placeholderTextColor='#A3AEAA'
                multiline
                value={content}
                onChangeText={handleContentChange}
                textAlignVertical='top'
              />
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F6',
    paddingTop: 42,
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#263330',
    fontSize: 16,
    fontWeight: '800',
  },
  headerIcon: {
    minWidth: 36,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8EFEC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  typeBadgeText: {
    color: '#52756F',
    fontSize: 11,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2F4F4F',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    marginLeft: 3,
  },
  disabledSaveButton: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  typePicker: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 55,
  },
  pickerIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#E4ECE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },
  pickerTitle: {
    color: '#1B1B1D',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  pickerDescription: {
    color: '#718181',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 24,
  },
  typeOption: {
    minHeight: 83,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E6ECE9',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 11,
  },
  optionIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textOptionIcon: {
    backgroundColor: '#EAF1ED',
  },
  listOptionIcon: {
    backgroundColor: '#EEF0F6',
  },
  optionCopy: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    color: '#263330',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  optionDescription: {
    color: '#7B8783',
    fontSize: 11,
    lineHeight: 16,
  },
  titleInput: {
    color: '#1B1B1D',
    fontSize: 25,
    fontWeight: '800',
    paddingHorizontal: 22,
    paddingVertical: 14,
    minHeight: 58,
  },
  titleDivider: {
    height: 1,
    backgroundColor: '#E1E7E4',
    marginHorizontal: 20,
    marginBottom: 5,
  },
  contentInput: {
    flex: 1,
    color: '#34413D',
    fontSize: 15,
    lineHeight: 25,
    paddingHorizontal: 22,
    paddingTop: 13,
    paddingBottom: 28,
  },
  listEditor: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 13,
    paddingBottom: 20,
  },
  listRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7ECE9',
    borderRadius: 16,
    paddingHorizontal: 10,
    marginBottom: 9,
  },
  listNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E8EFEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  listNumberText: {
    color: '#52756F',
    fontSize: 12,
    fontWeight: '800',
  },
  listItemInput: {
    flex: 1,
    color: '#34413D',
    fontSize: 14,
    paddingVertical: 13,
  },
  removeListItem: {
    width: 32,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addListItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 5,
    marginTop: 2,
  },
  addListItemText: {
    color: '#52756F',
    fontSize: 13,
    fontWeight: '700',
  },
});
