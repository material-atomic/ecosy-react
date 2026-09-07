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

/* ---- what the index signature used to let through ---- */

// @ts-expect-error "Itme" is a typo; it used to type-check and render nothing
export const typo = <Listing items={users} Itme={UserRow} />;

// @ts-expect-error dense is a boolean on UserRow
export const wrongType = <Listing items={users} Item={UserRow} dense="yes" />;

// @ts-expect-error UserRow takes no "sparse"
export const unknownProp = <Listing items={users} Item={UserRow} sparse />;

// @ts-expect-error Listing supplies item per row
export const suppliedItem = <Listing items={users} Item={UserRow} item={users[0]} />;

// @ts-expect-error Listing supplies index per row
export const suppliedIndex = <Listing items={users} Item={UserRow} index={0} />;

/* ---- a required prop on Item ---- */

/* A required prop on the item component. */
function LabelledRow({ item, label }: { item: User; index: number; label: string }) {
  return <li>{label}: {item.name}</li>;
}

/* Forwarding is optional — `Listing` passes on what it is given, and does not
   undertake to satisfy `Item`'s contract. */
export const missingRequired = <Listing items={users} Item={LabelledRow} />;

// @ts-expect-error but a prop that is passed must be the right type
export const wrongRequired = <Listing items={users} Item={LabelledRow} label={1} />;

export const withRequired = <Listing items={users} Item={LabelledRow} label="x" />;
