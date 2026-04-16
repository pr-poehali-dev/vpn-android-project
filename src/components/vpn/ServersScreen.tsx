import { useState } from "react";
import { Server } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Props {
  servers: Server[];
  selectedServer: Server;
  onSelect: (s: Server) => void;
}

export default function ServersScreen({ servers, selectedServer, onSelect }: Props) {
  const [filter, setFilter] = useState<"all" | "WireGuard" | "OpenVPN">("all");
  const [search, setSearch] = useState("");

  const filtered = servers.filter(s => {
    const matchProto = filter === "all" || s.protocol === filter;
    const matchSearch = !search || s.country.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase());
    return matchProto && matchSearch;
  });

  const pingColor = (ping: number) =>
    ping < 50 ? "var(--vpn-green)" : ping < 100 ? "var(--vpn-yellow)" : "var(--vpn-red)";

  const loadColor = (load: number) =>
    load < 40 ? "var(--vpn-green)" : load < 70 ? "var(--vpn-yellow)" : "var(--vpn-red)";

  return (
    <div className="pt-4 flex flex-col gap-4 animate-fade-in-up">
      <div>
        <h2 className="text-base font-semibold text-foreground">VPN Серверы</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{servers.length} серверов в {new Set(servers.map(s => s.country)).size} странах</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по стране или городу..."
          className="w-full glass-card rounded-xl py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20"
          style={{ border: "1px solid var(--vpn-border)", background: "var(--vpn-surface)" }}
        />
      </div>

      {/* Protocol filter */}
      <div className="flex gap-2">
        {(["all", "WireGuard", "OpenVPN"] as const).map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
            style={{
              background: filter === p ? "var(--vpn-green)" : "var(--vpn-surface)",
              color: filter === p ? "#0a1a0f" : "var(--foreground)",
              border: `1px solid ${filter === p ? "var(--vpn-green)" : "var(--vpn-border)"}`,
              fontFamily: "'IBM Plex Sans', sans-serif"
            }}
          >
            {p === "all" ? "Все" : p}
          </button>
        ))}
      </div>

      {/* Server list */}
      <div className="flex flex-col gap-2">
        {filtered.map((server, i) => {
          const isSelected = server.id === selectedServer.id;
          return (
            <button
              key={server.id}
              onClick={() => onSelect(server)}
              className={`glass-card w-full rounded-xl p-4 flex items-center gap-3 text-left transition-all duration-200 animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}
              style={{
                border: `1px solid ${isSelected ? "rgba(0,214,143,0.4)" : "var(--vpn-border)"}`,
                background: isSelected ? "rgba(0,214,143,0.06)" : "var(--vpn-surface)"
              }}
            >
              <div className="text-xl flex-shrink-0">{server.flag}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{server.city}</p>
                  {server.premium && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded tracking-wider"
                      style={{ background: "rgba(245,197,66,0.15)", color: "var(--vpn-yellow)", border: "1px solid rgba(245,197,66,0.25)" }}>
                      PRO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{server.country}</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                    {server.protocol}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Icon name="Wifi" size={10} className="text-muted-foreground" />
                  <span className="text-[11px] font-mono" style={{ color: pingColor(server.ping) }}>
                    {server.ping}мс
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 rounded-full overflow-hidden" style={{ width: 36, background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${server.load}%`, background: loadColor(server.load) }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">{server.load}%</span>
                </div>
              </div>

              {isSelected && (
                <Icon name="CheckCircle2" size={16} style={{ color: "var(--vpn-green)", flexShrink: 0 } as React.CSSProperties} />
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Серверы не найдены
        </div>
      )}
    </div>
  );
}
