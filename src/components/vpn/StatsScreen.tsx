import { VpnStatus, Server } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Props {
  status: VpnStatus;
  selectedServer: Server;
}

const DOWN_DATA = [42, 78, 55, 91, 67, 84, 39, 72, 88, 61, 95, 74];
const UP_DATA   = [18, 34, 27, 45, 31, 52, 22, 41, 38, 29, 47, 35];
const HOURS     = ["12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"];

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1" style={{ height: 40 }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bar-grow"
          style={{
            height: `${(v / max) * 100}%`,
            background: color,
            opacity: 0.7 + (i / data.length) * 0.3,
            animationDelay: `${i * 0.04}s`
          }}
        />
      ))}
    </div>
  );
}

export default function StatsScreen({ status }: Props) {
  const isConnected = status === "connected";

  return (
    <div className="pt-4 flex flex-col gap-4 animate-fade-in-up">
      <div>
        <h2 className="text-base font-semibold text-foreground">Аналитика</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Трафик и статистика сессий</p>
      </div>

      {/* Traffic totals */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Загружено", value: isConnected ? "1.84 ГБ" : "—", icon: "ArrowDown", color: "var(--vpn-green)" },
          { label: "Отправлено", value: isConnected ? "342 МБ" : "—", icon: "ArrowUp", color: "#60a5fa" },
        ].map((item, i) => (
          <div key={item.label} className={`glass-card rounded-xl p-4 animate-fade-in-up stagger-${i + 1}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                <Icon name={item.icon as never} size={12} style={{ color: item.color } as React.CSSProperties} />
              </div>
              <span className="text-[10px] text-muted-foreground tracking-widest">{item.label.toUpperCase()}</span>
            </div>
            <p className="text-xl font-mono font-semibold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">текущая сессия</p>
          </div>
        ))}
      </div>

      {/* Speed chart */}
      <div className="glass-card rounded-xl p-4 stagger-3 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground">СКОРОСТЬ</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--vpn-green)" }} />
              <span className="text-[10px] text-muted-foreground">Входящий</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "#60a5fa" }} />
              <span className="text-[10px] text-muted-foreground">Исходящий</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-3">
            <div className="flex-1">
              <MiniChart data={DOWN_DATA} color="var(--vpn-green)" />
            </div>
            <div className="flex-1">
              <MiniChart data={UP_DATA} color="#60a5fa" />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            {HOURS.filter((_, i) => i % 3 === 0).map(h => (
              <span key={h} className="text-[9px] text-muted-foreground font-mono">{h}:00</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
          <div>
            <p className="text-[10px] text-muted-foreground tracking-wider">ПИКОВАЯ ВХОДЯЩАЯ</p>
            <p className="text-sm font-mono font-semibold mt-1" style={{ color: "var(--vpn-green)" }}>
              {isConnected ? "48.2 Мбит/с" : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground tracking-wider">ПИКОВАЯ ИСХОДЯЩАЯ</p>
            <p className="text-sm font-mono font-semibold mt-1" style={{ color: "#60a5fa" }}>
              {isConnected ? "22.7 Мбит/с" : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Session stats */}
      <div className="glass-card rounded-xl p-4 stagger-4 animate-fade-in-up">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground">ИСТОРИЯ СЕССИЙ</span>
        <div className="flex flex-col gap-3 mt-3">
          {[
            { date: "Сегодня", server: "🇩🇪 Франкфурт", duration: "2ч 14м", traffic: "2.1 ГБ", ok: true },
            { date: "Вчера", server: "🇳🇱 Амстердам", duration: "5ч 48м", traffic: "4.7 ГБ", ok: true },
            { date: "15 апр", server: "🇫🇮 Хельсинки", duration: "1ч 02м", traffic: "890 МБ", ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-t border-white/5 first:border-0 first:pt-0">
              <div>
                <p className="text-xs font-medium text-foreground">{item.server}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.date} · {item.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-foreground">{item.traffic}</p>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--vpn-green)" }} />
                  <span className="text-[10px] text-muted-foreground">Успешно</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security events */}
      <div className="glass-card rounded-xl p-4 stagger-5 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="ShieldAlert" size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold tracking-widest text-muted-foreground">СОБЫТИЯ БЕЗОПАСНОСТИ</span>
        </div>
        {[
          { msg: "DNS-утечек не обнаружено", time: "сейчас", ok: true },
          { msg: "Kill Switch активен", time: "02:14 назад", ok: true },
          { msg: "Протокол WireGuard обновлён", time: "вчера", ok: true },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-t border-white/5 first:border-0 first:pt-0">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--vpn-green)" }} />
            <span className="text-xs text-foreground flex-1">{e.msg}</span>
            <span className="text-[10px] text-muted-foreground">{e.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
