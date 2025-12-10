import React, { useState } from 'react';
import { X, Plus, Edit2, Check } from 'lucide-react';
import { Note } from '../types';
import { useNoteTags } from '../hooks';

interface TagManagerProps {
  note: Note | null;
  updateNote: (id: string, updates: Partial<Note>) => void;
  readOnly?: boolean;
}

export const TagManager: React.FC<TagManagerProps> = ({
  note,
  updateNote,
  readOnly = false,
}) => {
  const { addTag, removeTag, editTag } = useNoteTags(note, updateNote);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!note) return null;

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag);
      setNewTag('');
    }
  };

  const handleEditTag = (oldTag: string) => {
    setEditingTag(oldTag);
    setEditValue(oldTag);
  };

  const handleSaveEdit = (oldTag: string) => {
    if (editValue.trim() && editValue !== oldTag) {
      editTag(oldTag, editValue);
    }
    setEditingTag(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter') {
      callback();
    } else if (e.key === 'Escape') {
      setEditingTag(null);
      setEditValue('');
    }
  };

  const tags = note.tags || [];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
          Tags
        </label>

        {/* Tags Display */}
        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
          {tags.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No tags yet</p>
          ) : (
            tags.map(tag => (
              <div
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {editingTag === tag ? (
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => handleKeyPress(e, () => handleSaveEdit(tag))}
                    onBlur={() => handleSaveEdit(tag)}
                    className="bg-transparent outline-none max-w-[100px] font-medium"
                    disabled={readOnly}
                  />
                ) : (
                  <>
                    <span className="font-medium">{tag}</span>
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => handleEditTag(tag)}
                          className="hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                          title="Edit tag"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-600 dark:hover:text-red-300 transition-colors"
                          title="Remove tag"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Tag Input */}
        {!readOnly && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddTag()}
              placeholder="Add a tag (e.g., work, ai, important)..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus size={18} />
            </button>
          </div>
        )}

        {/* Tag count info */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {tags.length} / 10 tags
        </p>
      </div>
    </div>
  );
};
