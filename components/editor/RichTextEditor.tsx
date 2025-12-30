import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { parseContent } from '../../utils/tiptapHelpers';
import { debounce } from '../../utils/helpers';

interface RichTextEditorProps {
  content: string;
  onChange: (json: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
}

export const RichTextEditor = React.memo<RichTextEditorProps>(
  ({ content, onChange, placeholder = 'Start typing...', onEditorReady }) => {
    const [isFocused, setIsFocused] = useState(false);
    const pendingExternalUpdate = useRef<string | null>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          },
          history: {
            depth: 100
          }
        }),
        Underline,
        Placeholder.configure({
          placeholder
        }),
        CharacterCount,
        TaskList,
        TaskItem.configure({
          nested: true,
        })
      ],
      content: parseContent(content),
      editorProps: {
        attributes: {
          class: 'outline-none min-h-[50vh] focus:outline-none'
        }
      },
      onUpdate: debounce(({ editor }) => {
        const json = JSON.stringify(editor.getJSON());
        onChange(json);
      }, 150),
      onFocus: () => {
        setIsFocused(true);
      },
      onBlur: () => {
        setIsFocused(false);
        // Apply pending external update after losing focus
        if (pendingExternalUpdate.current && editor) {
          const parsedContent = parseContent(pendingExternalUpdate.current);
          editor.commands.setContent(parsedContent);
          pendingExternalUpdate.current = null;
        }
      }
    });

    // Notify parent when editor is ready
    useEffect(() => {
      if (editor && onEditorReady) {
        onEditorReady(editor);
      }
    }, [editor, onEditorReady]);

    // Update content when it changes externally (but not while user is typing)
    useEffect(() => {
      if (!editor) return;

      const currentContent = JSON.stringify(editor.getJSON());
      if (content === currentContent) return; // No change needed

      if (isFocused) {
        // User is actively editing - queue the external update for later
        pendingExternalUpdate.current = content;
      } else {
        // Not focused - safe to apply external update immediately
        const parsedContent = parseContent(content);
        editor.commands.setContent(parsedContent);
      }
    }, [content, editor, isFocused]);

    if (!editor) {
      return null;
    }

    return (
      <div className="w-full">
        <EditorContent
          editor={editor}
          className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 text-sm md:text-base leading-relaxed"
        />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
