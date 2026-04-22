import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Survey,
  Question,
  ConditionalRule,
  NodePositions,
  SequentialEdges,
} from "../../types/survey";
import { AppLayout } from "../layout/AppLayout";
import { TopBar } from "../layout/TopBar";
import { Sidebar } from "../sidebar/Sidebar";
import { EditorPanel } from "../editor/EditorPanel";
import { FlowCanvas } from "../flow/FlowCanvas";
import { PreviewPage } from "../preview/PreviewPage";
import { AIChatPanel } from "../ai/AIChatPanel";
import { useSurvey } from "../../hooks/useSurvey";
import { useAIChat } from "../../hooks/useAIChat";
import {
  isBridgeAvailable,
  bridgeSave,
  bridgeNotifyChange,
} from "../../bridge/bridge";
import type { SurveyMutators } from "../../utils/aiActions";
import { isQuestionIncomplete, questionIncompleteReason } from "../../utils/question";
import type { SidebarTab } from "../sidebar/SidebarTabs";
import {
  hasVsSurveyGenInitialKey,
  isVsSurveyGenExplicitNewMode,
} from "../../bridge/vsHostInitial";

interface BuilderPageProps {
  survey: Survey;
  onSave: (
    id: string,
    updates: {
      title: string;
      questions: Question[];
      conditions: ConditionalRule[];
      nodePositions?: NodePositions;
      sequentialEdges?: SequentialEdges;
    },
  ) => void;
  onBack?: () => void;
  /** İlk başarılı bridge kaydından sonra host `surveyGuid` döner; yerel state güncellenir */
  onBridgeSurveyGuid?: (surveyGuid: string) => void;
}

export function BuilderPage({
  survey,
  onSave,
  onBack,
  onBridgeSurveyGuid,
}: BuilderPageProps) {
  const surveyHook = useSurvey(
    survey.title,
    survey.questions,
    survey.conditions ?? [],
    survey.nodePositions,
    survey.sequentialEdges,
    survey.surveyGuid,
  );

  const {
    title,
    setTitle,
    questions,
    conditions,
    nodePositions,
    sequentialEdges,
    selectedId,
    selectedQuestion,
    addQuestion,
    addQuestionWithData,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    selectQuestion,
    addCondition,
    updateCondition,
    removeCondition,
    replaceAll,
    updateNodePositions,
    updateSequentialEdges,
    getSurveyPayload,
  } = surveyHook;

  const incompleteQuestions = questions.filter(isQuestionIncomplete);
  const hasIncomplete = incompleteQuestions.length > 0;
  const saveDisabledReason = hasIncomplete
    ? incompleteQuestions.length === 1
      ? `Soru ${incompleteQuestions[0].order}: ${questionIncompleteReason(incompleteQuestions[0]) ?? 'eksik alan var'}`
      : `${incompleteQuestions.length} soruda eksik alan var (kırmızı kenarlıklar)`
    : undefined;

  const [activeTab, setActiveTab] = useState<SidebarTab>("questions");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiChatOpen, setAIChatOpen] = useState(false);
  const [bridgeSaving, setBridgeSaving] = useState(false);
  const [bridgeMessage, setBridgeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const newSurveyNameDialogRef = useRef<HTMLDialogElement>(null);
  const newSurveyTitleInputRef = useRef<HTMLInputElement>(null);
  const newSurveyNamePromptShown = useRef(false);
  const [newSurveyTitleDraft, setNewSurveyTitleDraft] = useState("");
  const [newSurveyTitleError, setNewSurveyTitleError] = useState(false);

  // Yeni anket: host `__VS_SURVEYGEN_INITIAL__ === null` veya boş standalone taslak
  useEffect(() => {
    if (newSurveyNamePromptShown.current) return;
    const hostNew = isVsSurveyGenExplicitNewMode();
    const standaloneEmpty =
      !hasVsSurveyGenInitialKey() &&
      survey.title === "Yeni Anket" &&
      survey.questions.length === 0;
    if (!hostNew && !standaloneEmpty) return;
    newSurveyNamePromptShown.current = true;
    setNewSurveyTitleDraft("");
    setNewSurveyTitleError(false);
    queueMicrotask(() => {
      const el = newSurveyNameDialogRef.current;
      if (el && !el.open) {
        el.showModal();
        newSurveyTitleInputRef.current?.focus();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca ilk mount’ta anket “yeni” mi kontrol edilir
  }, []);

  // Refs for live state getters (avoids stale closures in useAIChat)
  const questionsRef = useRef(questions);
  const conditionsRef = useRef(conditions);
  const titleRef = useRef(title);
  questionsRef.current = questions;
  conditionsRef.current = conditions;
  titleRef.current = title;

  const getQuestions = useCallback(() => questionsRef.current, []);
  const getConditions = useCallback(() => conditionsRef.current, []);
  const getTitle = useCallback(() => titleRef.current, []);

  // Build mutators object for AI actions
  const mutators: SurveyMutators = useCallback(
    () => ({
      setTitle,
      addQuestionWithData,
      updateQuestion,
      deleteQuestion,
      addCondition,
      updateCondition,
      removeCondition,
      replaceAll,
      reorderQuestions,
      getQuestions,
      getConditions,
    }),
    [
      setTitle,
      addQuestionWithData,
      updateQuestion,
      deleteQuestion,
      addCondition,
      updateCondition,
      removeCondition,
      replaceAll,
      reorderQuestions,
      getQuestions,
      getConditions,
    ],
  )();

  const {
    messages,
    isLoading: aiLoading,
    sendMessage,
    clearMessages,
    keepChanges,
    undoChanges,
    redoChanges,
  } = useAIChat({
    getQuestions,
    getConditions,
    getTitle,
    mutators,
  });

  // Auto-save on changes (local store + bridge notification).
  // nodePositions / sequentialEdges için `undefined` gönderme: updateSurvey birleşiminde kayıtlı değeri silmez.
  useEffect(() => {
    onSave(survey.id, {
      title,
      questions,
      conditions,
      ...(nodePositions !== undefined ? { nodePositions } : {}),
      ...(sequentialEdges !== undefined ? { sequentialEdges } : {}),
    });
    bridgeNotifyChange(getSurveyPayload(survey.id));
  }, [
    title,
    questions,
    conditions,
    nodePositions,
    sequentialEdges,
    survey.id,
    onSave,
    getSurveyPayload,
  ]);

  const applyNewSurveyTitleFromDialog = useCallback(() => {
    const trimmed = newSurveyTitleDraft.trim();
    if (!trimmed) {
      setNewSurveyTitleError(true);
      newSurveyTitleInputRef.current?.focus();
      return;
    }
    setNewSurveyTitleError(false);
    setTitle(trimmed);
    newSurveyNameDialogRef.current?.close();
  }, [newSurveyTitleDraft, setTitle]);

  const handleSave = useCallback(async () => {
    if (!isBridgeAvailable()) {
      setBridgeMessage({
        type: "error",
        text: "Bridge bulunamadı. Kaydetme işlemi yapılamadı.",
      });
      setTimeout(() => setBridgeMessage(null), 4000);
      return;
    }

    setBridgeSaving(true);
    setBridgeMessage(null);
    const response = await bridgeSave(getSurveyPayload(survey.id));
    setBridgeSaving(false);

    if (response.success) {
      if (response.surveyGuid) {
        onBridgeSurveyGuid?.(response.surveyGuid);
      }
      setBridgeMessage({
        type: "success",
        text: response.message ?? "Kaydedildi!",
      });
      setTimeout(() => setBridgeMessage(null), 2500);
    } else {
      setBridgeMessage({
        type: "error",
        text: response.message ?? "Kaydetme hatası.",
      });
      setTimeout(() => setBridgeMessage(null), 4000);
    }
  }, [survey.id, getSurveyPayload, onBridgeSurveyGuid]);

  // When switching to flow tab, show the flow canvas in main area
  const mainContent =
    activeTab === "flow" ? (
      <FlowCanvas
        surveyId={survey.id}
        questions={questions}
        conditions={conditions}
        nodePositions={nodePositions}
        sequentialEdges={sequentialEdges}
        onAddCondition={addCondition}
        onUpdateCondition={updateCondition}
        onRemoveCondition={removeCondition}
        onSelectQuestion={selectQuestion}
        onDeleteQuestion={deleteQuestion}
        onNodePositionsChange={updateNodePositions}
        onSequentialEdgesChange={updateSequentialEdges}
      />
    ) : (
      <div className="h-full overflow-y-auto p-8">
        <EditorPanel
          question={selectedQuestion}
          onUpdate={updateQuestion}
          onDeleteQuestion={deleteQuestion}
          onDuplicateQuestion={duplicateQuestion}
        />
      </div>
    );

  return (
    <>
      <AppLayout
        topBar={
          <TopBar
            title={title}
            onTitleChange={setTitle}
            onSave={handleSave}
            onBack={onBack}
            onPreview={() => setPreviewOpen(true)}
            onToggleAI={() => setAIChatOpen((v) => !v)}
            isAIOpen={aiChatOpen}
            saveDisabled={hasIncomplete}
            saveDisabledReason={saveDisabledReason}
          />
        }
        sidebar={
          <Sidebar
            questions={questions}
            conditions={conditions}
            selectedId={selectedId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSelect={selectQuestion}
            onAdd={addQuestion}
            onDelete={deleteQuestion}
            onDuplicate={duplicateQuestion}
            onReorder={reorderQuestions}
            onUpdate={updateQuestion}
            onRemoveCondition={removeCondition}
            onUpdateCondition={updateCondition}
          />
        }
        mainContent={mainContent}
      />

      {/* Bridge save toast */}
      {bridgeMessage && (
        <div
          className={`fixed bottom-6 right-6 z-9999 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
            bridgeMessage.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {bridgeMessage.text}
        </div>
      )}

      {bridgeSaving && (
        <div className="fixed bottom-6 right-6 z-9999 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold bg-slate-800 text-white">
          Kaydediliyor…
        </div>
      )}

      {previewOpen && (
        <PreviewPage
          title={title}
          questions={questions}
          conditions={conditions}
          nodePositions={nodePositions}
          sequentialEdges={sequentialEdges}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      <AIChatPanel
        open={aiChatOpen}
        messages={messages}
        isLoading={aiLoading}
        onSend={sendMessage}
        onClear={clearMessages}
        onClose={() => setAIChatOpen(false)}
        onKeep={keepChanges}
        onUndo={undoChanges}
        onRedo={redoChanges}
      />

      <dialog
        ref={newSurveyNameDialogRef}
        className="fixed inset-0 m-auto max-w-[min(100vw-2rem,28rem)] w-full rounded-2xl border border-base-300/50 bg-base-100 p-6 shadow-2xl backdrop:bg-black/40 z-10050"
        onClose={() => setNewSurveyTitleError(false)}
      >
        <form
          method="dialog"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            applyNewSurveyTitleFromDialog();
          }}
        >
          <div>
            <h2 className="text-lg font-semibold text-base-content">
              Anket adı
            </h2>
            <p className="mt-1.5 text-sm text-base-content/60 leading-relaxed">
              Bu ankete vermek istediğiniz başlığı girin. Üst çubuktan sonra da
              değiştirebilirsiniz.
            </p>
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-base-content/80">
              Başlık
            </span>
            <input
              ref={newSurveyTitleInputRef}
              type="text"
              value={newSurveyTitleDraft}
              onChange={(e) => {
                setNewSurveyTitleDraft(e.target.value);
                if (newSurveyTitleError) setNewSurveyTitleError(false);
              }}
              className={`input input-bordered w-full text-base ${
                newSurveyTitleError ? "input-error" : ""
              }`}
              placeholder="Örn. Müşteri memnuniyeti anketi"
              maxLength={200}
              autoComplete="off"
            />
            {newSurveyTitleError && (
              <span className="text-sm text-error">
                Lütfen en az bir karakter girin.
              </span>
            )}
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn btn-ghost rounded-xl"
              onClick={() => newSurveyNameDialogRef.current?.close()}
            >
              Sonra
            </button>
            <button type="submit" className="btn btn-primary rounded-xl">
              Devam
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
