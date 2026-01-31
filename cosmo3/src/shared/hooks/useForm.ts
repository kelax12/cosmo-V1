// =============================================================================
// FORM HOOKS - Hooks réutilisables pour les formulaires
// =============================================================================

import { useState, useCallback, useMemo } from 'react';

// =============================================================================
// USE FORM STATE
// =============================================================================
interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string>;
  onSubmit?: (values: T) => Promise<void> | void;
}

export function useForm<T extends Record<string, any>>({ 
  initialValues, 
  validate, 
  onSubmit 
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error on change
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(newValues ? { ...initialValues, ...newValues } : initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Run validation
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return false;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
      return true;
    } catch (error) {
      setErrors({ _form: 'Une erreur est survenue' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const isValid = useMemo(() => {
    if (!validate) return true;
    return Object.keys(validate(values)).length === 0;
  }, [values, validate]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    isValid,
    setValue,
    setFieldTouched,
    reset,
    handleSubmit,
    setErrors,
  };
}

// =============================================================================
// USE TOGGLE
// =============================================================================
export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle, setValue];
}

// =============================================================================
// USE SELECTION
// =============================================================================
export function useSelection<T>(initialSelection: T[] = []) {
  const [selected, setSelected] = useState<T[]>(initialSelection);

  const toggle = useCallback((item: T) => {
    setSelected(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item) 
        : [...prev, item]
    );
  }, []);

  const select = useCallback((item: T) => {
    setSelected(prev => prev.includes(item) ? prev : [...prev, item]);
  }, []);

  const deselect = useCallback((item: T) => {
    setSelected(prev => prev.filter(i => i !== item));
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const isSelected = useCallback((item: T) => selected.includes(item), [selected]);

  return { selected, toggle, select, deselect, clear, isSelected, setSelected };
}

// =============================================================================
// USE SEARCH FILTER
// =============================================================================
export function useSearchFilter<T>(
  items: T[],
  searchFields: (keyof T)[],
  initialSearch = ''
) {
  const [search, setSearch] = useState(initialSearch);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    
    const lowerSearch = search.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerSearch);
        }
        return false;
      })
    );
  }, [items, search, searchFields]);

  return { search, setSearch, filteredItems };
}

// =============================================================================
// USE ASYNC ACTION
// =============================================================================
export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(action: T) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await action(...args);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [action]);

  return { execute, isLoading, error };
}

// =============================================================================
// USE CONFIRMATION
// =============================================================================
export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestConfirmation = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsOpen(true);
  }, []);

  const confirm = useCallback(() => {
    pendingAction?.();
    setIsOpen(false);
    setPendingAction(null);
  }, [pendingAction]);

  const cancel = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  return { isOpen, requestConfirmation, confirm, cancel };
}
