import { HTMLAttributes } from "react";

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${props.className ?? ""}`}
    />
  );
}
