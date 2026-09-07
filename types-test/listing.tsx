/**
 * `Listing` from a caller's side — the keying in particular, which was the
 * component's one documented "render the map yourself instead" caveat.
 */

import { Listing } from "../src/listing";

interface User { id: string; name: string }

function UserRow({ item, index, dense }: { item: User; index: number; dense?: boolean }) {
  return <tr className={dense ? "tight" : ""}>{index + 1}. {item.name}</tr>;
}

const users: User[] = [{ id: "a", name: "A" }];

/* Position, still the default. */
export const byPosition = <Listing items={users} Item={UserRow} />;

/* A property name — checked against the item type. */
export const byProperty = <Listing items={users} Item={UserRow} itemKey="id" />;

/* A function, for a composite or derived key — React Native's name. */
export const byExtractor = (
  <Listing items={users} Item={UserRow} keyExtractor={(user, index) => `${user.id}:${index}`} />
);

// @ts-expect-error itemKey is a property name; a function is keyExtractor
export const functionOnItemKey = <Listing items={users} Item={UserRow} itemKey={(u: User) => u.id} />;

/* Extra props still forward. */
export const withRest = <Listing items={users} Item={UserRow} itemKey="id" dense />;

// @ts-expect-error "nope" is not a property of User
export const badProperty = <Listing items={users} Item={UserRow} itemKey="nope" />;

/* A list of primitives has no property to key on, so only position or a
   function is available. */
const names: string[] = ["a", "b"];
function NameRow({ item }: { item: string; index: number }) {
  return <li>{item}</li>;
}

export const primitives = <Listing items={names} Item={NameRow} />;
export const primitivesByFn = <Listing items={names} Item={NameRow} keyExtractor={(n) => n} />;

// @ts-expect-error a list of primitives has no property to key on
export const primitivesByProperty = <Listing items={names} Item={NameRow} itemKey="length" />;
