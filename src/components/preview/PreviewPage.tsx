import { useState } from 'react';
import type { Question, ConditionalRule, NodePositions, SequentialEdges } from '../../types/survey';
import { usePreview } from '../../hooks/usePreview';
import { ProgressBar } from './ProgressBar';
import { PreviewQuestion } from './PreviewQuestion';
import { LiveFlowPanel } from './LiveFlowPanel';

interface PreviewPageProps {
  title: string;
  questions: Question[];
  conditions?: ConditionalRule[];
  nodePositions?: NodePositions;
  sequentialEdges?: SequentialEdges;
  onClose: () => void;
}

export function PreviewPage({ title, questions, conditions = [], nodePositions, sequentialEdges, onClose }: PreviewPageProps) {
  const {
    currentStep,
    currentQuestion,
    totalSteps,
    progress,
    isFirst,
    isLast,
    isCompleted,
    isCurrentQuestionRequired,
    isCurrentQuestionAnswered,
    isSurveyValid,
    showRequiredSkipToast,
    goNext,
    goPrev,
    selectAnswer,
    setTextAnswer,
    getSelectedAnswers,
    getTextAnswer,
    setRatingAnswer,
    getRatingAnswer,
    setMatrixAnswer,
    getMatrixAnswer,
    setSortableAnswer,
    getSortableAnswer,
    reset,
    path,
  } = usePreview(questions, conditions, sequentialEdges);

  const [flowOpen, setFlowOpen] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);

  // No questions state
  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-base-100 flex flex-col">
        <PreviewHeader
          title={title}
          onClose={onClose}
          flowOpen={flowOpen}
          onToggleFlow={() => setFlowOpen((v) => !v)}
          mobilePreview={mobilePreview}
          onToggleMobilePreview={() => setMobilePreview((v) => !v)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className={mobilePreview ? 'w-[390px] max-w-[92vw] rounded-4xl border border-base-300/50 p-6 shadow-xl bg-base-100' : ''}>
            <div className="text-center text-base-content/30">
              <p className="text-lg font-medium mb-1">Soru bulunamadı</p>
              <p className="text-sm">Önce birkaç soru ekleyin</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-base-100 flex flex-col">
        <PreviewHeader
          title={title}
          onClose={onClose}
          flowOpen={flowOpen}
          onToggleFlow={() => setFlowOpen((v) => !v)}
          mobilePreview={mobilePreview}
          onToggleMobilePreview={() => setMobilePreview((v) => !v)}
        />
        <div className="flex-1 flex">
          {/* Main content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className={mobilePreview ? 'w-[390px] max-w-[92vw] rounded-4xl border border-base-300/50 p-6 shadow-xl bg-base-100' : ''}>
              <div className="text-center">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${isSurveyValid ? 'bg-success/10' : 'bg-warning/12'}`}>
                {isSurveyValid ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 15s1.5-2 4-2 4 2 4 2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-base-content/80 mb-2">{isSurveyValid ? 'Tamamlandı!' : 'Üzgünüz'}</h2>
              <p className="text-base-content/40 mb-8">
                {isSurveyValid
                  ? 'Anketi tamamladınız, teşekkürler.'
                  : 'Bu anket için uygun değilsiniz, ne yazık ki.'}
              </p>

                <div className="flex gap-3 justify-center">
                  <button className="btn btn-ghost btn-sm rounded-xl" onClick={reset}>
                    Tekrar Başla
                  </button>
                  <button className="btn btn-primary btn-sm rounded-xl px-6" onClick={onClose}>
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Flow panel */}
          {flowOpen && (
            <div className="w-[1000px] shrink-0 h-full">
            <LiveFlowPanel
              questions={questions}
              conditions={conditions}
              nodePositions={nodePositions}
              currentQuestionGuid={null}
              visitedPath={path}
              isCompleted
              onClose={() => setFlowOpen(false)}
            />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-base-100 flex flex-col">
      {showRequiredSkipToast && (
        <div className="fixed top-4 right-4 z-70 animate-[fadeSlideIn_0.2s_ease-out]">
          <div className="px-4 py-2.5 rounded-xl bg-warning/15 border border-warning/35 text-warning text-sm font-medium shadow-lg">
            Lütfen soruyu boş geçmeyin. Geçmek için tekrar tıklayın.
          </div>
        </div>
      )}
      <PreviewHeader
        title={title}
        onClose={onClose}
        flowOpen={flowOpen}
        onToggleFlow={() => setFlowOpen((v) => !v)}
        mobilePreview={mobilePreview}
        onToggleMobilePreview={() => setMobilePreview((v) => !v)}
      />

      {/* Main body = Question + optional flow panel */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-3 sm:p-6">
          {mobilePreview ? (
            <div className="mockup-phone shadow-2xl">
              <div className="mockup-phone-camera" />
              <div className="mockup-phone-display">
                <div className="flex flex-col w-full h-full bg-base-100">
                  {/* Progress */}
                  <div className="px-4 pt-12 pb-2 shrink-0">
                    <ProgressBar
                      progress={progress}
                      currentStep={currentStep}
                      totalSteps={totalSteps}
                    />
                  </div>

                  {/* Question content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="w-full px-5 py-4">
                      {currentQuestion && (
                        <PreviewQuestion
                          key={currentQuestion.guid}
                          question={currentQuestion}
                          selectedAnswers={getSelectedAnswers(currentQuestion.guid)}
                          onSelectAnswer={selectAnswer}
                          onSingleChoiceNext={goNext}
                          textValue={getTextAnswer(currentQuestion.guid)}
                          onTextChange={setTextAnswer}
                          ratingValue={getRatingAnswer(currentQuestion.guid)}
                          onRatingChange={setRatingAnswer}
                          matrixValue={getMatrixAnswer(currentQuestion.guid)}
                          onMatrixChange={setMatrixAnswer}
                          sortableValue={getSortableAnswer(currentQuestion.guid)}
                          onSortableChange={setSortableAnswer}
                          isMobilePreview
                        />
                      )}
                    </div>
                  </div>

                  {/* Navigation buttons */}
                  <div className="shrink-0 border-t border-base-300/30 bg-base-100 px-5 py-3">
                    {isCurrentQuestionRequired && !isCurrentQuestionAnswered && (
                      <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <path d="M12 16h.01" />
                        </svg>
                        <span>Bu soru zorunludur</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <button
                        className={`btn btn-ghost btn-sm rounded-xl gap-1 ${isFirst ? 'invisible' : ''}`}
                        onClick={goPrev}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                        Geri
                      </button>
                      <button className="btn btn-primary btn-sm rounded-xl px-5 gap-1" onClick={goNext}>
                        {isLast ? 'Tamamla' : 'İleri'}
                        {!isLast && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full min-h-0 flex flex-col bg-base-100">
              {/* Progress */}
              <div className="px-6 sm:px-0 w-full pt-3 sm:pt-4 sm:max-w-xl sm:mx-auto shrink-0">
                <ProgressBar
                  progress={progress}
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                />
              </div>

              {/* Question content */}
              <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto">
                <div className="w-full max-w-2xl px-6 py-4 sm:py-8">
                  {currentQuestion && (
                    <PreviewQuestion
                      key={currentQuestion.guid}
                      question={currentQuestion}
                      selectedAnswers={getSelectedAnswers(currentQuestion.guid)}
                      onSelectAnswer={selectAnswer}
                      onSingleChoiceNext={goNext}
                      textValue={getTextAnswer(currentQuestion.guid)}
                      onTextChange={setTextAnswer}
                      ratingValue={getRatingAnswer(currentQuestion.guid)}
                      onRatingChange={setRatingAnswer}
                      matrixValue={getMatrixAnswer(currentQuestion.guid)}
                      onMatrixChange={setMatrixAnswer}
                      sortableValue={getSortableAnswer(currentQuestion.guid)}
                      onSortableChange={setSortableAnswer}
                    />
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="border-t border-base-300/30 bg-base-100">
                <div className="max-w-xl mx-auto px-6 py-4">
                  {/* Required warning */}
                  {isCurrentQuestionRequired && !isCurrentQuestionAnswered && (
                    <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/20 text-warning text-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                      <span>Bu soru zorunludur, lütfen cevaplayın</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      className={`btn btn-ghost btn-sm rounded-xl gap-2 ${isFirst ? 'invisible' : ''}`}
                      onClick={goPrev}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                      Geri
                    </button>

                    <button className="btn btn-primary btn-sm rounded-xl px-6 gap-2" onClick={goNext}>
                      {isLast ? 'Tamamla' : 'İleri'}
                      {!isLast && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Flow panel — slides in from right */}
        {flowOpen && (
          <div className="w-[1000px] shrink-0 h-full animate-[slideInRight_0.3s_ease-out]">
            <LiveFlowPanel
              questions={questions}
              conditions={conditions}
              nodePositions={nodePositions}
              currentQuestionGuid={currentQuestion?.guid ?? null}
              visitedPath={path}
              isCompleted={false}
              onClose={() => setFlowOpen(false)}
            />
          </div>
        )}
      </div>

    </div>
  );
}

/** Internal header for preview mode */
function PreviewHeader({
  title,
  onClose,
  flowOpen,
  onToggleFlow,
  mobilePreview,
  onToggleMobilePreview,
}: {
  title: string;
  onClose: () => void;
  flowOpen: boolean;
  onToggleFlow: () => void;
  mobilePreview: boolean;
  onToggleMobilePreview: () => void;
}) {
  return (
    <header className="flex items-center gap-4 px-5 py-3 border-b border-base-300/30">
      <div className="flex-1">
        <span className="text-xs font-medium text-primary/60 uppercase tracking-wider">Önizleme</span>
        <h1 className="text-sm font-semibold text-base-content/70 truncate">{title}</h1>
      </div>

      {/* Live Flow toggle button */}
      <button
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${flowOpen
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'bg-base-200/60 text-base-content/40 hover:text-base-content/60 hover:bg-base-200 border border-transparent'
          }
        `}
        onClick={onToggleFlow}
        title={flowOpen ? 'Akış panelini kapat' : 'Canlı akış panelini aç'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="19" r="2" />
          <circle cx="5" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
          <path d="M12 7v4" />
          <path d="M12 13v4" />
          <path d="M7 12h4" />
          <path d="M13 12h4" />
        </svg>
        {flowOpen ? 'Live Flow' : 'Live Flow'}
      </button>
      <button
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${mobilePreview
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'bg-base-200/60 text-base-content/40 hover:text-base-content/60 hover:bg-base-200 border border-transparent'
          }
        `}
        onClick={onToggleMobilePreview}
        title={mobilePreview ? 'Masaüstü önizlemeye geç' : 'Mobil önizlemeye geç'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        {mobilePreview ? 'Masaüstüne Geç' : 'Mobil’e Geç'}
      </button>

      <button
        className="p-2 rounded-xl hover:bg-base-200 text-base-content/40 hover:text-base-content transition-colors"
        onClick={onClose}
        title="Önizlemeyi kapat"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </header>
  );
}
