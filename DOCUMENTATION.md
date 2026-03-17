# SurvEngine - Kapsamlı Proje Dokümantasyonu

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Proje Yapısı](#proje-yapısı)
3. [Teknoloji Stack](#teknoloji-stack)
4. [Tip Tanımları](#tip-tanımları)
5. [Hooks](#hooks)
6. [Utils (Yardımcı Fonksiyonlar)](#utils-yardımcı-fonksiyonlar)
7. [Components](#components)
8. [AI Entegrasyonu](#ai-entegrasyonu)
9. [Koşullu Akış Sistemi](#koşullu-akış-sistemi)
10. [Önizleme Sistemi](#önizleme-sistemi)

---

## Genel Bakış

**SurvEngine**, SurveySparrow benzeri modern bir anket oluşturma uygulamasıdır. Kullanıcılar doğal dilde AI asistanı ile veya manuel olarak anketler oluşturabilir, sorular ekleyebilir, koşullu akışlar tanımlayabilir ve anketleri adım adım önizleyebilir.

### Temel Özellikler

- ✅ 5 farklı soru tipi (Tek Seçim, Çoklu Seçim, Metin Girişi, Derecelendirme, Matrix Likert)
- ✅ Koşullu akış yönetimi (soru atlama, anketi bitirme)
- ✅ Görsel akış diyagramı (xyflow ile)
- ✅ AI asistanı ile doğal dilde anket oluşturma (Gemini 3.1 Flash-Lite)
- ✅ Adım adım önizleme modu
- ✅ Canlı akış paneli (hangi soruda olduğunu gösterir)
- ✅ JSON export
- ✅ Drag & drop ile soru sıralama

---

## Proje Yapısı

```
survengine/
├── src/
│   ├── main.tsx                 # React uygulamasının giriş noktası
│   ├── App.tsx                  # Ana uygulama komponenti (routing)
│   ├── index.css                # Global stiller ve Tailwind konfigürasyonu
│   │
│   ├── types/
│   │   └── survey.ts            # Tüm TypeScript tip tanımları
│   │
│   ├── hooks/
│   │   ├── useSurvey.ts         # Tek bir anketin state yönetimi
│   │   ├── useSurveyStore.ts   # Anket koleksiyonu yönetimi (dashboard)
│   │   ├── usePreview.ts        # Önizleme modu state yönetimi
│   │   └── useAIChat.ts         # AI chat state ve API çağrıları
│   │
│   ├── utils/
│   │   ├── id.ts                # UUID generator
│   │   ├── question.ts          # Soru oluşturma yardımcıları
│   │   ├── condition.ts         # Koşul değerlendirme ve operatörler
│   │   ├── questionTypeInfo.ts  # Soru tipi etiketleri ve açıklamaları
│   │   ├── demoSurvey.ts        # Demo anket oluşturucu
│   │   ├── aiPrompt.ts          # Gemini için system prompt builder
│   │   └── aiActions.ts         # AI action'larını useSurvey'e map eden utility
│   │
│   └── components/
│       ├── layout/              # Layout komponentleri
│       ├── dashboard/           # Dashboard sayfası
│       ├── builder/              # Builder sayfası
│       ├── editor/               # Soru editör komponentleri
│       ├── sidebar/              # Sidebar ve liste komponentleri
│       ├── flow/                 # xyflow diyagram komponentleri
│       ├── preview/              # Önizleme modu komponentleri
│       ├── modals/               # Modal dialoglar
│       ├── ai/                   # AI chat paneli
│       └── ui/                   # Genel UI komponentleri (Tooltip)
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env                          # Gemini API key (VITE_GEMINI_API_KEY)
```

---

## Teknoloji Stack

### Core
- **React 19.2.0** - UI framework
- **TypeScript 5.9.3** - Type safety
- **Vite 7.3.1** - Build tool ve dev server

### Styling
- **Tailwind CSS 4.2.1** - Utility-first CSS framework
- **DaisyUI 5.5.19** - Tailwind component library
- **Custom theme** - Primary color: `#9381ff` (oklch(65% 0.19 281))

### Libraries
- **@xyflow/react 12.10.1** - Flow diagram (koşullu akış görselleştirme)
- **@dnd-kit/react 0.3.2** - Drag & drop (soru sıralama)
- **@google/generative-ai 0.24.1** - Gemini API entegrasyonu

---

## Tip Tanımları

### `src/types/survey.ts`

Bu dosya tüm uygulamanın tip tanımlarını içerir.

#### `QuestionType` Enum
```typescript
enum QuestionType {
  SingleChoice = 1,    // Tek seçim (radio buttons)
  MultipleChoice = 2,  // Çoklu seçim (checkboxes)
  TextEntry = 3,       // Metin girişi (textarea)
  MatrixLikert = 5,    // Matrix Likert (satır x sütun)
  Rating = 7,          // Derecelendirme (yıldızlar)
}
```

#### `Question` Interface
```typescript
interface Question {
  order: number;           // Soru sırası (1-based)
  text: string;           // Soru metni
  type: QuestionType;     // Soru tipi
  answers: string[];      // Seçenekler (Choice için), boş (diğerleri için)
  guid: string;           // Unique identifier
  settings?: QuestionSettings; // Tip bazlı ayarlar
}
```

#### `QuestionSettings` Interface
Tip bazlı ayarlar:
- **TextEntry**: `maxLength`, `placeholder`
- **Rating**: `ratingCount`, `ratingLabels: { low, high }`
- **MatrixLikert**: `rows[]`, `columns[]`, `matrixType: 'single' | 'multiple'`

#### `ConditionalRule` Interface
```typescript
interface ConditionalRule {
  id: string;
  sourceQuestionId: string;  // Hangi sorudan çıkıyor
  answer: string;            // Karşılaştırma değeri
  action: ConditionAction;    // Ne yapılacak
  operator?: ConditionOperator; // Operatör (equals, gt, contains, vb.)
  rowIndex?: number;          // MatrixLikert için satır indexi
}
```

#### `ConditionAction` Type
```typescript
type ConditionAction =
  | { type: 'jump_to'; targetQuestionId: string }
  | { type: 'end_survey' };
```

#### `ConditionOperator` Type
Soru tipine göre farklı operatörler:
- **Choice**: `equals`, `any`
- **Rating**: `eq`, `gt`, `gte`, `lt`, `lte`, `any`
- **TextEntry**: `contains`, `not_contains`, `exact`, `is_empty`, `is_not_empty`, `any`
- **MatrixLikert**: `row_equals`, `any`

#### `Survey` Interface
```typescript
interface Survey {
  id: string;
  title: string;
  questions: Question[];
  conditions: ConditionalRule[];
  nodePositions?: NodePositions; // xyflow node pozisyonları
  createdAt: string;
  updatedAt: string;
}
```

---

## Hooks

### `useSurvey` (`src/hooks/useSurvey.ts`)

Tek bir anketin state'ini yönetir. Builder sayfasında kullanılır.

**Fonksiyonlar:**
- `addQuestion()` - Yeni soru ekle (varsayılan tip: SingleChoice)
- `addQuestionWithData(question)` - Hazır Question objesi ekle (AI için)
- `updateQuestion(guid, updates)` - Soru güncelle
- `deleteQuestion(guid)` - Soru sil (ilişkili koşulları da temizler)
- `reorderQuestions(questions)` - Soruları yeniden sırala
- `selectQuestion(guid)` - Soruyu seç (editörde göster)
- `addCondition(sourceId, input)` - Koşul ekle
- `updateCondition(id, input)` - Koşul güncelle
- `removeCondition(id)` - Koşul sil
- `replaceAll(title, questions, conditions)` - Tüm anketi değiştir (AI için)
- `updateNodePositions(positions)` - xyflow node pozisyonlarını kaydet
- `toJSON()` - Anketi JSON string'e çevir

**State:**
- `title`, `questions`, `conditions`, `nodePositions`
- `selectedId`, `selectedQuestion`

---

### `useSurveyStore` (`src/hooks/useSurveyStore.ts`)

Anket koleksiyonunu yönetir (dashboard seviyesi). `localStorage` kullanmaz, sadece memory'de tutar.

**Fonksiyonlar:**
- `createSurvey()` - Yeni boş anket oluştur
- `createDemoSurvey()` - Demo anket oluştur (8 soru + 2 koşul)
- `updateSurvey(id, updates)` - Anketi güncelle
- `deleteSurvey(id)` - Anketi sil
- `getSurvey(id)` - Anketi getir

**State:**
- `surveys: Survey[]`

---

### `usePreview` (`src/hooks/usePreview.ts`)

Önizleme modunun state'ini yönetir. Koşullu akış mantığını çalıştırır.

**Answer Stores:**
- `answers: Record<guid, string[]>` - Choice cevapları
- `textAnswers: Record<guid, string>` - TextEntry cevapları
- `ratingAnswers: Record<guid, number>` - Rating cevapları (1-based, 0 = none)
- `matrixAnswers: Record<guid, Record<rowIndex, string[]>>` - MatrixLikert cevapları

**Navigation Logic:**
1. Kullanıcı "İleri" tıkladığında, mevcut soru için tüm koşulları değerlendir
2. Eşleşen koşul varsa:
   - `end_survey` → Anketi bitir
   - `jump_to` → Hedef soruya git
3. Eşleşen koşul yoksa → Sıradaki soruya git

**Fonksiyonlar:**
- `goNext()` - Sonraki soruya git (koşullu mantık ile)
- `goPrev()` - Önceki soruya git
- `selectAnswer(guid, answer, isMultiple)` - Choice cevabı seç/kaldır
- `setTextAnswer(guid, text)` - TextEntry cevabı ayarla
- `setRatingAnswer(guid, value)` - Rating cevabı ayarla
- `setMatrixAnswer(guid, rowIndex, column, isMultiple)` - MatrixLikert cevabı ayarla
- `reset()` - Tüm cevapları temizle, başa dön

**Computed:**
- `currentQuestion`, `currentStep`, `totalSteps`, `progress`
- `isFirst`, `isLast`, `isCompleted`

---

### `useAIChat` (`src/hooks/useAIChat.ts`)

AI chat state'ini ve Gemini API çağrılarını yönetir.

**State:**
- `messages: ChatMessage[]` - Chat geçmişi
- `isLoading: boolean` - API çağrısı devam ediyor mu
- `error: string | null` - Hata mesajı

**Fonksiyonlar:**
- `sendMessage(userMessage)` - Kullanıcı mesajını gönder, Gemini'den yanıt al, action'ları uygula
- `clearMessages()` - Chat geçmişini temizle

**İşleyiş:**
1. System prompt oluştur (`buildSystemPrompt`)
2. Gemini API'ye istek gönder (`gemini-3.1-flash-lite-preview`, JSON çıktı)
3. Yanıtı parse et (`parseAIResponse`)
4. Action'ları uygula (`executeAIActions`)
5. Sonucu chat mesajı olarak ekle

**ChatMessage Interface:**
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  appliedCount?: number;  // Kaç action uygulandı (AI mesajları için)
  errors?: string[];       // Hata mesajları (varsa)
  timestamp: number;
}
```

---

## Utils (Yardımcı Fonksiyonlar)

### `src/utils/id.ts`
```typescript
export function generateId(): string
```
`crypto.randomUUID()` kullanarak unique ID üretir.

---

### `src/utils/question.ts`

Soru oluşturma ve tip değiştirme yardımcıları.

**Fonksiyonlar:**
- `createQuestion(order, type?)` - Varsayılanlarla yeni soru oluştur
- `getDefaultsForType(type)` - Tip için varsayılan `answers` ve `settings` döndür

**Varsayılanlar:**
- **TextEntry**: `maxLength: 1250`, `placeholder: ''`
- **Rating**: `ratingCount: 5`, `ratingLabels: { low: 'Çok Kötü', high: 'Çok İyi' }`
- **MatrixLikert**: 1 boş satır, 5 sütun (Kesinlikle Katılmıyorum → Kesinlikle Katılıyorum), `matrixType: 'single'`

---

### `src/utils/condition.ts`

Koşul değerlendirme ve operatör yardımcıları.

**Fonksiyonlar:**
- `operatorLabel(op)` - Operatör için insan okunabilir etiket döndür
- `operatorsForType(type)` - Soru tipi için geçerli operatörleri döndür
- `operatorNeedsValue(op)` - Operatör değer gerektiriyor mu? (`any`, `is_empty`, `is_not_empty` değer gerektirmez)
- `evaluateCondition(rule, question, choiceAnswers, textAnswer, ratingAnswer, matrixAnswer)` - Koşulu değerlendir, `true/false` döndür
- `conditionDescription(rule, question)` - Koşul için insan okunabilir açıklama döndür

**Değerlendirme Mantığı:**
- **Choice**: `equals` → seçilen cevaplar içinde `answer` var mı?
- **Rating**: `eq/gt/gte/lt/lte` → sayısal karşılaştırma
- **TextEntry**: `contains/exact/is_empty` → metin kontrolü
- **MatrixLikert**: `row_equals` → belirtilen satırda `answer` sütunu seçili mi?

---

### `src/utils/questionTypeInfo.ts`

Soru tipi etiketleri ve açıklamaları (merkezi kaynak).

**Export:**
- `questionTypeLabels: Record<QuestionType, string>`
- `questionTypeDescriptions: Record<QuestionType, string>`

Tooltip'lerde ve UI'da kullanılır.

---

### `src/utils/demoSurvey.ts`

Demo anket oluşturucu (test için).

**Fonksiyon:**
- `buildDemoData()` - 8 soru + 2 koşul içeren demo anket döndürür

**Demo İçeriği:**
- Otel misafir deneyimi anketi
- SingleChoice, MultipleChoice, TextEntry, Rating, MatrixLikert örnekleri
- 2 koşul: "Kötü" cevabında anketi bitir, "Hayır" cevabında S7'ye atla

---

### `src/utils/aiPrompt.ts`

Gemini için system prompt builder.

**Fonksiyon:**
- `buildSystemPrompt(questions, conditions, surveyTitle)` - System prompt string'i oluştur

**Prompt İçeriği:**
- Desteklenen soru tipleri ve anlamları
- Koşul operatörleri ve kullanım alanları
- Mevcut anket durumu (JSON formatında)
- Beklenen JSON çıktı formatı (7 action tipi)
- Önemli kurallar ve best practices

---

### `src/utils/aiActions.ts`

Gemini'nin JSON action'larını `useSurvey` fonksiyonlarına map eder.

**Interfaces:**
- `AIResponse` - Gemini'den gelen yanıt: `{ message: string, actions: AIAction[] }`
- `SurveyMutators` - BuilderPage'den gelen mutator fonksiyonları

**Fonksiyonlar:**
- `parseAIResponse(raw)` - Gemini yanıtını parse et (markdown code fence temizle, JSON parse)
- `executeAIActions(response, mutators)` - Action'ları sırayla uygula, hata topla

**Desteklenen Action Tipleri:**
1. `add_questions` - Toplu soru ekleme
2. `update_question` - Soru güncelleme
3. `delete_question` - Soru silme
4. `add_condition` - Koşul ekleme
5. `remove_condition` - Koşul silme
6. `set_title` - Başlık değiştirme
7. `replace_all` - Tüm anketi yeniden oluşturma

**Helper Functions:**
- `buildQuestion(def, order)` - AIQuestionDef'ten Question objesi oluştur
- `buildConditionAction(def, questions)` - AI action'tan ConditionAction oluştur

---

## Components

### Layout Components

#### `AppLayout` (`src/components/layout/AppLayout.tsx`)
Ana layout wrapper: TopBar + Sidebar + MainContent.

**Props:**
- `topBar: ReactNode`
- `sidebar: ReactNode`
- `mainContent: ReactNode`

**Layout:**
```
┌─────────────────────────────────┐
│ TopBar                          │
├──────────┬──────────────────────┤
│ Sidebar  │ MainContent          │
│ (w-80)   │ (flex-1)             │
│          │                      │
└──────────┴──────────────────────┘
```

---

#### `TopBar` (`src/components/layout/TopBar.tsx`)
Üst bar: Başlık input'u, AI Asistan butonu, Önizleme butonu, Kaydet butonu.

**Props:**
- `title`, `onTitleChange`
- `onSave` - JSON modal'ı aç
- `onBack` - Dashboard'a dön
- `onPreview` - Önizleme modunu aç
- `onToggleAI` - AI chat panelini aç/kapat
- `isAIOpen` - AI panel açık mı?

---

### Dashboard Components

#### `Dashboard` (`src/components/dashboard/Dashboard.tsx`)
Ana sayfa: Anket listesi, "Yeni Anket" butonu, "Demo Anket" butonu.

**Props:**
- `surveys: Survey[]`
- `onCreateNew()`
- `onCreateDemo()`
- `onOpenSurvey(id)`
- `onDeleteSurvey(id)`

**Özellikler:**
- Anket kartları grid layout
- Boş state (hiç anket yoksa)
- Tooltip'ler

---

#### `SurveyCard` (`src/components/dashboard/SurveyCard.tsx`)
Tek bir anket kartı.

**Props:**
- `survey: Survey`
- `onOpen(id)`
- `onDelete(id)`

**Gösterir:**
- Başlık
- Soru sayısı
- Oluşturulma tarihi
- Aç/Sil butonları

---

### Builder Components

#### `BuilderPage` (`src/components/builder/BuilderPage.tsx`)
Ana builder sayfası. Tüm builder mantığını birleştirir.

**State Management:**
- `useSurvey` hook'u kullanır
- `useAIChat` hook'u kullanır (AI entegrasyonu)
- `activeTab: 'questions' | 'flow'` - Sidebar sekmesi

**Layout:**
- `AppLayout` kullanır
- Sidebar: Sorular listesi veya Koşullar listesi
- Main: Soru editörü veya FlowCanvas (sekme değişince)

**Modals:**
- `JsonPreviewModal` - JSON export görüntüleme
- `PreviewPage` - Tam ekran önizleme
- `AIChatPanel` - AI chat drawer (sağdan kayan)

**Auto-save:**
- Her değişiklikte `onSave` çağrılır (useEffect)

---

### Editor Components

#### `EditorPanel` (`src/components/editor/EditorPanel.tsx`)
Ana editör paneli. Seçili soruyu düzenler.

**Props:**
- `question: Question | null`
- `onUpdate(guid, updates)`

**İçerik:**
- Soru metni input'u
- Soru tipi seçici (5 tip)
- Tip bazlı editör komponenti:
  - `AnswerEditor` - Choice seçenekleri
  - `TextEntrySettings` - Metin ayarları
  - `RatingSettings` - Derecelendirme ayarları
  - `MatrixLikertSettings` - Matrix ayarları

---

#### `QuestionEditor` (`src/components/editor/QuestionEditor.tsx`)
Soru tipi seçici: 5 tip için butonlar + tooltip'ler.

---

#### `AnswerEditor` (`src/components/editor/AnswerEditor.tsx`)
Choice soruları için seçenek editörü.

**Özellikler:**
- Seçenek ekle/sil
- Drag & drop ile sıralama (`@dnd-kit`)
- Her seçenek için input

---

#### `TextEntrySettings` (`src/components/editor/TextEntrySettings.tsx`)
Metin girişi ayarları: `maxLength`, `placeholder`.

---

#### `RatingSettings` (`src/components/editor/RatingSettings.tsx`)
Derecelendirme ayarları: `ratingCount`, `ratingLabels` (low/high).

---

#### `MatrixLikertSettings` (`src/components/editor/MatrixLikertSettings.tsx`)
Matrix Likert ayarları: `rows[]`, `columns[]`, `matrixType`.

**Özellikler:**
- Satır/sütun ekle/sil
- Drag & drop ile sıralama

---

### Sidebar Components

#### `Sidebar` (`src/components/sidebar/Sidebar.tsx`)
Ana sidebar komponenti. İki sekme içerir: "Sorular" ve "Akış".

**Props:**
- `questions`, `conditions`
- `selectedId`, `activeTab`
- `onTabChange`, `onSelect`, `onAdd`, `onDelete`, `onReorder`
- `onRemoveCondition`, `onUpdateCondition`

**Layout:**
- `SidebarTabs` - Sekme butonları
- `QuestionList` veya `ConditionList` (sekme değişince)

---

#### `SidebarTabs` (`src/components/sidebar/SidebarTabs.tsx`)
Sekme butonları: "Sorular" ve "Akış".

**Özellikler:**
- Tooltip'ler
- Aktif sekme vurgusu

---

#### `QuestionList` (`src/components/sidebar/QuestionList.tsx`)
Soru listesi container. Drag & drop ile sıralama.

**Props:**
- `questions`, `selectedId`
- `onSelect`, `onDelete`, `onReorder`

**Kullanır:**
- `@dnd-kit` - Drag & drop
- `QuestionCard` - Her soru için kart

---

#### `QuestionCard` (`src/components/sidebar/QuestionCard.tsx`)
Tek bir soru kartı.

**Gösterir:**
- Soru numarası badge'i
- Soru metni (truncate)
- Soru tipi badge'i (icon + label + detail) + tooltip
- Sil butonu (hover'da görünür)

**Özellikler:**
- Drag handle (grip icon)
- Seçili durumda vurgu
- Tıklanınca seçilir

---

#### `ConditionList` (`src/components/sidebar/ConditionList.tsx`)
Koşul listesi. Gemini'nin önerdiği modern UI ile.

**Gösterir:**
- Her koşul için "Kural #N" kartı
- Input → Logic → Output düzeni:
  - **Input**: Soru numarası + metni (hover'da tam metin)
  - **Logic**: Operatör badge'i
  - **Value**: Cevap/değer badge'i
  - **Output**: Aksiyon badge'i (yeşil: jump_to, kırmızı: end_survey)
- Doğal dil açıklaması (alt kısımda)
- Bağlantı çizgisi efekti (hover'da)

**Özellikler:**
- Tıklanınca `ConditionEditorModal` açılır
- Sil butonu (hover'da görünür)

---

### Flow Components

#### `FlowCanvas` (`src/components/flow/FlowCanvas.tsx`)
Ana xyflow canvas. Koşullu akışı görselleştirir ve düzenler.

**Props:**
- `questions`, `conditions`
- `nodePositions?` - Kaydedilmiş node pozisyonları
- `onAddCondition`, `onUpdateCondition`, `onRemoveCondition`
- `onSelectQuestion` - Soru node'una tıklanınca
- `onNodePositionsChange` - Node sürüklenince

**Node Types:**
- `question` - `QuestionNode` komponenti
- `end` - `EndNode` komponenti

**Edge Types:**
- **Sequential edges** - Sorular arası sıralı bağlantılar (dashed, gri)
- **Conditional edges** - Koşullu bağlantılar (solid, renkli, animated, label'lı)

**Özellikler:**
- Node'ları sürükle (pozisyon kaydedilir)
- Node'lara tıkla → Soruyu seç
- Edge'lere tıkla → Context menu (düzenle/sil)
- Node'ları bağla → Yeni koşul ekle modal'ı aç
- `Background` (dots pattern)
- `Controls` (zoom, fit view)

**Node Building:**
- `buildNodes(questions, conditions, nodePositions)` - Node'ları oluştur, pozisyonları yükle
- Her node'a `conditions` summary'si eklenir (tooltip için)

**Edge Building:**
- `buildEdges(questions, conditions)` - Sequential + conditional edge'leri oluştur
- `buildEdgeLabel(rule, questions)` - Edge label'ı oluştur (operatör + değer)

---

#### `QuestionNode` (`src/components/flow/QuestionNode.tsx`)
xyflow question node komponenti.

**Data:**
- `order`, `text`, `type`, `answers`, `guid`
- `settings?`, `conditions?` (tooltip için)

**Gösterir:**
- Soru numarası badge'i
- Soru tipi icon + label
- Soru metni (line-clamp-2)
- Koşul sayısı badge'i (varsa)
- Tooltip (hover'da): `QuestionNodeTooltip`

**Handles:**
- Top (target) - Gelen bağlantılar
- Bottom (source) - Giden bağlantılar

---

#### `QuestionNodeTooltip` (`src/components/flow/QuestionNodeTooltip.tsx`)
Soru node'u için zengin tooltip.

**İçerik:**
1. **Header**: Soru numarası, tip icon + label, soru metni, tip açıklaması
2. **Type Details**: Tip bazlı detaylar
   - **Choice**: Tüm seçenekler (A, B, C...)
   - **Rating**: Yıldız görseli + sayı + labels
   - **TextEntry**: maxLength + placeholder
   - **MatrixLikert**: Satırlar ve sütunlar grid'i
3. **Conditions**: Bu sorudan çıkan koşullar (açıklama + aksiyon badge'i)

**Pozisyon:** Node'un sağında (`left-full ml-3`)

---

#### `EndNode` (`src/components/flow/EndNode.tsx`)
"Anketi Bitir" node'u.

**Gösterir:**
- "SON" badge'i
- Icon

---

#### `EdgeContextMenu` (`src/components/flow/EdgeContextMenu.tsx`)
Conditional edge'e sağ tıklanınca açılan context menu.

**Actions:**
- Düzenle → `ConditionEditorModal` aç
- Sil → Koşulu sil

---

### Preview Components

#### `PreviewPage` (`src/components/preview/PreviewPage.tsx`)
Tam ekran önizleme modu.

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Header (başlık + kapat)                     │
├──────────────────┬──────────────────────────┤
│                  │                          │
│ PreviewQuestion  │ LiveFlowPanel (opsiyonel)│
│ (main content)   │ (sağ panel, geniş)       │
│                  │                          │
└──────────────────┴──────────────────────────┘
```

**Props:**
- `title`, `questions`, `conditions`, `nodePositions`
- `onClose`

**State:**
- `usePreview` hook'u kullanır
- `liveFlowVisible` - Live Flow paneli görünür mü?

**Özellikler:**
- Progress bar (üstte)
- Geri/İleri butonları
- Live Flow paneli toggle (sağ üstte buton)

---

#### `PreviewQuestion` (`src/components/preview/PreviewQuestion.tsx`)
Tek bir soruyu önizlemede gösterir.

**Props:**
- `question`, `step`, `totalSteps`
- Answer handlers (tip bazlı)
- Answer values (tip bazlı)

**Tip Bazlı Render:**
- **SingleChoice**: Radio buttons
- **MultipleChoice**: Checkboxes
- **TextEntry**: Textarea (maxLength, placeholder)
- **Rating**: Yıldız butonları (1-based)
- **MatrixLikert**: Satır x sütun grid (radio/checkbox)

**Özellikler:**
- Fade-slide animasyonu
- Tip bazlı max-width (MatrixLikert daha geniş)

---

#### `ProgressBar` (`src/components/preview/ProgressBar.tsx`)
İlerleme çubuğu.

**Props:**
- `current: number`
- `total: number`

**Gösterir:**
- Yüzde çubuğu
- "Soru X / Y" metni

---

#### `LiveFlowPanel` (`src/components/preview/LiveFlowPanel.tsx`)
Canlı akış paneli. Önizleme sırasında hangi soruda olduğunu gösterir.

**Props:**
- `questions`, `conditions`, `nodePositions`
- `currentQuestionGuid` - Şu anki soru
- `visitedPath: string[]` - Ziyaret edilen sorular (sırayla)
- `isCompleted` - Anket tamamlandı mı?
- `onClose`

**Node Types:**
- `liveQuestion` - `LiveFlowNode`
- `liveEnd` - `LiveFlowEndNode`

**Edge Logic:**
- **Sequential edges**: Gri, dashed (ziyaret edilmemiş) veya mor, solid, animated (ziyaret edilmiş)
- **Conditional edges**: Açık gri, dashed (ziyaret edilmemiş) veya renkli, solid, animated (ziyaret edilmiş)

**Auto-center:**
- Mevcut soru node'una otomatik zoom/pan

**Özellikler:**
- Read-only (draggable, selectable, connectable: false)
- Geniş panel (400px+)
- Node pozisyonları Builder'dan gelir (`nodePositions`)

---

#### `LiveFlowNode` (`src/components/preview/LiveFlowNode.tsx`)
Live Flow'da soru node'u.

**Data:**
- `order`, `text`, `type`, `guid`
- `answers`, `settings`, `conditions` (tooltip için)
- `isActive` - Şu anki soru mu?
- `isVisited` - Ziyaret edildi mi?

**Gösterir:**
- Aktif indicator (pulsing dot)
- Soru numarası badge'i (renk değişir: aktif/ziyaret/henüz değil)
- Soru tipi icon
- Soru metni (line-clamp-2)
- Koşul sayısı badge'i (varsa)
- Tooltip (hover'da): `QuestionNodeTooltip`

**Stil:**
- Aktif: `border-primary bg-primary/10 scale-105`
- Ziyaret edilmiş: `border-primary/30 bg-primary/[0.04]`
- Henüz değil: `border-base-300/40 bg-base-100/80`

---

#### `LiveFlowEndNode` (`src/components/preview/LiveFlowEndNode.tsx`)
Live Flow'da "Anketi Bitir" node'u.

**Data:**
- `isActive` - Anket tamamlandı mı?

**Stil:**
- Aktif: `border-error bg-error/10 scale-105`

---

### Modal Components

#### `ConditionEditorModal` (`src/components/modals/ConditionEditorModal.tsx`)
Koşul düzenleme modal'ı.

**Props:**
- `open`, `sourceQuestion`, `questions`
- `initialAnswer`, `initialAction`, `initialOperator`, `initialRowIndex`
- `onSave(input)`, `onClose`

**Özellikler:**
- Tip bazlı dinamik form:
  - **Choice**: Operatör seçici + cevap dropdown
  - **Rating**: Operatör seçici + sayı input
  - **TextEntry**: Operatör seçici + metin input (veya boşluk kontrolü)
  - **MatrixLikert**: Satır seçici + sütun dropdown
- Aksiyon seçici: "Anketi Bitir" veya "Soruya Git" (dropdown)
- Validasyon

---

#### `JsonPreviewModal` (`src/components/modals/JsonPreviewModal.tsx`)
JSON export görüntüleme modal'ı.

**Props:**
- `open`, `json: string`, `onClose`

**Özellikler:**
- Syntax highlighted JSON (pre tag)
- Kopyala butonu
- Scrollable

---

### AI Components

#### `AIChatPanel` (`src/components/ai/AIChatPanel.tsx`)
AI chat drawer (sağdan kayan panel).

**Props:**
- `open` - Panel açık mı?
- `messages: ChatMessage[]`
- `isLoading` - API çağrısı devam ediyor mu?
- `onSend(message)` - Mesaj gönder
- `onClear()` - Chat geçmişini temizle
- `onClose()` - Panel'i kapat

**Layout:**
```
┌─────────────────────────┐
│ Header (AI Asistan)      │
├─────────────────────────┤
│                         │
│ Messages Area           │
│ (scrollable)            │
│                         │
├─────────────────────────┤
│ Input Area              │
│ (textarea + send btn)   │
└─────────────────────────┘
```

**Özellikler:**
- Hoş karşılama ekranı (mesaj yoksa)
- Öneri chip'leri (hızlı başlangıç için)
- Kullanıcı/AI mesaj balonları (farklı stiller)
- "X işlem uygulandı" başarı badge'i
- Hata mesajları badge'leri
- Typing indicator animasyonu (loading'de)
- Auto-scroll (yeni mesajda)
- Auto-focus (panel açılınca)
- Shift+Enter: yeni satır, Enter: gönder
- Backdrop (panel dışına tıklayınca kapanır)

**Animasyon:**
- Panel: `translate-x-full` → `translate-x-0` (300ms ease-out)
- Backdrop: fade in/out

---

### UI Components

#### `Tooltip` (`src/components/ui/Tooltip.tsx`)
Genel amaçlı tooltip komponenti.

**Props:**
- `content: ReactNode` - Tooltip içeriği
- `children: ReactNode` - Tooltip'i tetikleyen element
- `position?: 'top' | 'bottom' | 'left' | 'right'`
- `delay?: number` (default: 400ms)
- `disabled?: boolean`

**Özellikler:**
- Backdrop blur efekti
- Ok (arrow) gösterir
- Smooth animasyon (`animate-tooltip-in`)
- Hover/focus ile tetiklenir
- `z-[100]` - Üstte görünür

**Kullanım:**
- Soru tipi butonlarında
- Sidebar tab'lerinde
- TopBar butonlarında
- Dashboard butonlarında

---

## AI Entegrasyonu

### Mimari

```
User Input (doğal dil)
    ↓
AIChatPanel
    ↓
useAIChat.sendMessage()
    ↓
buildSystemPrompt() → Gemini API (gemini-3.1-flash-lite-preview)
    ↓
parseAIResponse() → AIResponse { message, actions }
    ↓
executeAIActions() → useSurvey mutators
    ↓
Survey State Updated
```

### System Prompt

`buildSystemPrompt()` fonksiyonu şunları içerir:
- Desteklenen soru tipleri ve anlamları
- Koşul operatörleri ve kullanım alanları
- Mevcut anket durumu (JSON)
- Beklenen JSON çıktı formatı
- 7 action tipi ve örnekleri
- Önemli kurallar

### AI Response Format

Gemini'den beklenen format:
```json
{
  "message": "Türkçe açıklama metni",
  "actions": [
    { "type": "add_questions", "questions": [...] },
    { "type": "add_condition", ... }
  ]
}
```

### Action Execution

`executeAIActions()` fonksiyonu:
1. Her action'ı sırayla işler
2. `SurveyMutators` interface'i üzerinden `useSurvey` fonksiyonlarını çağırır
3. Hataları toplar ve döndürür
4. Başarılı action sayısını döndürür

### API Key Yönetimi

- `.env` dosyasında `VITE_GEMINI_API_KEY` tanımlanır
- Vite otomatik olarak `VITE_` prefix'li değişkenleri client'a expose eder
- Dev server restart gerekir (env değişkenleri sadece başlangıçta yüklenir)

---

## Koşullu Akış Sistemi

### Koşul Tanımlama

Koşullar `ConditionalRule` interface'i ile tanımlanır:
- **Source Question**: Hangi sorudan çıkıyor
- **Operator**: Karşılaştırma operatörü (tip bazlı)
- **Answer**: Karşılaştırma değeri
- **Action**: Ne yapılacak (jump_to veya end_survey)
- **Row Index**: MatrixLikert için (hangi satır)

### Koşul Değerlendirme

`evaluateCondition()` fonksiyonu:
1. Operatör tipine göre uygun karşılaştırmayı yapar
2. Kullanıcının cevabını kontrol eder
3. `true/false` döndürür

**Örnek:**
- Rating soru, operatör: `gt`, answer: `"3"` → Kullanıcı 4 veya 5 seçtiyse `true`
- TextEntry soru, operatör: `contains`, answer: `"memnun"` → Metin "memnun" içeriyorsa `true`

### Akış Çözümleme

`usePreview.resolveNext()` fonksiyonu:
1. Mevcut soru için tüm koşulları kontrol eder
2. İlk eşleşen koşulu bulur
3. Aksiyona göre:
   - `end_survey` → Anketi bitir
   - `jump_to` → Hedef soruya git
4. Eşleşen koşul yoksa → Sıradaki soruya git

### Görselleştirme

**FlowCanvas (Builder):**
- Sequential edges: Gri, dashed (varsayılan akış)
- Conditional edges: Renkli, solid, animated, label'lı (koşullu akış)
- Node'ları sürükle, edge'lere tıkla (düzenle/sil)

**LiveFlowPanel (Preview):**
- Ziyaret edilen path vurgulanır (renkli, animated)
- Mevcut soru highlight'lanır (scale, border, bg)
- Ziyaret edilmiş sorular hafif vurgulanır

---

## Önizleme Sistemi

### State Management

`usePreview` hook'u 4 farklı answer store yönetir:
- `answers` - Choice cevapları
- `textAnswers` - TextEntry cevapları
- `ratingAnswers` - Rating cevapları
- `matrixAnswers` - MatrixLikert cevapları

### Navigation

- `goNext()` - Koşullu mantık ile sonraki soruya git
- `goPrev()` - Önceki soruya git (path'ten çıkar)
- `reset()` - Başa dön, tüm cevapları temizle

### Progress Tracking

- `path: string[]` - Ziyaret edilen sorular (sırayla)
- `progress: number` - 0-1 arası ilerleme
- `currentStep`, `totalSteps` - Adım bilgisi

### Live Flow Integration

Live Flow paneli:
- `visitedPath` prop'u ile ziyaret edilen path'i alır
- `currentQuestionGuid` ile mevcut soruyu highlight'lar
- Edge'leri dinamik olarak renklendirir (ziyaret edilmiş/edilmemiş)

---

## Stil Sistemi

### Tailwind CSS v4 + DaisyUI v5

**Custom Theme:**
- Primary: `oklch(65% 0.19 281)` (#9381ff)
- Light theme
- Rounded corners (`rounded-xl`, `rounded-2xl`)
- Smooth transitions

**Global Styles (`index.css`):**
- Custom scrollbar
- Focus rings
- Animations (fadeSlideIn, slideInRight, tooltipIn)
- React Flow overrides

### Component Styling Patterns

- **Cards**: `bg-base-100 rounded-xl border border-base-300/40`
- **Buttons**: `btn btn-primary btn-sm rounded-xl`
- **Badges**: `px-2.5 py-1 rounded-full text-[10px] font-semibold`
- **Tooltips**: `bg-neutral/95 backdrop-blur-md text-neutral-content`

---

## Veri Akışı

### Builder → Preview

1. Builder'da anket oluşturulur (`useSurvey`)
2. `toJSON()` ile JSON export edilir
3. Preview'da `usePreview` hook'u kullanılır
4. Koşullu akış `evaluateCondition` ile çalıştırılır

### State Persistence

- **Memory-based**: `useSurveyStore` sadece memory'de tutar (localStorage yok)
- **Auto-save**: Builder'da her değişiklikte `onSave` çağrılır
- **Node Positions**: xyflow node pozisyonları `Survey.nodePositions` içinde saklanır

---

## Önemli Notlar

### Performance
- `memo()` kullanımı: `QuestionNode`, `LiveFlowNode` (re-render optimizasyonu)
- `useCallback()` kullanımı: Tüm event handler'lar
- `useRef()` kullanımı: Stale closure önleme (AI chat'te)

### Type Safety
- Tüm komponentler TypeScript ile tip güvenli
- Interface'ler merkezi (`types/survey.ts`)
- Strict mode aktif

### Extensibility
- Yeni soru tipi eklemek: `QuestionType` enum'a ekle, editor/preview komponentleri ekle
- Yeni operatör eklemek: `ConditionOperator` type'a ekle, `evaluateCondition`'a case ekle
- Yeni action tipi eklemek: `aiActions.ts`'e interface + case ekle

---

## Geliştirme Notları

### Dev Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Type Check
```bash
npx tsc --noEmit
```

---

## Gelecek Geliştirmeler

- [ ] Image/Video soru tipi
- [ ] Ranking soru tipi
- [ ] Anket şablonları
- [ ] Çoklu dil desteği
- [ ] Backend entegrasyonu (API)
- [ ] Kullanıcı authentication
- [ ] Anket paylaşımı
- [ ] Cevap analizi

---

**Son Güncelleme:** 2025-03-11
**Versiyon:** 0.0.0
**Lisans:** Private

