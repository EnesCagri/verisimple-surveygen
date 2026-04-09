/** Boş metinli şıkta görsel anahtarı (editörde şık metnine taşınır). */
export function answerImageSlotKey(index: number): string {
  return `__slot_${index}`;
}

export function resolveChoiceAnswerImage(
  answerImages: Record<string, string>,
  answer: string,
  index: number,
): string | undefined {
  if (!answerImages || Object.keys(answerImages).length === 0) return undefined;

  const raw = answer;
  const t = raw.trim();
  const slot = answerImageSlotKey(index);
  const idxKey = String(index);

  if (answerImages[raw]) return answerImages[raw];
  if (t && answerImages[t]) return answerImages[t];
  if (answerImages[slot]) return answerImages[slot];
  if (answerImages[idxKey]) return answerImages[idxKey];

  if (t) {
    const tl = t.toLowerCase();
    for (const [k, v] of Object.entries(answerImages)) {
      if (k.trim() === t) return v;
      if (k.trim().toLowerCase() === tl) return v;
    }
  }

  return undefined;
}

export function choiceAnswerRowVisible(
  answer: string,
  index: number,
  answerImages: Record<string, string>,
): boolean {
  if (answer.trim()) return true;
  return !!(
    answerImages[answerImageSlotKey(index)] ||
    answerImages[String(index)] ||
    resolveChoiceAnswerImage(answerImages, answer, index)
  );
}

export function choiceAnswerDisplayLabel(answer: string, index: number): string {
  const t = answer.trim();
  if (t) return t;
  return `Seçenek ${index + 1}`;
}

export function choiceQuestionsHasAnyAnswerImage(answerImages: Record<string, string>): boolean {
  return Object.values(answerImages).some((v) => typeof v === 'string' && v.length > 0);
}
