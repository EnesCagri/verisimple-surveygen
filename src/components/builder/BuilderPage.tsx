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
import type { SidebarTab } from "../sidebar/SidebarTabs";

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
  onBack: () => void;
}

export function BuilderPage({ survey, onSave, onBack }: BuilderPageProps) {
  const surveyHook = useSurvey(
    survey.title,
    survey.questions,
    survey.conditions ?? [],
    survey.nodePositions,
    survey.sequentialEdges,
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

  const [activeTab, setActiveTab] = useState<SidebarTab>("questions");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiChatOpen, setAIChatOpen] = useState(false);
  const [bridgeSaving, setBridgeSaving] = useState(false);
  const [bridgeMessage, setBridgeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
  }, [survey.id, getSurveyPayload]);

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
    </>
  );
}
