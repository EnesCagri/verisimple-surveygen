import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import type { QuestionSettings } from '../../types/survey';

interface RichTextSettingsProps {
  settings: QuestionSettings;
  onChange: (settings: QuestionSettings) => void;
}

const MAX_RESPONSE_LENGTH = 10000;

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to handle image files
async function handleImageFile(file: File, editor: any) {
  if (!file.type.startsWith('image/')) {
    alert('Lütfen bir görsel dosyası seçin.');
    return;
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Görsel boyutu 5MB\'dan küçük olmalıdır.');
    return;
  }

  try {
    const base64 = await fileToBase64(file);
    editor.chain().focus().setImage({ src: base64 }).run();
  } catch (error) {
    console.error('Error loading image:', error);
    alert('Görsel yüklenirken bir hata oluştu.');
  }
}

export function RichTextSettings({ settings, onChange }: RichTextSettingsProps) {
  const [hasResponse, setHasResponse] = useState(settings.hasResponse ?? false);
  const [responseMaxLength, setResponseMaxLength] = useState(settings.responseMaxLength ?? 2000);
  const [responsePlaceholder, setResponsePlaceholder] = useState(settings.responsePlaceholder ?? 'Cevabınızı yazın...');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
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
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'İçeriğinizi buraya yazın...',
      }),
    ],
    content: settings.richContent ?? '',
    onUpdate: ({ editor }) => {
      onChange({ ...settings, richContent: editor.getHTML() });
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
            handleImageFile(file, editor);
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
              if (file) {
                handleImageFile(file, editor);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  });

  const handleResponseToggle = (enabled: boolean) => {
    setHasResponse(enabled);
    onChange({ ...settings, hasResponse: enabled });
  };

  const handleMaxLengthChange = (val: number) => {
    const clamped = Math.min(Math.max(val, 50), MAX_RESPONSE_LENGTH);
    setResponseMaxLength(clamped);
    onChange({ ...settings, responseMaxLength: clamped });
  };

  const handlePlaceholderChange = (val: string) => {
    setResponsePlaceholder(val);
    onChange({ ...settings, responsePlaceholder: val });
  };

  // Update editor content when settings.richContent changes externally
  useEffect(() => {
    if (editor && settings.richContent !== editor.getHTML()) {
      editor.commands.setContent(settings.richContent ?? '');
    }
  }, [settings.richContent, editor]);

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
      if (file && file.type.startsWith('image/')) {
        await handleImageFile(file, editor);
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

  // Close link input when clicking outside
  useEffect(() => {
    if (!showLinkInput) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.link-input-container')) {
        setShowLinkInput(false);
        setLinkUrl('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLinkInput]);

  if (!editor) {
    return <div className="h-48 bg-base-200/30 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-5">
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

            {/* Image and Link */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && editor) {
                  handleImageFile(file, editor);
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
            <div className="relative link-input-container">
              <button
                type="button"
                onClick={() => {
                  const previousUrl = editor.getAttributes('link').href;
                  if (previousUrl) {
                    // If link exists, remove it
                    editor.chain().focus().extendMarkRange('link').unsetLink().run();
                    setShowLinkInput(false);
                    setLinkUrl('');
                  } else {
                    // If no link, show input
                    setLinkUrl('');
                    setShowLinkInput(true);
                    // Focus input after state update
                    setTimeout(() => linkInputRef.current?.focus(), 0);
                  }
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  editor.isActive('link')
                    ? 'bg-primary/15 text-primary'
                    : 'text-base-content/50 hover:bg-base-200 hover:text-base-content/70'
                }`}
                title={editor.isActive('link') ? 'Bağlantıyı Kaldır' : 'Bağlantı Ekle'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
              
              {/* Link Input Popup */}
              {showLinkInput && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-base-100 border-2 border-base-300/60 rounded-xl shadow-lg z-50 min-w-[300px]">
                  <div className="flex items-center gap-2">
                    <input
                      ref={linkInputRef}
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (linkUrl.trim()) {
                            // Ensure URL has protocol
                            let url = linkUrl.trim();
                            if (!url.match(/^https?:\/\//)) {
                              url = 'https://' + url;
                            }
                            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                            setShowLinkInput(false);
                            setLinkUrl('');
                            editor.commands.focus();
                          }
                        } else if (e.key === 'Escape') {
                          setShowLinkInput(false);
                          setLinkUrl('');
                          editor.commands.focus();
                        }
                      }}
                      placeholder="https://example.com veya yapıştırın"
                      className="input input-sm input-bordered flex-1 rounded-lg text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (linkUrl.trim()) {
                          // Ensure URL has protocol
                          let url = linkUrl.trim();
                          if (!url.match(/^https?:\/\//)) {
                            url = 'https://' + url;
                          }
                          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                          setShowLinkInput(false);
                          setLinkUrl('');
                          editor.commands.focus();
                        }
                      }}
                      className="btn btn-sm btn-primary rounded-lg px-3"
                      title="Ekle (Enter)"
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLinkInput(false);
                        setLinkUrl('');
                        editor.commands.focus();
                      }}
                      className="btn btn-sm btn-ghost rounded-lg px-2"
                      title="İptal (Esc)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-base-content/40 mt-2">
                    Metni seçin, bağlantı butonuna tıklayın ve URL'yi girin/yapıştırın
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Editor Content */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-base-300/30" />

      {/* Response toggle */}
      <div
        className={`
          flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
          ${hasResponse ? 'border-primary/40 bg-primary/5' : 'border-base-300/40 bg-base-200/30'}
        `}
        onClick={() => handleResponseToggle(!hasResponse)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-base-content/80">Yanıt Alanı</p>
            {hasResponse && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                Aktif
              </span>
            )}
          </div>
          <p className="text-xs text-base-content/50">
            {hasResponse
              ? 'Katılımcılar bu içeriğe yanıt verebilir'
              : 'Sadece bilgilendirme — yanıt alanı yok'}
          </p>
        </div>

        <div className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${hasResponse ? 'bg-primary' : 'bg-base-300'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${hasResponse ? 'left-7' : 'left-1'}`} />
        </div>
      </div>

      {/* Response settings (shown when hasResponse is true) */}
      {hasResponse && (
        <div className="space-y-4 pl-2 border-l-2 border-primary/20">
          <div>
            <label className="text-xs font-medium text-base-content/60 mb-1 block">Maksimum karakter</label>
            <input
              type="number"
              className="input input-bordered input-sm w-full max-w-[180px] rounded-lg"
              min={50}
              max={MAX_RESPONSE_LENGTH}
              value={responseMaxLength}
              onChange={(e) => handleMaxLengthChange(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-base-content/60 mb-1 block">Placeholder</label>
            <input
              type="text"
              className="input input-bordered input-sm w-full rounded-lg"
              value={responsePlaceholder}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              placeholder="Cevabınızı yazın..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
