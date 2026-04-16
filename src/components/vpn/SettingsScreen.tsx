import { useState } from "react";
import Icon from "@/components/ui/icon";

const APPS = [
  { id: "browser", name: "Браузер", icon: "Globe", tunneled: true },
  { id: "telegram", name: "Telegram", icon: "MessageCircle", tunneled: true },
  { id: "zoom", name: "Zoom", icon: "Video", tunneled: false },
  { id: "spotify", name: "Spotify", icon: "Music", tunneled: false },
  { id: "mail", name: "Почта", icon: "Mail", tunneled: true },
  { id: "drive", name: "Облачное хранилище", icon: "Cloud", tunneled: false },
  { id: "terminal", name: "Терминал", icon: "Terminal", tunneled: true },
  { id: "git", name: "Git клиент", icon: "GitBranch", tunneled: true },
];

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  color?: string;
}

function Toggle({ checked, onChange, color = "var(--vpn-green)" }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className="relative inline-flex items-center rounded-full transition-all duration-300 flex-shrink-0"
      style={{
        width: 36,
        height: 20,
        background: checked ? color : "rgba(255,255,255,0.12)",
        border: `1px solid ${checked ? color : "rgba(255,255,255,0.15)"}`,
      }}
    >
      <span
        className="inline-block rounded-full transition-all duration-300"
        style={{
          width: 14,
          height: 14,
          background: "#fff",
          transform: checked ? "translateX(18px)" : "translateX(3px)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
        }}
      />
    </button>
  );
}

interface Section {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: Section) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/5">
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

interface RowProps {
  icon: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  danger?: boolean;
}

function Row({ icon, label, sub, right, danger }: RowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
      <Icon name={icon as never} size={16} className={danger ? "" : "text-muted-foreground"}
        style={danger ? { color: "var(--vpn-red)" } : undefined} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? "" : "text-foreground"}`}
          style={danger ? { color: "var(--vpn-red)" } : undefined}>{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    killSwitch: true,
    dnsLeak: true,
    autoConnect: false,
    notifications: true,
    protocol: "WireGuard" as "WireGuard" | "OpenVPN",
    splitTunnel: true,
  });

  const [apps, setApps] = useState(APPS);

  const toggle = (key: keyof typeof settings) =>
    setSettings(s => ({ ...s, [key]: !s[key] }));

  const toggleApp = (id: string) =>
    setApps(prev => prev.map(a => a.id === id ? { ...a, tunneled: !a.tunneled } : a));

  return (
    <div className="pt-4 flex flex-col gap-4 animate-fade-in-up">
      <div>
        <h2 className="text-base font-semibold text-foreground">Настройки</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Безопасность и параметры подключения</p>
      </div>

      {/* Profile */}
      <div className="glass-card rounded-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "var(--vpn-green-dim)", border: "1px solid rgba(0,214,143,0.25)" }}>
          🧑‍💻
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Pro пользователь</p>
          <p className="text-xs text-muted-foreground">user@securevpn.pro</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="h-1 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full w-3/4" style={{ background: "var(--vpn-green)" }} />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">PRO до 01.2026</span>
          </div>
        </div>
      </div>

      {/* Protocol */}
      <Section title="ПРОТОКОЛ ПОДКЛЮЧЕНИЯ">
        <div className="p-3 flex gap-2">
          {(["WireGuard", "OpenVPN"] as const).map(p => (
            <button
              key={p}
              onClick={() => setSettings(s => ({ ...s, protocol: p }))}
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: settings.protocol === p ? "var(--vpn-green)" : "rgba(255,255,255,0.04)",
                color: settings.protocol === p ? "#0a1a0f" : "rgba(255,255,255,0.6)",
                border: `1px solid ${settings.protocol === p ? "var(--vpn-green)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <Row
          icon="Info"
          label={settings.protocol === "WireGuard" ? "Быстрее, новее, легче" : "Классика, совместимость"}
          sub={settings.protocol === "WireGuard" ? "Рекомендуется для большинства задач" : "Обход DPI и глубокой инспекции"}
        />
      </Section>

      {/* Security */}
      <Section title="БЕЗОПАСНОСТЬ">
        <Row
          icon="ShieldOff"
          label="Kill Switch"
          sub="Блокировка трафика при обрыве VPN"
          right={<Toggle checked={settings.killSwitch} onChange={() => toggle("killSwitch")} />}
        />
        <Row
          icon="Eye"
          label="Защита от DNS-утечек"
          sub="Принудительный VPN-DNS"
          right={<Toggle checked={settings.dnsLeak} onChange={() => toggle("dnsLeak")} />}
        />
        <Row
          icon="Zap"
          label="Автоподключение"
          sub="При старте приложения"
          right={<Toggle checked={settings.autoConnect} onChange={() => toggle("autoConnect")} />}
        />
      </Section>

      {/* Split Tunneling */}
      <Section title="РАЗДЕЛЬНОЕ ТУННЕЛИРОВАНИЕ">
        <Row
          icon="GitFork"
          label="Раздельное туннелирование"
          sub="Выбирайте приложения для VPN"
          right={<Toggle checked={settings.splitTunnel} onChange={() => toggle("splitTunnel")} />}
        />
        {settings.splitTunnel && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2 mt-1">
              <span className="text-[10px] text-muted-foreground tracking-wider">ПРИЛОЖЕНИЯ</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ background: "var(--vpn-green)" }} />
                  <span className="text-[9px] text-muted-foreground">Через VPN</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ background: "rgba(255,255,255,0.15)" }} />
                  <span className="text-[9px] text-muted-foreground">Напрямую</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {apps.map(app => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200"
                  style={{
                    background: app.tunneled ? "rgba(0,214,143,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${app.tunneled ? "rgba(0,214,143,0.15)" : "rgba(255,255,255,0.05)"}`
                  }}
                >
                  <Icon name={app.icon as never} size={14} style={{ color: app.tunneled ? "var(--vpn-green)" : "rgba(255,255,255,0.35)" } as React.CSSProperties} />
                  <span className="text-xs flex-1 text-foreground">{app.name}</span>
                  <Toggle
                    checked={app.tunneled}
                    onChange={() => toggleApp(app.id)}
                    color="var(--vpn-green)"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Notifications */}
      <Section title="УВЕДОМЛЕНИЯ">
        <Row
          icon="Bell"
          label="Push-уведомления"
          sub="Статус подключения"
          right={<Toggle checked={settings.notifications} onChange={() => toggle("notifications")} />}
        />
      </Section>

      {/* Danger zone */}
      <Section title="АККАУНТ">
        <Row icon="Download" label="Экспорт конфигурации" sub="Скачать .ovpn / .conf файл"
          right={<Icon name="ChevronRight" size={14} className="text-muted-foreground" />}
        />
        <Row icon="RefreshCw" label="Сбросить настройки"
          right={<Icon name="ChevronRight" size={14} className="text-muted-foreground" />}
        />
        <Row icon="LogOut" label="Выйти из аккаунта" danger />
      </Section>

      <p className="text-center text-[10px] text-muted-foreground pb-2 font-mono">
        SecureVPN v2.4.1 · build 241017
      </p>
    </div>
  );
}
