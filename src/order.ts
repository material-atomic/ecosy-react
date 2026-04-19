import type { LiteralObject, Subscriber } from "@ecosy/core";
import { useEffect, useRef, useState } from "react";

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
export function createStoreOrder<State extends LiteralObject, Store extends Subscriber<State>>(store: Store) {
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
