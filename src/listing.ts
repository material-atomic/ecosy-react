import { createElement, Fragment, type ComponentType, type Key, type PropsWithChildren, type ReactNode } from "react";

/** What `Listing` itself consumes. Everything else belongs to `Item`. */
export interface ListingOwnProps<Data, ItemProps, Carry = undefined> {
  /** The data to render. Empty, `null` and `undefined` all render `empty`. */
  items: Data[];
  /**
   * Rendered once per entry, receiving
   * `{ ...rest, key, item, index, previous, next, carry }`.
   *
   * `previous` and `next` are the neighbouring entries, or `undefined` at the
   * ends. They cost nothing — references to entries already in the array — and
   * they are what a date separator or a run of messages from one author
   * actually needs. Computing that outside means a fresh object per row, which
   * is exactly what stops `memo(Item)` bailing out.
   *
   * Order is the only thing a list has that a set does not, so a row's
   * neighbours are part of rendering one. What they cannot answer is
   * {@link ListingOwnProps.accumulate}.
   */
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
  /**
   * Carries a value along the list, handing each row the total **as it stands
   * at that row** — a scan, not a reduce.
   *
   * `[1, 2, 3]` with `(carry, n) => carry + n` and `seed: 0` gives the first
   * row `1`, the second `3`, the third `6`. The fold runs as the row is
   * reached, so a row never sees a total that includes rows below it.
   *
   * For what {@link ListingOwnProps.Item}'s `previous` cannot answer: a number
   * running within a group, a balance after each entry, a height offset.
   *
   * Runs during render, over `items`, every time — a local, no ref. A ref
   * survives renders React discards, so a StrictMode double render or a
   * concurrent attempt thrown away would count twice, and only in development
   * or only under load. Within one render a plain variable is all a running
   * total needs.
   *
   * When the carry is an **object**, return the one you were given if nothing
   * in it changed. A fold that rebuilds it every row hands every row a new
   * prop and `memo(Item)` stops bailing out. A carry that is a number is a new
   * value each row by definition — that is the point of it — and no discipline
   * applies.
   */
  accumulate?: (carry: Carry, item: Data, index: number) => Carry;
  /** Where {@link ListingOwnProps.accumulate} starts. */
  seed?: Carry;
}

/**
 * Props for {@link Listing}: its own, plus whatever `Item` takes.
 *
 * The forwarded half is `ItemProps` minus what `Listing` supplies per row.
 * `item` and `index` come from the data — one value each, per row — so a
 * caller cannot meaningfully pass them and anything it did pass would be
 * overwritten. Leaving them in would make an editor offer `item` as a prop of
 * `<Listing>`, which is a suggestion to write something that cannot work.
 *
 * `Partial`, because forwarding is optional: `Listing` passes on what it is
 * given and does not undertake to satisfy `Item`'s own contract. Requiring
 * every prop `Item` requires would turn a list renderer into a wrapper that
 * has to know what each row needs.
 *
 * The types are not partial. A prop that *is* passed has to be one `Item`
 * takes, with the type it declares.
 *
 * It used to be `[x: string]: any`, which accepted anything at all: a
 * misspelled `Itme={Row}`, a `dense="yes"` where a boolean was wanted, a prop
 * the item does not take. All of those type-checked.
 */
export type ListingProps<Data, ItemProps, Carry = undefined> =
  ListingOwnProps<Data, ItemProps, Carry> &
  Partial<Omit<ItemProps, "item" | "index" | "previous" | "next" | "carry">>;

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
export function Listing<Data, ItemProps extends { item: Data }, Carry = undefined>(
  props: ListingProps<Data, ItemProps, Carry>,
): ReactNode {
  const {
    items, Item, Container = Fragment, empty = null,
    itemKey, keyExtractor, accumulate, seed,
    ...rest
  } = props;

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

  /* A local, folded as the map walks. See `accumulate` for why this is neither
     a ref nor memoised. */
  let carry = seed as Carry;

  return createElement(Container, {
    children: items.map((item, index) => {
      /* Before the row is built, so the row receives the total INCLUDING
         itself — the scan the option describes, not a lagging one. */
      if (accumulate) carry = accumulate(carry, item, index);

      return createElement(Item, {
        ...rest,
        key: keyOf(item, index),
        item,
        index,
        previous: index > 0 ? items[index - 1] : undefined,
        next: index + 1 < items.length ? items[index + 1] : undefined,
        carry,
      } as unknown as ItemProps);
    })
  });
}
