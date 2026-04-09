import { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';

export interface RichQuestionStemEditorProps {
  html: string;
  onHtmlChange: (html: string) => void;
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function insertStemImage(
  file: File,
  editor: Editor,
  onError: (message: string) => void,
) {
  if (!file.type.startsWith('image/')) {
    onError('Lütfen bir görsel dosyası seçin.');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    onError("Görsel boyutu 5 MB'dan küçük olmalıdır.");
    return;
  }

  try {
    const base64 = await fileToBase64(file);
    editor.chain().focus().setImage({ src: base64 }).run();
  } catch (error) {
    console.error('Error loading image:', error);
    onError('Görsel yüklenirken bir hata oluştu.');
  }
}

export function RichQuestionStemEditor({ html, onHtmlChange }: RichQuestionStemEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stemImageError, setStemImageError] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const stemErrorReporterRef = useRef<(msg: string) => void>(() => {});
  stemErrorReporterRef.current = (message: string) => setStemImageError(message);

  useEffect(() => {
    if (!stemImageError) return;
    const id = window.setTimeout(() => setStemImageError(null), 6000);
    return () => window.clearTimeout(id);
  }, [stemImageError]);

  const editor = useEditor({
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
    },
    onDestroy: () => {
      editorRef.current = null;
    },
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'İçeriğinizi buraya yazın...',
      }),
    ],
    content: html ?? '',
    onUpdate: ({ editor }) => {
      onHtmlChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] max-h-[400px] overflow-y-auto px-4 py-3 text-sm leading-relaxed',
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            const ed = editorRef.current;
            if (ed) void insertStemImage(file, ed, (m) => stemErrorReporterRef.current(m));
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event, _slice) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              const ed = editorRef.current;
              if (file && ed) void insertStemImage(file, ed, (m) => stemErrorReporterRef.current(m));
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && html !== editor.getHTML()) {
      editor.commands.setContent(html ?? '');
    }
  }, [html, editor]);

  // Add drag & drop handlers to editor container
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer?.files[0];
      const ed = editorRef.current;
      if (file && file.type.startsWith('image/') && ed) {
        await insertStemImage(file, ed, (m) => stemErrorReporterRef.current(m));
      }
    };

    editorElement.addEventListener('dragover', handleDragOver);
    editorElement.addEventListener('dragleave', handleDragLeave);
    editorElement.addEventListener('drop', handleDrop);

    return () => {
      editorElement.removeEventListener('dragover', handleDragOver);
      editorElement.removeEventListener('dragleave', handleDragLeave);
      editorElement.removeEventListener('drop', handleDrop);
    };
  }, [editor]);

  if (!editor) {
    return <div className="h-48 bg-base-200/30 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-5">
      {stemImageError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-base-content/80"
        >
          <span>{stemImageError}</span>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1 text-base-content/50 hover:bg-base-200/80 hover:text-base-content"
            onClick={() => setStemImageError(null)}
            aria-label="Kapat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
      {/* Rich Text Editor */}
      <div>
        <p className="text-sm font-medium text-base-content/60 mb-2">İçerik Düzenleyici</p>
        <p className="text-xs text-base-content/40 mb-3">
          Katılımcıya gösterilecek zengin metin içeriğini düzenleyin
        </p>

        {/* Tiptap Editor */}
        <div className={`rounded-xl border-2 overflow-hidden bg-base-100 transition-all duration-200 ${
          isDragging ? 'border-primary/60 border-dashed bg-primary/5' : 'border-base-300/60'
        }`}>
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b-2 border-base-300/60 bg-base-200/40 flex-wrap">
            {/* Headings */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-2.5 py-1.5 rounded-lg transition-colors text-xs font-bold ${
                editor.isActive('heading', { level: 1 })
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Başlık 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-2.5 py-1.5 rounded-lg transition-colors text-xs font-bold ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Başlık 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-2.5 py-1.5 rounded-lg transition-colors text-xs font-bold ${
                editor.isActive('heading', { level: 3 })
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Başlık 3"
            >
              H3
            </button>

            <div className="w-px h-5 bg-base-300/60 mx-1" />

            {/* Text formatting */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('bold')
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Kalın"
            >
              <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">B</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('italic')
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="İtalik"
            >
              <span className="text-xs italic w-5 h-5 flex items-center justify-center">I</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('underline')
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Altı Çizili"
            >
              <span className="text-xs underline w-5 h-5 flex items-center justify-center">U</span>
            </button>

            <div className="w-px h-5 bg-base-300/60 mx-1" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('bulletList')
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Madde İşareti"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('orderedList')
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Numaralı Liste"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
                <path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
              </svg>
            </button>

            <div className="w-px h-5 bg-base-300/60 mx-1" />

            {/* Alignment */}
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive({ textAlign: 'left' })
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Sola Hizala"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="21" y1="10" x2="7" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="21" y1="18" x2="7" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive({ textAlign: 'center' })
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Ortala"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="10" x2="6" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="18" y1="18" x2="6" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive({ textAlign: 'right' })
                  ? 'bg-primary/15 text-primary'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
              }`}
              title="Sağa Hizala"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="21" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="21" y1="18" x2="3" y2="18" />
              </svg>
            </button>

            <div className="w-px h-5 bg-base-300/60 mx-1" />

            {/* Image */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                const ed = editorRef.current;
                if (file && ed) {
                  void insertStemImage(file, ed, (m) => stemErrorReporterRef.current(m));
                }
                // Reset input
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg transition-colors text-base-content/50 hover:bg-base-200 hover:text-base-content/70"
              title="Görsel Ekle (Dosya seç, sürükle-bırak veya yapıştır)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </button>
          </div>

          {/* Editor Content */}
          <EditorContent editor={editor} />
        </div>
      </div>

    </div>
  );
}
