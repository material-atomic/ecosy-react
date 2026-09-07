import type { LiteralObject, Subscriber } from "@ecosy/core";
import { useEffect, useRef, useState } from "react";

/**
 * The hook {@link createStoreOrder} returns.
 *
 * `Ordered` is whatever the selector picks out — the type on the left of the
 * assignment:
 *
 * ```ts
 * const files: FileDTO[] = useSelector((state) => state.project.files);
 * ```
 *
 * Named here rather than in `@ecosy/store` because the shape only makes sense
 * as a hook: it takes no state. A store-level selector would be
 * `(state: State) => Ordered` and the caller would pass the state in. This one
 * reads the store and subscribes to it, which is a rendering concern and needs
 * React to be the thing calling it.
 *
 * ```ts
 * export const useSelector: StoreSelector<RootState> = createStoreOrder(store);
 * ```
 */
export type StoreSelector<State> = <Ordered>(selector: (state: State) => Ordered) => Ordered;

/**
 * Creates a React hook bound to a specific `@ecosy/core` store instance.
 * The generated hook acts as a selector bridge, re-rendering the component 
 * only when the selected portion of the state changes.
 * 
 * @example
 * const useOrder = createStoreOrder(myStore);
 * const status = useOrder(state => state.status);
 * 
 * @template State - The strict literal structure representing the store's state.
 * @template Store - The type of the subscriber store.
 * @param store - The store instance to subscribe to.
 * @returns A strictly typed `useOrder` hook referencing the provided store.
 */
export function createStoreOrder<State extends LiteralObject, Store extends Subscriber<State>>(
  store: Store,
): StoreSelector<State> {
  /**
   * Subscribes to the store and extracts a specific piece of state.
   * Leverages shallow equality to prevent unnecessary React re-renders.
   * 
   * @template Ordered - The specific type of the data returned by the selector.
   * @param selector - A pure function taking the entire state and returning the desired slice.
   * @returns The selected piece of state.
   */
  return function useStoreOrder<Ordered>(selector: (state: State) => Ordered): Ordered {
    const selectorRef = useRef(selector);

    useEffect(() => {
      selectorRef.current = selector;
    });

    const [selected, setSelected] = useState(() => selector(store.getState()));

    useEffect(() => {
      function handleChange() {
        const next = selectorRef.current(store.getState());
        setSelected((prev) => (store.shallow.isEqual(prev, next) ? prev : next));
      }

      handleChange();
      return store.onStateChange(handleChange);
    }, []);

    return selected;
  }
}
