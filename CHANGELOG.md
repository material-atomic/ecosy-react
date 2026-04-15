# Changelog

## 0.2.0 (2026-04-15)

### Improvements

- **connectStore**: core logic now delegates to `configureStore` from `@ecosy/store`. React bindings are layered on top, keeping SSR, Worker, and React code paths consistent.
- **Types**: `ConnectStoreOptions` now extends `ConfigureStoreOptions` from `@ecosy/store`.

### Breaking Changes

- **`combineSlices` moved to `@ecosy/store`**. Import it from `@ecosy/store` instead of `@ecosy/react`:

  ```diff
  - import { combineSlices, connectStore } from "@ecosy/react";
  + import { combineSlices } from "@ecosy/store";
  + import { connectStore } from "@ecosy/react";
  ```

- The `SliceMap`, `CombineSlicesResult`, `CombinedState`, and `CombinedEvents` helper types are also now sourced from `@ecosy/store`.

---

## 0.1.0 (2026-03-22)

### Features

- **combineSlices**: merge multiple slices into a single initial state, root reducer, and event map
- **connectStore**: create a store with React bindings from combined slices
- **useSelector**: subscribe to store state with deep equality checks, re-render on change
- **useDispatch**: access the dispatch function in React components
- **createSelector**: memoized selectors with multi-input support
- **hydrate**: populate store with server-side data for SSR/SSG
- **dispatch** / **getState**: non-hook utilities for use outside components
