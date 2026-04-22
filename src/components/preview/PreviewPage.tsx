import { useState } from 'react';
import type { Question, ConditionalRule, NodePositions, SequentialEdges } from '../../types/survey';
import { usePreview } from '../../hooks/usePreview';
import { ProgressBar } from './ProgressBar';
import { PreviewQuestion } from './PreviewQuestion';
import { LiveFlowPanel } from './LiveFlowPanel';
import { SkipToastBanner } from './SkipToastBanner';

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
    isSurveyValid,
    skipToast,
    goNext,
    goNextAfterAnswer,
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

  // No questions state
  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-base-100 flex flex-col">
        <PreviewHeader
          title={title}
          onClose={onClose}
          flowOpen={flowOpen}
          onToggleFlow={() => setFlowOpen((v) => !v)}
        />
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:flex-row">
          <div className="flex flex-1 min-h-0 items-center justify-center p-6">
            <div className="text-center text-base-content/30">
              <p className="text-lg font-medium mb-1">Soru bulunamadı</p>
              <p className="text-sm">Önce birkaç soru ekleyin</p>
            </div>
          </div>
          {!flowOpen && (
            <div className="flex min-h-48 shrink-0 items-center justify-center border-t border-base-300/25 bg-base-100 py-6 pl-3 pr-10 sm:pr-14 lg:w-[min(400px,42vw)] lg:border-l lg:border-t-0">
              <div className="mockup-phone scale-90 opacity-40 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <div className="mockup-phone-camera" />
                <div className="mockup-phone-display h-32 bg-base-100" />
              </div>
            </div>
          )}
          {flowOpen && (
            <div className="h-[min(70vh,520px)] min-h-0 w-full shrink-0 border-t border-base-300/30 lg:h-auto lg:w-[min(1000px,48vw)] lg:border-l lg:border-t-0">
              <LiveFlowPanel
                questions={questions}
                conditions={conditions}
                nodePositions={nodePositions}
                currentQuestionGuid={null}
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

  // Completed state
  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-base-100 flex flex-col">
        <PreviewHeader
          title={title}
          onClose={onClose}
          flowOpen={flowOpen}
          onToggleFlow={() => setFlowOpen((v) => !v)}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto p-6">
            <div className="text-center">
              <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl ${isSurveyValid ? 'bg-success/10' : 'bg-warning/12'}`}>
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
              <h2 className="mb-2 text-2xl font-bold text-base-content/80">{isSurveyValid ? 'Tamamlandı!' : 'Üzgünüz'}</h2>
              <p className="mb-8 text-base-content/40">
                {isSurveyValid
                  ? 'Anketi tamamladınız, teşekkürler.'
                  : 'Bu anket için uygun değilsiniz, ne yazık ki.'}
              </p>
              <div className="flex justify-center gap-3">
                <button type="button" className="btn btn-ghost btn-sm rounded-xl" onClick={reset}>
                  Tekrar Başla
                </button>
                <button type="button" className="btn btn-primary btn-sm rounded-xl px-6" onClick={onClose}>
                  Kapat
                </button>
              </div>
            </div>
          </div>

          {!flowOpen && (
            <div className="flex min-h-56 shrink-0 items-center justify-center border-t border-base-300/25 bg-base-100 py-6 pl-3 pr-10 sm:pr-14 lg:w-[min(400px,42vw)] lg:border-l lg:border-t-0">
              <div className="mockup-phone shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
                <div className="mockup-phone-camera" />
                <div className="mockup-phone-display bg-base-100">
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-base-100 px-4 py-8">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isSurveyValid ? 'bg-success/10' : 'bg-warning/12'}`}>
                      {isSurveyValid ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      )}
                    </div>
                    <p className="text-center text-xs font-semibold text-base-content/60">{isSurveyValid ? 'Tamamlandı' : 'Sonuç'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {flowOpen && (
            <div className="h-[min(70vh,520px)] min-h-0 w-full shrink-0 border-t border-base-300/30 lg:h-auto lg:w-[min(1000px,48vw)] lg:border-l lg:border-t-0">
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
    <div className="fixed inset-0 z-50 flex flex-col bg-base-100 isolate">
      <PreviewHeader
        title={title}
        onClose={onClose}
        flowOpen={flowOpen}
        onToggleFlow={() => setFlowOpen((v) => !v)}
      />

      {/* Main body: (!flowOpen) web + mobil yan yana; (flowOpen) sadece web + Live Flow */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`flex min-h-0 min-w-0 flex-1 overflow-hidden ${flowOpen ? 'flex-col p-3 pb-14 sm:p-6 sm:pb-20' : 'flex-col gap-4 p-3 pb-14 sm:flex-row sm:p-6 sm:pb-20'}`}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex h-full min-h-0 w-full flex-col bg-base-100 sm:mx-auto sm:max-w-xl">
              <div className="w-full shrink-0 px-6 pt-3 sm:px-0 sm:pt-4">
                <ProgressBar progress={progress} currentStep={currentStep} totalSteps={totalSteps} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="w-full max-w-2xl px-6 py-4 sm:mx-auto sm:py-6">
                  {currentQuestion && (
                    <PreviewQuestion
                      key={currentQuestion.guid}
                      question={currentQuestion}
                      selectedAnswers={getSelectedAnswers(currentQuestion.guid)}
                      onSelectAnswer={selectAnswer}
                      onSingleChoiceNext={goNextAfterAnswer}
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
              <div className="relative z-20 shrink-0 border-t border-base-300/30 bg-base-100">
                <div className="mx-auto max-w-xl px-6 pb-3 pt-2">
                  {skipToast && (
                    <div className="pointer-events-none mb-2 flex justify-center animate-[fadeSlideIn_0.25s_ease-out]">
                      <div className="w-full max-w-sm">
                        <SkipToastBanner kind={skipToast.kind} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className={`btn btn-ghost btn-sm rounded-xl gap-2 ${isFirst ? 'invisible' : ''}`}
                      onClick={goPrev}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                      Geri
                    </button>
                    <button type="button" className="btn btn-primary btn-sm rounded-xl gap-2 px-6" onClick={goNext}>
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
          </div>

          {!flowOpen && (
            <div className="flex min-h-0 shrink-0 flex-col items-center justify-center overflow-hidden border-t border-base-300/20 bg-base-100 pt-2 pl-3 pr-10 sm:w-[min(400px,38vw)] sm:border-l sm:border-t-0 sm:pt-0 sm:pr-14">
              <div className="flex min-h-0 flex-1 w-full items-center justify-center py-2">
                <div className="mockup-phone shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
                  <div className="mockup-phone-camera" />
                  <div className="mockup-phone-display bg-base-100">
                    <div className="flex h-full min-h-full w-full flex-col bg-base-100">
                      <div className="shrink-0 bg-base-100 px-4 pb-2 pt-12">
                        <ProgressBar progress={progress} currentStep={currentStep} totalSteps={totalSteps} />
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto bg-base-100">
                        <div className="w-full px-3 py-3">
                          {currentQuestion && (
                            <PreviewQuestion
                              key={`m-${currentQuestion.guid}`}
                              question={currentQuestion}
                              selectedAnswers={getSelectedAnswers(currentQuestion.guid)}
                              onSelectAnswer={selectAnswer}
                              onSingleChoiceNext={goNextAfterAnswer}
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
                      <div className="relative z-20 shrink-0 border-t border-base-300/30 bg-base-100 px-3 pb-3 pt-2">
                        {skipToast && (
                          <div className="pointer-events-none mb-2 flex justify-center animate-[fadeSlideIn_0.25s_ease-out]">
                            <div className="w-full max-w-xs sm:max-w-sm">
                              <SkipToastBanner kind={skipToast.kind} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            className={`btn btn-ghost btn-sm rounded-xl gap-1 ${isFirst ? 'invisible' : ''}`}
                            onClick={goPrev}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m15 18-6-6 6-6" />
                            </svg>
                            Geri
                          </button>
                          <button type="button" className="btn btn-primary btn-sm gap-1 rounded-xl px-5" onClick={goNext}>
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
              </div>
            </div>
          )}
        </div>

        {flowOpen && (
          <div className="h-[min(70vh,520px)] w-full shrink-0 animate-[slideInRight_0.3s_ease-out] border-t border-base-300/30 sm:h-auto sm:w-[min(1000px,48vw)] sm:border-l sm:border-t-0">
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
}: {
  title: string;
  onClose: () => void;
  flowOpen: boolean;
  onToggleFlow: () => void;
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
        Live Flow
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
