import { supabase as supabaseClient } from './supabase';

export const supabase = supabaseClient;

function convertToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertToSnakeCase);

  const converted: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

    // For JSONB fields and status enums, keep data as-is to preserve structure
    if ((key === 'questions' && Array.isArray(obj[key])) ||
        (key === 'answerKey' && typeof obj[key] === 'object') ||
        (key === 'studentAnswers' && typeof obj[key] === 'object') ||
        key === 'status') {
      converted[snakeKey] = obj[key];
    } else {
      converted[snakeKey] = convertToSnakeCase(obj[key]);
    }
  }
  return converted;
}

function convertFromSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertFromSnakeCase);

  const converted: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    // For 'questions' field in question_banks table, keep JSONB data as-is
    // This prevents breaking the nested question objects structure
    if (key === 'questions' && Array.isArray(obj[key])) {
      converted[camelKey] = obj[key];
    } else {
      converted[camelKey] = convertFromSnakeCase(obj[key]);
    }
  }
  return converted;
}

function convertFieldToSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export const db = {
  collection: (collectionName: string) => {
    const tableName = collectionName === 'weeklyPrograms' ? 'weekly_programs' :
                     collectionName === 'contentLibrary' ? 'content_library' :
                     collectionName === 'contentAssignments' ? 'content_assignments' :
                     collectionName === 'reviewPackages' ? 'review_packages' :
                     collectionName === 'interactiveContent' ? 'interactive_content' :
                     collectionName === 'questionBanks' ? 'question_banks' :
                     collectionName === 'questionBankAssignments' ? 'question_bank_assignments' :
                     collectionName === 'publicContentShares' ? 'public_content_shares' :
                     collectionName;

    return {
      doc: (docId: string) => ({
        get: async () => {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', docId)
            .maybeSingle();

          if (error) throw error;

          return {
            exists: !!data,
            id: data?.id,
            data: () => convertFromSnakeCase(data),
          };
        },
        set: async (docData: any) => {
          const convertedData = convertToSnakeCase(docData);
          const { error } = await supabase
            .from(tableName)
            .upsert({ id: docId, ...convertedData });

          if (error) throw error;
        },
        update: async (updates: any) => {
          const convertedUpdates = convertToSnakeCase(updates);
          const { error } = await supabase
            .from(tableName)
            .update(convertedUpdates)
            .eq('id', docId);

          if (error) throw error;
        },
        delete: async () => {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', docId);

          if (error) throw error;
        },
        onSnapshot: (callback: (doc: any) => void) => {
          const channel = supabase
            .channel(`${tableName}:${docId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: tableName,
                filter: `id=eq.${docId}`
              },
              (payload) => {
                callback({
                  exists: !!payload.new,
                  id: docId,
                  data: () => convertFromSnakeCase(payload.new)
                });
              }
            )
            .subscribe();

          const initialFetch = async () => {
            const { data } = await supabase
              .from(tableName)
              .select('*')
              .eq('id', docId)
              .maybeSingle();

            if (data) {
              callback({
                exists: true,
                id: docId,
                data: () => convertFromSnakeCase(data)
              });
            }
          };

          initialFetch();

          return () => {
            supabase.removeChannel(channel);
          };
        },
      }),
      where: (field: string, op: string, value: any) => {
        const snakeField = convertFieldToSnakeCase(field);
        let query = supabase.from(tableName).select('*');

        if (op === '==') query = query.eq(snakeField, value);
        else if (op === '!=') query = query.neq(snakeField, value);
        else if (op === '>') query = query.gt(snakeField, value);
        else if (op === '<') query = query.lt(snakeField, value);
        else if (op === '>=') query = query.gte(snakeField, value);
        else if (op === '<=') query = query.lte(snakeField, value);
        else if (op === 'in') query = query.in(snakeField, value);

        const chainable = {
          where: (field2: string, op2: string, value2: any) => {
            const snakeField2 = convertFieldToSnakeCase(field2);
            if (op2 === '==') query = query.eq(snakeField2, value2);
            else if (op2 === '!=') query = query.neq(snakeField2, value2);
            return chainable;
          },
          limit: (count: number) => {
            query = query.limit(count);
            return chainable;
          },
          orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => {
            const snakeField = convertFieldToSnakeCase(field);
            query = query.order(snakeField, { ascending: direction === 'asc' });
            return chainable;
          },
          get: async () => {
            const { data, error } = await query;
            if (error) throw error;

            return {
              docs: (data || []).map(item => ({
                id: item.id,
                data: () => convertFromSnakeCase(item),
                exists: true,
              })),
              empty: !data || data.length === 0,
            };
          },
        };

        return chainable;
      },
      add: async (docData: any) => {
        const convertedData = convertToSnakeCase(docData);
        console.log(`[dbAdapter] Inserting into ${tableName}:`, convertedData);

        const { data, error } = await supabase
          .from(tableName)
          .insert([convertedData])
          .select()
          .single();

        if (error) {
          console.error(`[dbAdapter] Error inserting into ${tableName}:`, error);
          throw error;
        }

        console.log(`[dbAdapter] Successfully inserted into ${tableName}:`, data);
        return { id: data.id };
      },
      get: async () => {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) throw error;

        return {
          docs: (data || []).map(item => ({
            id: item.id,
            data: () => convertFromSnakeCase(item),
            exists: true,
          })),
          empty: !data || data.length === 0,
        };
      },
    };
  },
  batch: () => {
    const operations: Array<() => Promise<void>> = [];

    return {
      update: (docRef: any, updates: any) => {
        operations.push(async () => {
          await docRef.update(updates);
        });
      },
      set: (docRef: any, data: any) => {
        operations.push(async () => {
          await docRef.set(data);
        });
      },
      delete: (docRef: any) => {
        operations.push(async () => {
          await docRef.delete();
        });
      },
      commit: async () => {
        for (const op of operations) {
          await op();
        }
      },
    };
  },
  FieldPath: {
    documentId: () => 'id',
  },
};

export const auth = {
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { user: data.user };
  },
  signInWithEmailAndPassword: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user };
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  onAuthStateChanged: (callback: (user: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
    return () => subscription.unsubscribe();
  },
};
