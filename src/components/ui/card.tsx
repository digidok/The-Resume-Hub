import { HTMLAttributes } from "react";

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 ${props.className ?? ""}`}
    />
  );
}
