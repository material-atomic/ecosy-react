# Changelog

## 0.3.0 (2026-04-19)

### Features

- **Store Order Factory**: Extracted tracking and selector logic into a standalone `createStoreOrder(store)` factory. This enables you to bind an optimized `useStoreOrder` hook directly to any generic `@ecosy/core` Subscriber store without going through `connectStore`.
- **Path Exports**: Exposed a new sub-export `"@ecosy/react/order"` in `package.json` to allow targeted module resolution and better tree-shaking.

### Improvements

- Refactored `connectStore` internals to delegate `useSelector` logic natively through `createStoreOrder`.
- Updated underlying dependencies `@ecosy/core` to `^0.3.4` and `@ecosy/store` to `^0.2.0`.

### Fixes

- **Build**: Fixed TypeScript `TS5069` compiler warnings by safely turning off `declarationMap` within the Rollup ESM override block. Enforced structured `sourcemap: true` Rollup emission bindings.

---
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
