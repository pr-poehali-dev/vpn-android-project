import Icon from "@/components/ui/icon";

type Tab = "connect" | "servers" | "stats" | "settings";

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "connect", icon: "Shield", label: "VPN" },
  { id: "servers", icon: "Globe2", label: "Серверы" },
  { id: "stats", icon: "BarChart2", label: "Статистика" },
  { id: "settings", icon: "Settings", label: "Настройки" },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-center z-50 px-4 pb-4"
    >
      <div
        className="flex items-center gap-1 px-2 py-2 rounded-2xl w-full max-w-sm"
        style={{
          background: "rgba(14,20,30,0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset"
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 relative"
              style={{
                background: isActive ? "rgba(0,214,143,0.1)" : "transparent",
              }}
            >
              <Icon
                name={tab.icon as never}
                size={20}
                style={{
                  color: isActive ? "var(--vpn-green)" : "rgba(255,255,255,0.35)",
                  transition: "color 0.2s"
                } as React.CSSProperties}
              />
              <span
                className="text-[9px] tracking-wider font-semibold transition-all duration-200"
                style={{ color: isActive ? "var(--vpn-green)" : "rgba(255,255,255,0.3)" }}
              >
                {tab.label.toUpperCase()}
              </span>
              {isActive && (
                <span
                  className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full"
                  style={{ background: "var(--vpn-green)", boxShadow: "0 0 4px var(--vpn-green)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
