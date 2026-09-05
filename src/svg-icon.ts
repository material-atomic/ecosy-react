import { createElement, type SVGProps } from "react";

/** Props accepted by a component built with {@link createSvgIcon}. */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "children"> {
  /** Width and height in px when neither is given directly. Defaults to `24`. */
  size?: number;
  /** Shorthand for `stroke`, and wins over an explicit one. Defaults to `currentColor`. */
  color?: string;
  /** Side length of a square viewBox — `16` means `"0 0 16 16"`. Defaults to `24`. */
  viewBox?: number;
}

/** One child element of an icon: its tag name, then its attributes. */
export type IconChildren = [name: string, props: Record<string, unknown>];

/**
 * Builds an icon component from shape data rather than JSX, so an icon set can
 * be a data file instead of a folder of near-identical components.
 *
 * The defaults describe a stroked icon on a 24-unit square. `size`, `color` and
 * the numeric `viewBox` are this helper's own props and are consumed here;
 * everything else in {@link IconProps} passes through to the `<svg>`.
 *
 * @example
 * export const CheckIcon = createSvgIcon("CheckIcon", [
 *   ["path", { d: "M5 13l4 4L19 7" }],
 * ]);
 *
 * <CheckIcon size={32} className="ml-2" />
 *
 * @example
 * // A filled icon, declared once
 * export const Dot = createSvgIcon("Dot", [["circle", { cx: 12, cy: 12, r: 10 }]], {
 *   fill: "currentColor",
 *   stroke: "none",
 * });
 *
 * @param name - Becomes the component's `displayName`.
 * @param children - One `[tag, attributes]` pair per child, keyed by position.
 * @param initialProps - Defaults for this icon, overridden by props at the call site.
 * @returns A component rendering an `<svg>` around the given children.
 */
export function createSvgIcon(name: string, children: IconChildren[], initialProps: IconProps = {}) {
  function SvgIcon(props: IconProps) {
    /* Every value is read from the merged object, never from `props` alone —
       reading one of them from `props` would make it unsettable through
       `initialProps`, which is the whole point of that argument. */
    const finalProps = Object.assign({}, initialProps, props);

    const {
      size = 24,
      color,
      viewBox = 24,
      width,
      height,
      stroke,
      strokeWidth = 2,
      fill = "none",
      xmlns = "http://www.w3.org/2000/svg",
      strokeLinecap = "round",
      strokeLinejoin = "round",
      /* `size`, `color` and the numeric `viewBox` are this helper's own props,
         not SVG attributes. They are pulled out here so they cannot reach the
         element — React forwards anything left over to the DOM. */
      ...rest
    } = finalProps;

    const svgProps = {
      ...rest,
      xmlns,
      fill,
      strokeLinecap,
      strokeLinejoin,
      viewBox: `0 0 ${viewBox} ${viewBox}`,
      stroke: color ?? stroke ?? "currentColor",
      strokeWidth,
      width: width ?? size,
      height: height ?? size,
      children: children.map((item, index) =>
        createElement(item[0], {...item[1], key: `${item[0]}-${index}`}))
    };

    return createElement("svg", svgProps);
  }

  SvgIcon.displayName = name;
  return SvgIcon;
}
