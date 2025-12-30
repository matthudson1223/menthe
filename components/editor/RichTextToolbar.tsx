import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  ListTodo,
  Undo2,
  Redo2,
  ChevronDown
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface RichTextToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  onClick,
  active = false,
  disabled = false,
  title
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        active
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
      } ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

interface HeadingDropdownProps {
  editor: Editor | null;
}

const HeadingDropdown: React.FC<HeadingDropdownProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const getCurrentLevel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    return 'Paragraph';
  };

  const setHeading = (level: number | null) => {
    if (level === null) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
      >
        <span className="min-w-[70px] text-left">{getCurrentLevel()}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 min-w-[140px]">
          <button
            onClick={() => setHeading(null)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 first:rounded-t-lg"
          >
            Paragraph
          </button>
          <button
            onClick={() => setHeading(1)}
            className="w-full px-4 py-2 text-left text-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Heading 1
          </button>
          <button
            onClick={() => setHeading(2)}
            className="w-full px-4 py-2 text-left text-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Heading 2
          </button>
          <button
            onClick={() => setHeading(3)}
            className="w-full px-4 py-2 text-left text-base font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 last:rounded-b-lg"
          >
            Heading 3
          </button>
        </div>
      )}
    </div>
  );
};

export const RichTextToolbar = React.memo<RichTextToolbarProps>(({ editor }) => {
  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4 mb-4 border-b border-slate-200 dark:border-slate-700">
      {/* Format buttons */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={Bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Bold (Cmd+B)"
        />
        <ToolbarButton
          icon={Italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Italic (Cmd+I)"
        />
        <ToolbarButton
          icon={UnderlineIcon}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          title="Underline (Cmd+U)"
        />
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

      {/* List buttons */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={List}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
          title="Bullet List"
        />
        <ToolbarButton
          icon={ListOrdered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        />
        <ToolbarButton
          icon={ListTodo}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive('taskList')}
          disabled={!editor.can().chain().focus().toggleTaskList().run()}
          title="Task List"
        />
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

      {/* Heading dropdown */}
      <HeadingDropdown editor={editor} />

      {/* Separator */}
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={Undo2}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Cmd+Z)"
        />
        <ToolbarButton
          icon={Redo2}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Cmd+Shift+Z)"
        />
      </div>

      {/* Stats - pushed to the right on larger screens */}
      <div className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-mono">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}, {characterCount}{' '}
        {characterCount === 1 ? 'char' : 'chars'}
      </div>
    </div>
  );
});

RichTextToolbar.displayName = 'RichTextToolbar';
