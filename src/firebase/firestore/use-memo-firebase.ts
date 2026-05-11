
'use client';

import { useMemo, useRef } from 'react';

/**
 * A hook to stabilize Firebase references (Queries, DocumentReferences, etc.)
 * that are created dynamically within a component.
 * 
 * @param factory A function that returns the Firebase object.
 * @param deps Dependency array for the factory function.
 * @returns The stabilized Firebase object.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<T | null>(null);
  const prevDeps = useRef<any[]>([]);

  const depsChanged = 
    deps.length !== prevDeps.current.length || 
    deps.some((dep, i) => dep !== prevDeps.current[i]);

  if (depsChanged || ref.current === null) {
    ref.current = factory();
    prevDeps.current = deps;
  }

  return ref.current!;
}
