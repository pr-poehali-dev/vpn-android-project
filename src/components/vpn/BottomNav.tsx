import Icon from "@/components/ui/icon";
import { Tab } from "@/pages/Index";

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

const TABS: { id: Tab; icon: string; label: string; accent?: string }[] = [
  { id: "connect",  icon: "Shield",   label: "VPN" },
  { id: "servers",  icon: "Globe2",   label: "Серверы" },
  { id: "game",     icon: "Gamepad2", label: "Игра", accent: "#f5c542" },
  { id: "stats",    icon: "BarChart2",label: "Статы" },
  { id: "settings", icon: "Settings", label: "Профиль" },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-center z-50 px-3 pb-4">
      <div
        className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl w-full max-w-sm"
        style={{
          background: "rgba(14,20,30,0.94)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset"
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.id === active;
          const color = tab.accent ?? "var(--vpn-green)";
          const isGame = tab.id === "game";
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 relative"
              style={{
                background: isActive
                  ? isGame ? "rgba(245,197,66,0.12)" : "rgba(0,214,143,0.1)"
                  : "transparent",
              }}
            >
              {isGame && !isActive && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse-ring"
                  style={{ background: "#f5c542", boxShadow: "0 0 4px #f5c542" }} />
              )}
              <Icon
                name={tab.icon as never}
                size={19}
                style={{ color: isActive ? color : "rgba(255,255,255,0.32)", transition: "color 0.2s" } as React.CSSProperties}
              />
              <span
                className="text-[9px] tracking-wider font-semibold transition-all duration-200"
                style={{ color: isActive ? color : "rgba(255,255,255,0.28)" }}
              >
                {tab.label.toUpperCase()}
              </span>
              {isActive && (
                <span
                  className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full"
                  style={{ background: color, boxShadow: `0 0 4px ${color}` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
