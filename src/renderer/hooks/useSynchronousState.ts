import {type SetStateAction, useCallback, useRef, useState} from 'react';

/** Event-driven state: updaters run once, outside React render, even in StrictMode. */
export function useSynchronousState<T>(initial: T | (() => T)) {
    const [value, setValue] = useState(initial);
    const current = useRef(value);
    const set = useCallback((action: SetStateAction<T>) => {
        const next = typeof action === 'function' ? (action as (previous: T) => T)(current.current) : action;
        current.current = next;
        setValue(next);
    }, []);
    return [value, set, current] as const;
}
