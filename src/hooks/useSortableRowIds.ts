import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Sıralama sorusunda her satıra sabit dnd-kit id + React key.
 * Soru kimliği veya seçenek çoklu kümesi değişince yenilenir; sürükleme yalnızca permütasyon.
 */
export function useSortableRowIds(questionGuid: string, items: string[]) {
  const multisetKey = `${items.length}:${[...items].sort((a, b) => a.localeCompare(b)).join('\u0001')}`;
  const composite = `${questionGuid}::${multisetKey}`;
  const keyRef = useRef('');

  const [rowIds, setRowIds] = useState<string[]>(() =>
    items.length > 0 ? items.map(() => crypto.randomUUID()) : [],
  );

  useLayoutEffect(() => {
    if (items.length === 0) {
      setRowIds([]);
      keyRef.current = '';
      return;
    }
    if (keyRef.current === composite) return;
    keyRef.current = composite;
    setRowIds(items.map(() => crypto.randomUUID()));
  }, [composite, items.length]);

  const reorderRowIds = useCallback((oldIndex: number, newIndex: number) => {
    setRowIds((prev) => {
      if (prev.length === 0 || oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;
      if (oldIndex >= prev.length || newIndex >= prev.length) return prev;
      const next = [...prev];
      const [lifted] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, lifted);
      return next;
    });
  }, []);

  return { rowIds, reorderRowIds };
}
