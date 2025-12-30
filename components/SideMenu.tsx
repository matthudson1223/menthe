import React, { useState, useMemo } from 'react';
import { Menu, X, Tag, FolderOpen, LogOut, ChevronRight, FileText } from 'lucide-react';
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

  // Get all unique tags from notes and count notes per tag
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

  // Count notes without tags
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
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        aria-label="Open menu"
        title="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Note Groups
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* All Notes */}
          <button
            onClick={() => handleGroupClick(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-2 ${
              selectedGroup === null
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderOpen size={18} />
            <span className="flex-1 text-left font-medium">All Notes</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {notes.notes.length}
            </span>
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-slate-200 dark:border-slate-700" />

          {/* Tag Groups */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
              Tags
            </p>

            {tagGroups.length === 0 && untaggedCount === notes.notes.length ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 px-3 py-2">
                No tags yet. Add tags to your notes to organize them into groups.
              </p>
            ) : (
              <>
                {tagGroups.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => handleGroupClick(tag)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      selectedGroup === tag
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Tag size={16} />
                    <span className="flex-1 text-left truncate">{tag}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {count}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                ))}

                {/* Untagged notes */}
                {untaggedCount > 0 && (
                  <button
                    onClick={() => handleGroupClick('__untagged__')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      selectedGroup === '__untagged__'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText size={16} />
                    <span className="flex-1 text-left text-slate-500 dark:text-slate-400 italic">
                      Untagged
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {untaggedCount}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer - Sign Out */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {user && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
              Signed in as {user.email}
            </p>
          )}
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title="Sign out"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to sign out? Your notes are saved and will be here when you return.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSignOutConfirm(false)}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
