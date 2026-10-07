import type { SVGProps } from "react";

/** One 20px line-icon family: 1.6 stroke, round joins, drawn on a 20-unit grid. */
const paths = {
  bold: "M6 4h5a3.25 3.25 0 0 1 0 6.5H6zM6 10.5h6a3.25 3.25 0 0 1 0 6.5H6z",
  italic: "M8.5 4H15M5 16h6.5M11.75 4 8.25 16",
  heading: "M4 4.5v11M12 4.5v11M4 10h8M14.5 9.5l2-1.5v7.5",
  list: "M8 5.5h8.5M8 10h8.5M8 14.5h8.5M4 5.5h.01M4 10h.01M4 14.5h.01",
  quote: "M4.5 9.5c0-2.5 1.2-4 3.5-4.5M4.5 9.5h3v4h-3zM11.5 9.5c0-2.5 1.2-4 3.5-4.5M11.5 9.5h3v4h-3z",
  code: "M7 6 3 10l4 4M13 6l4 4-4 4",
  link: "M8.5 11.5a3 3 0 0 0 4.24 0l2.5-2.5a3 3 0 0 0-4.24-4.24l-.75.75M11.5 8.5a3 3 0 0 0-4.24 0l-2.5 2.5a3 3 0 0 0 4.24 4.24l.75-.75",
  image: "M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2zM3.5 13.5l3.75-3.75a1.5 1.5 0 0 1 2.1 0l4.65 4.75M12 11.5l1-1a1.5 1.5 0 0 1 2.1 0l1.4 1.4M12.5 7.25h.01",
  undo: "M7.5 4.5 4 8l3.5 3.5M4 8h7.5a4.5 4.5 0 0 1 0 9H9",
  redo: "M12.5 4.5 16 8l-3.5 3.5M16 8H8.5a4.5 4.5 0 0 0 0 9H11",
  file: "M11 3H6.5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7.5zM11 3v4.5h4.5",
  grid: "M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z",
  sliders: "M4 6h7M15 6h1M4 14h1M9 14h7M13 4v4M7 12v4",
  plus: "M10 4.5v11M4.5 10h11",
  arrow: "M6 14 14 6M7.5 6H14v6.5",
  close: "M5.5 5.5l9 9M14.5 5.5l-9 9",
  folder: "M3.5 6.5a2 2 0 0 1 2-2h3l1.75 2h4.25a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z",
  doc: "M10 4.5v-1M10 16.5v-1M6.5 6.5h7a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zM8.5 9h3M8.5 11h2",
  help: "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM8 8a2 2 0 1 1 2.75 1.85c-.45.2-.75.62-.75 1.1v.55M10 14h.01",
  left: "M12 5 7 10l5 5",
  right: "M8 5l5 5-5 5",
  split: "M4 4h12v12H4zM4 10h12",
  check: "M4.5 10.5 8 14l7.5-8",
  share: "M10 3.5v9M6.5 7 10 3.5 13.5 7M5 11v3.5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V11",
  copy: "M7.5 7.5h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM4.5 12.5v-7a1 1 0 0 1 1-1h7",
  download: "M10 3.5v9M6.5 9 10 12.5 13.5 9M4.5 16.5h11",
  trash: "M4.5 6h11M8 6V4.5h4V6M6 6l.75 10h6.5L14 6",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[name]} /></svg>;
}

/** The MarkdownPic mark: an ink tile with the signal-green "M↗". */
export function BrandMark({ size = 32 }: { size?: number }) {
  return <svg className="brand-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="15" fill="var(--brand-tile, #16150f)" /><path d="M14 44V21h6.5l8 9.5 8-9.5H43v9h4.5l6 6.5-6 6.5v-5H36.5V32l-8 9.5-8-9.5v12z" fill="var(--signal, #d9ff3d)" /></svg>;
}
