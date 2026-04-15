/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";

import { isEqual } from "@ecosy/core/utilities";
import { configureStore } from "@ecosy/store";
import type {
  SliceMap,
  CombinedState,
  CombinedActions,
  ConfigureStoreOptions,
} from "@ecosy/store";

// --- connectStore ---

type Selector<State, Selected> = (state: State) => Selected;

export interface ConnectStoreOptions<Slices extends SliceMap<any>, Signals extends string[] = []>
  extends ConfigureStoreOptions<Slices, Signals> {}

/** Result of {@link connectStore}, providing React bindings for a combined store. */
export interface ConnectStoreResult<Slices extends SliceMap<any>> {
  store: ReturnType<typeof configureStore>["store"];
  dispatch: (action: CombinedActions<Slices>) => void;
  getState: () => CombinedState<Slices>;
  hydrate: (state: Partial<CombinedState<Slices>>) => void;
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
 * Delegates core logic to `configureStore`, then layers React hooks on top.
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
export function connectStore<Slices extends SliceMap<any>, Signals extends string[] = []>(
  options: ConnectStoreOptions<Slices, Signals>,
): ConnectStoreResult<Slices> {
  // 1. Delegate toàn bộ pure logic cho configureStore
  const { store, dispatch, getState, hydrate } = configureStore(options);

  type State = CombinedState<Slices>;

  // 2. useSelector — subscribe to store, re-render on change
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

  // 3. useDispatch
  function useDispatch() {
    return dispatch;
  }

  // 4. createSelector — memoized selector
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
