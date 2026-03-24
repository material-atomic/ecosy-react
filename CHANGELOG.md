# Changelog

## 0.1.0 (2026-03-22)

### Features

- **combineSlices**: merge multiple slices into a single initial state, root reducer, and event map
- **connectStore**: create a store with React bindings from combined slices
- **useSelector**: subscribe to store state with deep equality checks, re-render on change
- **useDispatch**: access the dispatch function in React components
- **createSelector**: memoized selectors with multi-input support
- **hydrate**: populate store with server-side data for SSR/SSG
- **dispatch** / **getState**: non-hook utilities for use outside components
