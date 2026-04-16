import { useEffect, useState } from "react";
import { VpnStatus, Server } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Props {
  status: VpnStatus;
  onConnect: () => void;
  selectedServer: Server;
  connectTime: number;
  onGoServers: () => void;
}

function useTimer(connectTime: number, status: VpnStatus) {
  const [elapsed, setElapsed] = useState("00:00:00");
  useEffect(() => {
    if (status !== "connected" || !connectTime) { setElapsed("00:00:00"); return; }
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - connectTime) / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setElapsed(`${h}:${m}:${sec}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [connectTime, status]);
  return elapsed;
}

export default function ConnectScreen({ status, onConnect, selectedServer, connectTime, onGoServers }: Props) {
  const elapsed = useTimer(connectTime, status);
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const btnColor = isConnected
    ? "var(--vpn-green)"
    : isConnecting
    ? "var(--vpn-yellow)"
    : "#e2e8f0";

  const ringColor = isConnected
    ? "rgba(0,214,143,"
    : isConnecting
    ? "rgba(245,197,66,"
    : "rgba(100,120,160,";

  return (
    <div className="flex flex-col items-center pt-6 gap-6 animate-fade-in-up">

      {/* Big connect button with rings */}
      <div className="relative flex items-center justify-center mt-4" style={{ width: 220, height: 220 }}>
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            border: `1px solid ${ringColor}0.15)`,
            ...(isConnected || isConnecting ? {} : {})
          }}
        />
        {/* Animated rings */}
        {(isConnected || isConnecting) && (
          <>
            <div
              className="absolute rounded-full animate-pulse-ring-2"
              style={{
                inset: -12,
                border: `1px solid ${ringColor}0.2)`,
                borderRadius: "50%"
              }}
            />
            <div
              className="absolute rounded-full animate-pulse-ring"
              style={{
                inset: -4,
                border: `1.5px solid ${ringColor}0.35)`,
                borderRadius: "50%"
              }}
            />
          </>
        )}

        {/* Rotating arc (connecting only) */}
        {isConnecting && (
          <div className="absolute inset-0 animate-rotate-slow" style={{ borderRadius: "50%" }}>
            <svg viewBox="0 0 220 220" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="110" cy="110" r="104"
                stroke="rgba(245,197,66,0.6)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="60 600"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {/* Main circle button */}
        <button
          onClick={onConnect}
          className="relative z-10 flex flex-col items-center justify-center rounded-full transition-all duration-500 select-none"
          style={{
            width: 160,
            height: 160,
            background: isConnected
              ? "radial-gradient(circle at 40% 35%, rgba(0,214,143,0.18), rgba(0,214,143,0.06))"
              : isConnecting
              ? "radial-gradient(circle at 40% 35%, rgba(245,197,66,0.14), rgba(245,197,66,0.05))"
              : "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
            border: `2px solid ${btnColor}`,
            boxShadow: isConnected
              ? `0 0 40px rgba(0,214,143,0.2), inset 0 1px 0 rgba(0,214,143,0.15)`
              : isConnecting
              ? `0 0 30px rgba(245,197,66,0.15), inset 0 1px 0 rgba(245,197,66,0.1)`
              : `0 0 0 rgba(0,0,0,0), inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          <Icon
            name={isConnected ? "ShieldCheck" : isConnecting ? "Loader" : "ShieldOff"}
            size={36}
            className={`transition-all duration-300 ${isConnecting ? "animate-rotate-slow" : ""}`}
            style={{ color: btnColor } as React.CSSProperties}
          />
          <span
            className="text-xs font-semibold tracking-widest mt-2 transition-all duration-300"
            style={{ color: btnColor }}
          >
            {isConnected ? "ОТКЛЮЧИТЬ" : isConnecting ? "СТОП" : "ВКЛЮЧИТЬ"}
          </span>
        </button>
      </div>

      {/* Status label */}
      <div className="text-center -mt-2">
        <p className="font-mono text-2xl font-medium tracking-wider" style={{ color: btnColor }}>
          {isConnected ? elapsed : isConnecting ? "——:——:——" : "00:00:00"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 tracking-widest">
          {isConnected ? "СЕССИЯ АКТИВНА" : isConnecting ? "УСТАНОВКА СОЕДИНЕНИЯ" : "VPN ОТКЛЮЧЁН"}
        </p>
      </div>

      {/* Server selector card */}
      <button
        onClick={onGoServers}
        className="glass-card w-full rounded-xl p-4 flex items-center gap-3 transition-all duration-200 hover:border-white/15 text-left group"
      >
        <div className="text-2xl">{selectedServer.flag}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {selectedServer.country} — {selectedServer.city}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground font-mono">{selectedServer.protocol}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-mono" style={{
              color: selectedServer.ping < 50 ? "var(--vpn-green)" : selectedServer.ping < 100 ? "var(--vpn-yellow)" : "var(--vpn-red)"
            }}>{selectedServer.ping} мс</span>
          </div>
        </div>
        <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      {/* Stats row */}
      <div className="w-full grid grid-cols-3 gap-3">
        {[
          { label: "ПРОТОКОЛ", value: selectedServer.protocol, icon: "Zap" },
          { label: "ПИНГ", value: `${selectedServer.ping} мс`, icon: "Activity" },
          { label: "НАГРУЗКА", value: `${selectedServer.load}%`, icon: "BarChart2" },
        ].map((item, i) => (
          <div
            key={item.label}
            className={`glass-card rounded-xl p-3 flex flex-col gap-1.5 animate-fade-in-up stagger-${i + 1}`}
          >
            <Icon name={item.icon as never} size={14} className="text-muted-foreground" />
            <p className="text-xs font-mono font-medium text-foreground leading-tight">{item.value}</p>
            <p className="text-[10px] text-muted-foreground tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      {/* IP info */}
      {isConnected && (
        <div className="w-full glass-card rounded-xl p-4 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Globe" size={14} style={{ color: "var(--vpn-green)" } as React.CSSProperties} />
            <span className="text-xs font-semibold tracking-widest text-muted-foreground">СЕТЕВЫЕ ДАННЫЕ</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Внешний IP", value: "185.234.72.18" },
              { label: "DNS сервер", value: "10.8.0.1" },
              { label: "Шифрование", value: "AES-256-GCM" },
              { label: "Утечка DNS", value: "Нет", ok: true },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] text-muted-foreground tracking-wider">{item.label}</p>
                <p className="text-xs font-mono font-medium mt-0.5"
                  style={{ color: item.ok ? "var(--vpn-green)" : "var(--foreground)" }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
