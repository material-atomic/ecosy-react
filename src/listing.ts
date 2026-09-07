/* eslint-disable @typescript-eslint/no-explicit-any */
import { createElement, Fragment, type ComponentType, type Key, type PropsWithChildren, type ReactNode } from "react";

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
  /**
   * The property that identifies a row, checked against the item type.
   *
   * The shorthand for the common case. Anything else — a composite key, a
   * derived one, a list of primitives — is {@link ListingProps.keyExtractor}.
   */
  itemKey?: Data extends object ? keyof Data : never;
  /**
   * Derives a row's key. React Native's name and signature.
   *
   * Takes precedence over `itemKey`. Without either, rows are keyed by
   * position, which is correct only for a list that never reorders — see
   * {@link Listing}.
   */
  keyExtractor?: (item: Data, index: number) => Key;
  [x: string]: any;
}

/**
 * Renders a list without the `items.map(...)` boilerplate, and without every
 * call site deciding for itself what "no results" looks like.
 *
 * Give any list that can reorder a key. Without one, rows are keyed by
 * position: React then reuses the wrong element on an insert, a removal or a
 * sort, and state inside a row — an open menu, a focused input, a running
 * transition — follows the position rather than the data.
 *
 * ```tsx
 * <Listing items={users} Item={UserRow} itemKey="id" />
 * <Listing items={users} Item={UserRow} keyExtractor={(user) => user.id} />
 * ```
 *
 * Position remains the default: it is what a list of primitives has, and
 * inventing an identity for data that carries none would be wrong more quietly
 * than falling back is.
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
  const { items, Item, Container = Fragment, empty = null, itemKey, keyExtractor, ...rest } = props;

  if (!items || items.length === 0) {
    return empty;
  }

  if (keyExtractor && itemKey !== undefined) {
    console.warn(
      `[Listing] both keyExtractor and itemKey "${String(itemKey)}" were given; ` +
        "keyExtractor is used and itemKey is ignored.",
    );
  }

  /* One warning per render, not per row: a thousand rows missing the property
     is one mistake, and reporting it a thousand times buries the console it is
     trying to reach. */
  let reported = false;

  const keyOf = (item: Data, index: number): Key => {
    if (typeof keyExtractor === "function") return keyExtractor(item, index);

    if (itemKey !== undefined && item !== null && typeof item === "object") {
      const value = (item as Record<PropertyKey, unknown>)[itemKey as PropertyKey];

      /* A key has to be a string or a number. Anything else — undefined on a
         row missing the field, an object, a Date — would be coerced by React
         into something that collides with every other row it coerces the same
         way, so position is the safer answer and the caller is told. */
      if (typeof value === "string" || typeof value === "number") return value;

      if (!reported) {
        reported = true;
        console.warn(
          `[Listing] itemKey "${String(itemKey)}" is ${value === undefined ? "missing" : typeof value} ` +
            `on the item at index ${index}; that row falls back to its position.`,
        );
      }
    }

    return index;
  };

  return createElement(Container, {
    children: items.map((item, index) => createElement(Item, {
      ...rest,
      key: keyOf(item, index),
      item,
      index
    } as unknown as ItemProps))
  });
}
