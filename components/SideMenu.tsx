import React, { useState, useMemo } from 'react';
import { Menu, X, Tag, FolderOpen, LogOut, FileText } from 'lucide-react';
import { useNotesContext } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from './ui';

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
  const { notes } = useNotesContext();
  const { signOut, user } = useAuth();

  const tagGroups = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    notes.notes.forEach(note => {
      if (note.tags && note.tags.length > 0) {
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
    return notes.notes.filter(note => !note.tags || note.tags.length === 0).length;
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
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
            <span className="text-xs text-slate-400">{notes.notes.length}</span>
          </button>

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
                  onClick={() => handleGroupClick('__untagged__')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedGroup === '__untagged__'
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
    </>
  );
};
