import type { Question, ConditionalRule, ConditionInput } from '../../types/survey';
import { SidebarTabs, type SidebarTab } from './SidebarTabs';
import { QuestionList } from './QuestionList';
import { ConditionList } from './ConditionList';

interface SidebarProps {
  questions: Question[];
  conditions: ConditionalRule[];
  selectedId: string | null;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onSelect: (guid: string) => void;
  onAdd: () => void;
  onDelete: (guid: string) => void;
  onReorder: (questions: Question[]) => void;
  onUpdate?: (guid: string, updates: Partial<Omit<Question, 'guid'>>) => void;
  onRemoveCondition: (conditionId: string) => void;
  onUpdateCondition: (conditionId: string, input: ConditionInput) => void;
}

export function Sidebar({
  questions,
  conditions,
  selectedId,
  activeTab,
  onTabChange,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
  onUpdate,
  onRemoveCondition,
  onUpdateCondition,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <SidebarTabs activeTab={activeTab} onTabChange={onTabChange} />

      {activeTab === 'questions' && (
        <>
          <div className="px-5 py-4.5 border-b border-base-300/30">
            <p className="text-sm font-semibold text-base-content/40 uppercase tracking-wide">
              Sorular
              {questions.length > 0 && (
                <span className="ml-1.5 text-primary/60">{questions.length}</span>
              )}
            </p>
            <button
              className="btn btn-primary btn-block btn-sm rounded-xl shadow-sm mt-3"
              onClick={onAdd}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Soru Ekle
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-3">
            <QuestionList
              questions={questions}
              selectedId={selectedId}
              hasConditions={conditions.length > 0}
              onSelect={onSelect}
              onDelete={onDelete}
              onReorder={onReorder}
              onUpdate={onUpdate}
            />
          </div>
        </>
      )}

      {activeTab === 'flow' && (
        <>
          <div className="px-5 py-4.5">
            <p className="text-sm font-semibold text-base-content/40 uppercase tracking-wide">
              Koşullar
              {conditions.length > 0 && (
                <span className="ml-1.5 text-primary/60">{conditions.length}</span>
              )}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pt-3 pb-3">
            <ConditionList
              conditions={conditions}
              questions={questions}
              onRemoveCondition={onRemoveCondition}
              onUpdateCondition={onUpdateCondition}
            />
          </div>
        </>
      )}
    </div>
  );
}
