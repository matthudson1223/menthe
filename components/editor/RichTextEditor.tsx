import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
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
        CharacterCount
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
      }, 300)
    });

    // Notify parent when editor is ready
    useEffect(() => {
      if (editor && onEditorReady) {
        onEditorReady(editor);
      }
    }, [editor, onEditorReady]);

    // Update content when it changes externally
    useEffect(() => {
      if (editor && content !== JSON.stringify(editor.getJSON())) {
        const parsedContent = parseContent(content);
        editor.commands.setContent(parsedContent);
      }
    }, [content, editor]);

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
