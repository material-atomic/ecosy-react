/* eslint-disable @typescript-eslint/no-explicit-any */
import { createElement, Fragment, type ComponentType, type PropsWithChildren, type ReactNode } from "react";

/** Props for {@link Listing}. Any property beyond these is forwarded to every `Item`. */
export interface ListingProps<Data, ItemProps> {
  /** The data to render. Empty, `null` and `undefined` all render `empty`. */
  items: Data[];
  /** Rendered once per entry, receiving `{ ...rest, key, item, index }`. */
  Item: ComponentType<ItemProps>;
  /** Wraps the items and receives only `children`. Defaults to `Fragment`. */
  Container?: ComponentType<PropsWithChildren>;
  /** Rendered in place of the container when there is nothing. Defaults to `null`. */
  empty?: ReactNode;
  [x: string]: any;
}

/**
 * Renders a list without the `items.map(...)` boilerplate, and without every
 * call site deciding for itself what "no results" looks like.
 *
 * Items are keyed by array index, so a list that reorders makes React reuse the
 * wrong element and any state inside a row follows the position rather than the
 * data. Render the `map` yourself with a stable key when that matters.
 *
 * @example
 * <Listing
 *   items={users}
 *   Item={UserRow}
 *   Container={Table}
 *   empty={<EmptyState label="No users" />}
 *   dense
 * />
 *
 * @template Data - The type of one entry in `items`.
 * @template ItemProps - The props of `Item`, which must accept `item`.
 * @param props - The data, the item component, and anything to forward to it.
 * @returns The wrapped items, or `empty` when there is nothing to render.
 */
export function Listing<Data, ItemProps extends { item: Data }>(
  props: ListingProps<Data, ItemProps>,
): ReactNode {
  const { items, Item, Container = Fragment, empty = null, ...rest } = props;

  if (!items || items.length === 0) {
    return empty;
  }

  return createElement(Container, {
    children: items.map((item, index) => createElement(Item, {
      ...rest,
      key: index,
      item,
      index
    } as unknown as ItemProps))
  });
}
