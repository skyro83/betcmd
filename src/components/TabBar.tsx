"use client";
import { Ic } from "./icons";

export type Tab = "home" | "bets" | "rank" | "me";

const items: { k: Tab; l: string; ic: keyof typeof Ic }[] = [
  { k: "home", l: "Salon", ic: "home" },
  { k: "bets", l: "Pronos", ic: "ball" },
  { k: "rank", l: "Classement", ic: "trophy" },
  { k: "me", l: "Moi", ic: "user" },
];

export function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="tabbar">
      {items.map((it) => {
        const Icon = Ic[it.ic];
        return (
          <button key={it.k} className={tab === it.k ? "on" : ""} onClick={() => setTab(it.k)}>
            <span className="ic">
              <Icon stroke={tab === it.k ? "#E8C84A" : "#6E7E96"} />
            </span>
            <span>{it.l}</span>
          </button>
        );
      })}
    </div>
  );
}
