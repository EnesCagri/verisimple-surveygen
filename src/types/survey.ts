export const QuestionType = {
  SingleChoice: 1,
  MultipleChoice: 2,
  TextEntry: 3,
  // ImageVideo: 4,       // Future
  MatrixLikert: 5,
  Sortable: 6,
  Rating: 7,
  RichText: 8,
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

/**
 * Type-specific settings for questions.
 * Only relevant fields are set per question type — keeps the base interface clean.
 */
export interface QuestionSettings {
  /* ── TextEntry ── */
  /** Maximum character limit (default 1250) */
  maxLength?: number;
  /** Placeholder text shown in the input */
  placeholder?: string;

  /* ── Rating ── */
  /** Number of stars / rating levels (default 5) */
  ratingCount?: number;
  /** Labels for the low and high extremes */
  ratingLabels?: { low: string; high: string };

  /* ── MatrixLikert ── */
  /** Row labels (sub-questions / statements) */
  rows?: string[];
  /** Column labels (scale points, e.g. "Kesinlikle Katılmıyorum" … "Kesinlikle Katılıyorum") */
  columns?: string[];
  /** Whether each row allows single or multiple selections */
  matrixType?: 'single' | 'multiple';

  /* ── RichText ── */
  /** Rich text / HTML content displayed to the respondent */
  richContent?: string;
  /** Whether this block also collects a text response from the user */
  hasResponse?: boolean;
  /** Max character limit for the response (only when hasResponse is true) */
  responseMaxLength?: number;
  /** Placeholder for the response input */
  responsePlaceholder?: string;

  /* ── Control Question ── */
  /** Whether this is a control/attention check question */
  isControlQuestion?: boolean;
  /** Correct answer(s) for control questions (array for multiple choice, single value for others) */
  correctAnswer?: string[];

  /* ── Answer Images ── */
  /** Map of answer text → image URL/base64 for choice questions with image options */
  answerImages?: Record<string, string>;

  // Future:
  // hasOtherOption?: boolean;  // Choice: "Diğer" text field
}

export interface Question {
  order: number;
  text: string;
  type: QuestionType;
  answers: string[];
  guid: string;
  /** Type-specific configuration. Omitted when not needed. */
  settings?: QuestionSettings;
  /** Whether this question is required (must be answered before proceeding) */
  required?: boolean;
  /** Optional image URL/base64 displayed alongside the question text */
  image?: string;
}

/**
 * Answer with optional image for choice questions.
 * Used in answerImages map (answer text → image URL/base64).
 */
export type AnswerImages = Record<string, string>;

/**
 * Condition action types:
 *  - jump_to: Skip directly to a target question
 *  - end_survey: End the survey immediately
 */
export type ConditionAction =
  | { type: 'jump_to'; targetQuestionId: string }
  | { type: 'end_survey' };

/**
 * Comparison operators grouped by question type:
 *
 *  Universal : 'any'
 *  Choice    : 'equals'
 *  Rating    : 'eq' | 'gt' | 'gte' | 'lt' | 'lte'
 *  TextEntry : 'contains' | 'not_contains' | 'exact' | 'is_empty' | 'is_not_empty'
 *  Matrix    : 'row_equals'
 */
export type ConditionOperator =
  | 'any'
  | 'equals'
  | 'eq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'not_contains' | 'exact' | 'is_empty' | 'is_not_empty'
  | 'row_equals';

/**
 * A conditional rule with operator support.
 *
 *   "If source question's answer matches `operator`(`value`) → perform action."
 *
 *   Legacy: when `operator` is undefined, behaves as 'equals' (or 'any' if answer === '*').
 */
export interface ConditionalRule {
  id: string;
  sourceQuestionId: string;
  /** Comparison value (answer text, number-as-string, substring, column label, or '*') */
  answer: string;
  action: ConditionAction;
  /** Comparison operator. Defaults to 'equals' for choices, 'any' for '*'. */
  operator?: ConditionOperator;
  /** MatrixLikert only: which row index (0-based) to evaluate */
  rowIndex?: number;
}

/**
 * Data bundle for creating / updating a condition (excludes id & sourceQuestionId).
 */
export interface ConditionInput {
  answer: string;
  action: ConditionAction;
  operator?: ConditionOperator;
  rowIndex?: number;
}

/**
 * Node positions in the flow diagram (stored per question guid).
 * Used to preserve user's layout in both Builder and Preview Live Flow.
 */
export interface NodePositions {
  /** Question guid → position */
  [questionGuid: string]: { x: number; y: number } | undefined;
  /** Special key for start node */
  __start__?: { x: number; y: number };
  /** Special key for end node */
  __end__?: { x: number; y: number };
  /** Special key for invalid end node */
  __invalid_end__?: { x: number; y: number };
}

/**
 * Sequential edge management:
 * - blockedEdges: Edge IDs that should NOT be created automatically (user deleted them)
 * - customEdges: Additional sequential edges that user manually created
 */
export interface SequentialEdges {
  /** Blocked sequential edge IDs (e.g., "seq-Q1-Q2") */
  blockedEdges?: string[];
  /** Custom sequential edges (source → target) */
  customEdges?: Array<{ source: string; target: string }>;
}

export interface Survey {
  id: string;
  title: string;
  questions: Question[];
  conditions: ConditionalRule[];
  /** Optional: saved node positions from FlowCanvas */
  nodePositions?: NodePositions;
  /** Optional: sequential edge management (blocked/custom edges) */
  sequentialEdges?: SequentialEdges;
  createdAt: string;
  updatedAt: string;
}
