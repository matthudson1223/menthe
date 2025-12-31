import React, { useState, useMemo } from 'react';
import { Menu, X, Tag, FolderOpen, LogOut, FileText, Trash2, Folder, Plus, MoreVertical, Edit2, Trash } from 'lucide-react';
import { useNotesContext } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from './ui';
import { FILTER_UNTAGGED, FILTER_TRASH } from '../constants';

interface SideMenuProps {
  selectedGroup: string | null;
  onGroupSelect: (group: string | null) => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  selectedGroup,
  onGroupSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
  const { notes, folders } = useNotesContext();
  const { signOut, user } = useAuth();

  const tagGroups = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    notes.notes.forEach(note => {
      // Exclude deleted notes from tag counts
      if (!note.deletedAt && note.tags && note.tags.length > 0) {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [notes.notes]);

  const untaggedCount = useMemo(() => {
    return notes.notes.filter(note => !note.deletedAt && (!note.tags || note.tags.length === 0)).length;
  }, [notes.notes]);

  const trashedCount = useMemo(() => {
    return notes.notes.filter(note => note.deletedAt).length;
  }, [notes.notes]);

  const activeNotesCount = useMemo(() => {
    return notes.notes.filter(note => !note.deletedAt).length;
  }, [notes.notes]);

  const handleGroupClick = (group: string | null) => {
    onGroupSelect(group);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    setIsOpen(false);
    await signOut();
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      folders.createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  const handleRenameFolder = (folderId: string) => {
    if (editingFolderName.trim()) {
      folders.renameFolder(folderId, editingFolderName.trim());
      setEditingFolderId(null);
      setEditingFolderName('');
      setFolderMenuOpen(null);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm('Delete this folder? Notes in this folder will not be deleted.')) {
      folders.deleteFolder(folderId);
      // Also remove folderId from any notes that have it
      notes.notes.forEach(note => {
        if (note.folderId === folderId) {
          notes.updateNote(note.id, { folderId: undefined });
        }
      });
      setFolderMenuOpen(null);
      // If we're viewing this folder, switch to all notes
      if (selectedGroup === `folder:${folderId}`) {
        onGroupSelect(null);
      }
    }
  };

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.notes.forEach(note => {
      if (!note.deletedAt && note.folderId) {
        counts[note.folderId] = (counts[note.folderId] || 0) + 1;
      }
    });
    return counts;
  }, [notes.notes]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 shadow-xl z-50 transform transition-transform duration-200 ease-out flex flex-col border-r border-slate-200 dark:border-slate-800 lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Notes</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => handleGroupClick(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedGroup === null
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FolderOpen size={15} />
            <span className="flex-1 text-left">All Notes</span>
            <span className="text-xs text-slate-400">{activeNotesCount}</span>
          </button>

          <button
            onClick={() => handleGroupClick(FILTER_TRASH)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedGroup === FILTER_TRASH
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Trash2 size={15} />
            <span className="flex-1 text-left">Trash</span>
            <span className="text-xs text-slate-400">{trashedCount}</span>
          </button>

          {/* Folders Section */}
          <div className="mt-4 mb-2 px-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Folders</span>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              aria-label="Create folder"
            >
              <Plus size={14} />
            </button>
          </div>

          {folders.folders.map(folder => (
            <div key={folder.id} className="relative group">
              <button
                onClick={() => handleGroupClick(`folder:${folder.id}`)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedGroup === `folder:${folder.id}`
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Folder size={14} />
                <span className="flex-1 text-left truncate">{folder.name}</span>
                <span className="text-xs text-slate-400">{folderCounts[folder.id] || 0}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderMenuOpen(folderMenuOpen === folder.id ? null : folder.id);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all"
              >
                <MoreVertical size={14} />
              </button>
              {folderMenuOpen === folder.id && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
                  <button
                    onClick={() => {
                      setEditingFolderId(folder.id);
                      setEditingFolderName(folder.name);
                      setFolderMenuOpen(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Edit2 size={13} />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {tagGroups.length > 0 && (
            <>
              <div className="mt-4 mb-2 px-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tags</span>
              </div>

              {tagGroups.map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => handleGroupClick(tag)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedGroup === tag
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Tag size={14} />
                  <span className="flex-1 text-left truncate">{tag}</span>
                  <span className="text-xs text-slate-400">{count}</span>
                </button>
              ))}

              {untaggedCount > 0 && (
                <button
                  onClick={() => handleGroupClick(FILTER_UNTAGGED)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedGroup === FILTER_UNTAGGED
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText size={14} />
                  <span className="flex-1 text-left italic">Untagged</span>
                  <span className="text-xs text-slate-400">{untaggedCount}</span>
                </button>
              )}
            </>
          )}

          {tagGroups.length === 0 && (
            <p className="text-xs text-slate-400 px-3 py-4">
              Add tags to organize notes
            </p>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          {user && (
            <p className="text-xs text-slate-400 mb-2 truncate px-1">{user.email}</p>
          )}
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      <Modal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title="Sign out"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sign out of your account? Your notes will be saved.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowSignOutConfirm(false)}
              className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateFolder}
        onClose={() => {
          setShowCreateFolder(false);
          setNewFolderName('');
        }}
        title="Create Folder"
        size="sm"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowCreateFolder(false);
                setNewFolderName('');
              }}
              className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editingFolderId !== null}
        onClose={() => {
          setEditingFolderId(null);
          setEditingFolderName('');
        }}
        title="Rename Folder"
        size="sm"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Folder name"
            value={editingFolderName}
            onChange={(e) => setEditingFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && editingFolderId && handleRenameFolder(editingFolderId)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setEditingFolderId(null);
                setEditingFolderName('');
              }}
              className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => editingFolderId && handleRenameFolder(editingFolderId)}
              disabled={!editingFolderName.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rename
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
