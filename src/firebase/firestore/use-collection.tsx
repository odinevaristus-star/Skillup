
'use client';

import { useState, useEffect } from 'react';
import { Query, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useAuth } from '../provider';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const auth = useAuth();

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        } as T));
        setData(items);
        setLoading(false);
        setError(null);
      },
      async (serverError: any) => {
        // Handle common Firestore errors gracefully
        const isPermissionError = serverError?.code === 'permission-denied';
        
        // If it's a permission error, we emit a specialized error for the global listener
        if (isPermissionError) {
          const permissionError = new FirestorePermissionError({
            path: 'collection_query', // General path since Query object doesn't expose path easily
            operation: 'list',
          });
          
          // Only emit global error if the user is authenticated (prevents guest flashes)
          if (auth.currentUser) {
            errorEmitter.emit('permission-error', permissionError);
          }
          
          setError(permissionError);
        } else {
          setError(serverError);
        }
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query, auth.currentUser?.uid]);

  return { data, loading, error };
}
