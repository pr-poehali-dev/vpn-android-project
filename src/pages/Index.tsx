import { useState } from "react";
import ConnectScreen from "@/components/vpn/ConnectScreen";
import ServersScreen from "@/components/vpn/ServersScreen";
import StatsScreen from "@/components/vpn/StatsScreen";
import SettingsScreen from "@/components/vpn/SettingsScreen";
import GameScreen from "@/components/vpn/GameScreen";
import BottomNav from "@/components/vpn/BottomNav";

export type VpnStatus = "disconnected" | "connecting" | "connected";

export interface Server {
  id: string;
  country: string;
  city: string;
  flag: string;
  ping: number;
  load: number;
  protocol: "WireGuard" | "OpenVPN";
  premium?: boolean;
}

export const SERVERS: Server[] = [
  { id: "de1", country: "Германия", city: "Франкфурт", flag: "🇩🇪", ping: 18, load: 34, protocol: "WireGuard" },
  { id: "nl1", country: "Нидерланды", city: "Амстердам", flag: "🇳🇱", ping: 22, load: 47, protocol: "WireGuard" },
  { id: "fi1", country: "Финляндия", city: "Хельсинки", flag: "🇫🇮", ping: 29, load: 21, protocol: "WireGuard" },
  { id: "ch1", country: "Швейцария", city: "Цюрих", flag: "🇨🇭", ping: 31, load: 58, protocol: "OpenVPN", premium: true },
  { id: "us1", country: "США", city: "Нью-Йорк", flag: "🇺🇸", ping: 89, load: 72, protocol: "WireGuard" },
  { id: "jp1", country: "Япония", city: "Токио", flag: "🇯🇵", ping: 145, load: 39, protocol: "OpenVPN", premium: true },
  { id: "gb1", country: "Великобритания", city: "Лондон", flag: "🇬🇧", ping: 44, load: 55, protocol: "WireGuard" },
  { id: "sg1", country: "Сингапур", city: "Сингапур", flag: "🇸🇬", ping: 112, load: 28, protocol: "WireGuard" },
];

export type Tab = "connect" | "servers" | "stats" | "game" | "settings";

export default function Index() {
  const [tab, setTab] = useState<Tab>("connect");
  const [status, setStatus] = useState<VpnStatus>("disconnected");
  const [selectedServer, setSelectedServer] = useState<Server>(SERVERS[0]);
  const [connectTime, setConnectTime] = useState<number>(0);

  const handleConnect = () => {
    if (status === "disconnected") {
      setStatus("connecting");
      setTimeout(() => {
        setStatus("connected");
        setConnectTime(Date.now());
      }, 2200);
    } else if (status === "connected") {
      setStatus("disconnected");
      setConnectTime(0);
    }
  };

  return (
    <div className="min-h-screen bg-background vpn-grid-bg flex flex-col items-center justify-start relative overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 transition-all duration-1000"
        style={{
          background: status === "connected"
            ? "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,214,143,0.08) 0%, transparent 70%)"
            : status === "connecting"
            ? "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,197,66,0.06) 0%, transparent 70%)"
            : "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(40,60,100,0.08) 0%, transparent 70%)"
        }}
      />

      <div className="w-full max-w-sm mx-auto flex flex-col min-h-screen relative z-10">
        <header className="flex items-center justify-between px-5 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "var(--vpn-green-dim)", border: "1px solid rgba(0,214,143,0.3)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L12 3.5V7C12 10 9.5 12.5 7 13C4.5 12.5 2 10 2 7V3.5L7 1Z"
                  stroke="var(--vpn-green)" strokeWidth="1.2" fill="none" />
                <circle cx="7" cy="7" r="1.5" fill="var(--vpn-green)" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-wide text-foreground">SecureVPN</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full transition-all duration-500"
              style={{
                background: status === "connected" ? "var(--vpn-green)"
                  : status === "connecting" ? "var(--vpn-yellow)"
                  : "#4a5568",
                boxShadow: status === "connected" ? "0 0 6px var(--vpn-green)" : "none"
              }}
            />
            <span className="text-xs font-mono text-muted-foreground">
              {status === "connected" ? "ЗАЩИТА АКТИВНА"
                : status === "connecting" ? "ПОДКЛЮЧЕНИЕ..."
                : "НЕ ЗАЩИЩЁН"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-24">
          {tab === "connect" && (
            <ConnectScreen
              status={status}
              onConnect={handleConnect}
              selectedServer={selectedServer}
              connectTime={connectTime}
              onGoServers={() => setTab("servers")}
            />
          )}
          {tab === "servers" && (
            <ServersScreen
              servers={SERVERS}
              selectedServer={selectedServer}
              onSelect={(s) => { setSelectedServer(s); setTab("connect"); }}
            />
          )}
          {tab === "stats" && (
            <StatsScreen status={status} selectedServer={selectedServer} />
          )}
          {tab === "game" && (
            <GameScreen />
          )}
          {tab === "settings" && (
            <SettingsScreen />
          )}
        </main>

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
}
