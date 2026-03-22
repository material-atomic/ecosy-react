/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";

import { isEqual } from "@ecosy/core/utilities";
import { createStore } from "@ecosy/store";
import type { Slice, AnyAction, Reducers } from "@ecosy/store";
import type { ExtendedEventExpect } from "@ecosy/core/subscriber";
import type { LiteralObject, PartialLiteral } from "@ecosy/core/types";

// --- combineSlices ---

type SliceMap<State extends LiteralObject = {}> = {
  [Key in keyof State]: [State[Key]] extends [LiteralObject]
    ? Slice<State[Key], any, any>
    : never;
};

type CombinedState<Slices extends SliceMap<any>> = [Slices] extends [SliceMap<infer State>]
  ? State
  : never;

type CombinedEvents<Slices extends SliceMap<any>> = {
  [K in keyof Slices]: [Slices[K]] extends [{ events: infer Events }]
    ? [Events] extends [{}]
      ? { [E in keyof Events]: Events[E] }
      : never
    : never;
};

type Reducer<State, Action = AnyAction> = (state: State, action: Action) => State;

/** Result of {@link combineSlices}, containing merged initial state, root reducer, and event map. */
export interface CombineSlicesResult<Slices extends SliceMap> {
  initialState: CombinedState<Slices>;
  reducer: Reducer<CombinedState<Slices>, CombinedActions<Slices>>;
  events: CombinedEvents<Slices>;
}

/**
 * Combines multiple slices into a single initial state, root reducer, and event map.
 * The root reducer delegates each action to the appropriate slice reducer.
 *
 * @param slices - A map of slice name → Slice instance.
 * @returns An object with `initialState`, `reducer`, and `events`.
 */
export function combineSlices<Slices extends SliceMap<any>>(slices: Slices) {
  const initialState = {} as CombinedState<Slices>;
  const events: Record<string, Record<string, string>> = {};

  for (const key in slices) {
    initialState[key as unknown as keyof CombinedState<Slices>] = slices[key].initialState;
    events[key] = slices[key].events[slices[key].name as string] ?? {};
  }

  type Action = CombinedActions<Slices>;

  const reducer = (state: CombinedState<Slices> = initialState, action: Action) => {
    let changed = false;
    const next = { ...state };

    for (const key in slices) {
      const prev = state[key as unknown as keyof CombinedState<Slices>];
      const sliceNext = slices[key].reducer(prev, action as AnyAction);

      if (!isEqual(prev, sliceNext)) {
        next[key as unknown as keyof CombinedState<Slices>] = sliceNext;
        changed = true;
      }
    }

    return changed ? next : state;
  };

  return { initialState, reducer, events } as unknown as CombineSlicesResult<Slices>;
}

// --- connectStore ---

type Selector<State, Selected> = (state: State) => Selected;

// Extract union of all action return types from combined slices
type CombinedActions<Slices extends SliceMap<any>> = {
  [K in keyof Slices]: Slices[K] extends { actions: infer A }
    ? A extends Record<string, (...args: any[]) => infer R>
      ? R
      : never
    : never;
}[keyof Slices];

export interface ConnectStoreOptions<
  Slices extends SliceMap<any>,
  Signals extends string[] = [],
> {
  slices: CombineSlicesResult<Slices>;
  signals?: Signals;
}

/** Result of {@link connectStore}, providing React bindings for a combined store. */
export interface ConnectStoreResult<Slices extends SliceMap<any>> {
  store: ReturnType<typeof createStore>["store"];
  dispatch: (action: CombinedActions<Slices>) => void;
  getState: () => CombinedState<Slices>;
  hydrate: (state: PartialLiteral<CombinedState<Slices>>) => void;
  useSelector: <Selected>(selector: (state: CombinedState<Slices>) => Selected) => Selected;
  useDispatch: () => (action: CombinedActions<Slices>) => void;
  createSelector: {
    <Result, R1>(
      s1: Selector<CombinedState<Slices>, R1>,
      combiner: Selector<R1, Result>,
    ): Selector<CombinedState<Slices>, Result>;
    <Result, R1, R2>(
      s1: Selector<CombinedState<Slices>, R1>,
      s2: Selector<CombinedState<Slices>, R2>,
      combiner: Selector<[R1, R2], Result>,
    ): Selector<CombinedState<Slices>, Result>;
    <Result, R1, R2, R3>(
      s1: Selector<CombinedState<Slices>, R1>,
      s2: Selector<CombinedState<Slices>, R2>,
      s3: Selector<CombinedState<Slices>, R3>,
      combiner: Selector<[R1, R2, R3], Result>,
    ): Selector<CombinedState<Slices>, Result>;
    <Result, Selectors extends Array<Selector<any, Result>>>(
      ...funcs: [...selectors: Selectors, combiner: (...args: Array<Selectors[number]>) => Result]
    ): Selector<CombinedState<Slices>, Result>;
  };
}

/**
 * Connects combined slices to a store and provides React hooks for state management.
 * Returns `useSelector`, `useDispatch`, `dispatch`, `getState`, `hydrate`, and `createSelector`.
 *
 * @param options - Options including `slices` (from {@link combineSlices}) and optional `signals`.
 * @returns A {@link ConnectStoreResult} with React-integrated store bindings.
 *
 * @example
 * ```ts
 * const { useSelector, useDispatch } = connectStore({ slices: combined });
 *
 * function Counter() {
 *   const count = useSelector((s) => s.counter.count);
 *   const dispatch = useDispatch();
 *   return <button onClick={() => dispatch(actions.increment())}>({count})</button>;
 * }
 * ```
 */
export function connectStore<
  Slices extends SliceMap<any>,
  Signals extends string[] = [],
>(
  options: ConnectStoreOptions<Slices, Signals>,
): ConnectStoreResult<Slices> {
  const { slices, signals } = options;
  const { initialState, reducer, events } = slices;

  type State = CombinedState<Slices>;
  type Events = CombinedEvents<Slices> & ExtendedEventExpect;

  // 1. Create store via createStore
  const { store } = createStore<State, Reducers<State, AnyAction>, Events, never, Signals>({
    initialState,
    extraEvents: events as Events,
    signals,
  });

  type Action = CombinedActions<Slices>;

  // 2. Dispatch: run combined reducer → setState → dispatch channel
  function dispatch(action: Action) {
    const current = store.getState() as State;
    const next = reducer(current, action);
    const act = action as Record<string, unknown>;

    if (!isEqual(store.getState(), next)) {
      store.setState(next);
    }

    if (typeof act.type === "string") {
      store.dispatch(act.type, action);
    }
  }

  // 3. getState
  function getState() {
    return store.getState() as State;
  }

  // 4. Hydrate: set server data into client store
  function hydrate(state: PartialLiteral<State>) {
    store.setState(state);
  }

  // 5. useSelector — subscribe to store, re-render on change
  function useSelector<Selected>(selector: (state: State) => Selected): Selected {
    const selectorRef = useRef(selector);

    useEffect(() => {
      selectorRef.current = selector;
    });

    const [selected, setSelected] = useState(() => selector(getState()));

    useEffect(() => {
      function handleChange() {
        const next = selectorRef.current(getState());
        setSelected((prev) => (isEqual(prev, next) ? prev : next));
      }

      handleChange();
      return store.onStateChange(handleChange);
    }, []);

    return selected;
  }

  // 6. useDispatch
  function useDispatch() {
    return dispatch;
  }

  // 7. createSelector — memoized selector
  function createSelector<Result, R1>(
    s1: (state: State) => R1,
    combiner: (r1: R1) => Result,
  ): (state: State) => Result;
  function createSelector<Result, R1, R2>(
    s1: (state: State) => R1,
    s2: (state: State) => R2,
    combiner: (r1: R1, r2: R2) => Result,
  ): (state: State) => Result;
  function createSelector<Result, R1, R2, R3>(
    s1: (state: State) => R1,
    s2: (state: State) => R2,
    s3: (state: State) => R3,
    combiner: (r1: R1, r2: R2, r3: R3) => Result,
  ): (state: State) => Result;
  function createSelector<Result, Selectors extends Array<Selector<any, Result>>>(
    ...funcs: [...selectors: Selectors, combiner: (...args: Array<Selectors[number]>) => Result]
  ): Selector<State, Result> {
    let lastInputs: unknown[] | null = null;
    let lastResult: Result = null as Result;

    return (state: State) => {
      const combiner = funcs[funcs.length - 1] as (...args: Array<Selectors[number]>) => Result;
      const selectors = funcs.slice(0, -1) as unknown as Selectors;
      const results = selectors.map((selector) => (selector as (s: State) => unknown)(state));

      if (
        lastInputs &&
        lastInputs.length === results.length &&
        results.every((value, index) => isEqual(value, lastInputs![index]))
      ) {
        return lastResult;
      }

      lastInputs = results;
      lastResult = combiner(...(results as Array<Selectors[number]>));

      return lastResult;
    };
  }

  return {
    store,
    dispatch,
    getState,
    hydrate,
    useSelector,
    useDispatch,
    createSelector,
  } as unknown as ConnectStoreResult<Slices>;
}
