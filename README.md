# @ecosy/react

React bindings for `@ecosy/store` — hooks, selectors, and store connection.

## Installation

```bash
npm install @ecosy/react react
# or
yarn add @ecosy/react react
```

> **Note:** `@ecosy/core` and `@ecosy/store` are installed automatically as dependencies.
> `react` ≥ 16.8 is required as a peer dependency.

## Quick start

```ts
import { createSlice, type PayloadAction } from "@ecosy/store";
import { combineSlices, connectStore } from "@ecosy/react";

// 1. Create slices
const counterSlice = createSlice({
  name: "counter",
  initialState: { count: 0 },
  reducers: {
    increment: (state) => ({ ...state, count: state.count + 1 }),
    add: (state, action: PayloadAction<number>) => ({
      ...state,
      count: state.count + action.payload,
    }),
  },
});

// 2. Combine slices
const slices = combineSlices({
  counter: counterSlice,
});

// 3. Connect to React
const { useSelector, useDispatch, getState, dispatch } = connectStore({ slices });
```

## API

### `combineSlices(slices)`

Combines multiple slices into a single initial state, root reducer, and event map.

```ts
import { combineSlices } from "@ecosy/react";

const slices = combineSlices({
  counter: counterSlice,
  todos: todosSlice,
});

slices.initialState; // { counter: { count: 0 }, todos: { items: [] } }
slices.reducer;      // combined root reducer
slices.events;       // merged event channels
```

### `connectStore(options)`

Connects combined slices to a store and returns React hooks and utilities.

```ts
const {
  store,          // underlying Subscriber store
  useSelector,    // React hook to select state
  useDispatch,    // React hook to get dispatch function
  dispatch,       // dispatch an action (non-hook)
  getState,       // get current state (non-hook)
  hydrate,        // hydrate state from server
  createSelector, // create memoized selector
} = connectStore({ slices });
```

#### Options

| Option | Type | Description |
|--|--|--|
| `slices` | `CombineSlicesResult` | Result from `combineSlices` |
| `signals` | `string[]` | Optional fire-and-forget event names |

---

### `useSelector(selector)`

Subscribes a React component to store state. Re-renders only when the selected value changes (deep equality).

```tsx
function Counter() {
  const count = useSelector((state) => state.counter.count);
  return <span>{count}</span>;
}
```

### `useDispatch()`

Returns the dispatch function for use in components.

```tsx
function IncrementButton() {
  const dispatch = useDispatch();
  return (
    <button onClick={() => dispatch(counterSlice.actions.increment())}>
      +1
    </button>
  );
}
```

### `createSelector(...selectors, combiner)`

Creates a memoized selector. Only recomputes when input selectors return new values.

```ts
const selectDoubleCount = createSelector(
  (state) => state.counter.count,
  (count) => count * 2,
);

// In component
const doubled = useSelector(selectDoubleCount);
```

Multi-input selectors:

```ts
const selectSummary = createSelector(
  (state) => state.counter.count,
  (state) => state.todos.items,
  ([count, items]) => `${count} count, ${items.length} todos`,
);
```

### `hydrate(partialState)`

Hydrate the store with server-side data (e.g., in SSR/SSG scenarios).

```ts
// In a server component or getServerSideProps
hydrate({
  counter: { count: 42 },
});
```

### `dispatch(action)` / `getState()`

Non-hook versions for use outside React components.

```ts
dispatch(counterSlice.actions.increment());
const state = getState();
```

---

## Related packages

| Package | Description |
|--|--|
| [`@ecosy/core`](https://github.com/material-atomic/ecosy-core) | Types, utilities, and pub/sub subscriber |
| [`@ecosy/store`](https://github.com/material-atomic/ecosy-store) | Slices, reducers, and store creation |

## License

MIT
