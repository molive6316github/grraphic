import { useState, useCallback, useRef } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface HistoryActions {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  reset: (newPresent: any) => void;
}

const MAX_HISTORY_SIZE = 100;

export function useHistory<T>(initialState: T): [T, (newState: T | ((prev: T) => T), description?: string) => void, HistoryActions] {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const [descriptions, setDescriptions] = useState<string[]>([]);
  const lastActionTime = useRef<number>(Date.now());
  const isApplyingHistory = useRef(false);

  const setState = useCallback((newState: T | ((prev: T) => T), description: string = 'Change') => {
    if (isApplyingHistory.current) {
      return;
    }

    setHistory(currentHistory => {
      const actualNewState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(currentHistory.present)
        : newState;

      if (JSON.stringify(actualNewState) === JSON.stringify(currentHistory.present)) {
        return currentHistory;
      }

      const newPast = [...currentHistory.past, currentHistory.present];
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: actualNewState,
        future: []
      };
    });

    setDescriptions(prev => {
      const newDescriptions = [...prev, description];
      if (newDescriptions.length > MAX_HISTORY_SIZE) {
        newDescriptions.shift();
      }
      return newDescriptions;
    });

    lastActionTime.current = Date.now();
  }, []);

  const undo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.past.length === 0) {
        return currentHistory;
      }

      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);

      isApplyingHistory.current = true;
      setTimeout(() => {
        isApplyingHistory.current = false;
      }, 0);

      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future]
      };
    });

    setDescriptions(prev => prev.slice(0, -1));
  }, []);

  const redo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.future.length === 0) {
        return currentHistory;
      }

      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);

      isApplyingHistory.current = true;
      setTimeout(() => {
        isApplyingHistory.current = false;
      }, 0);

      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const clear = useCallback(() => {
    setHistory(currentHistory => ({
      past: [],
      present: currentHistory.present,
      future: []
    }));
    setDescriptions([]);
  }, []);

  const reset = useCallback((newPresent: T) => {
    isApplyingHistory.current = true;
    setHistory({
      past: [],
      present: newPresent,
      future: []
    });
    setDescriptions([]);
    setTimeout(() => {
      isApplyingHistory.current = false;
    }, 0);
  }, []);

  const actions: HistoryActions = {
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
    reset
  };

  return [history.present, setState, actions];
}

export function useUndoRedo<T>(
  state: T,
  setState: (state: T | ((prev: T) => T)) => void
): HistoryActions {
  const [_present, _setState, actions] = useHistory(state);

  return actions;
}
