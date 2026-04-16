import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/e2560550-4b3c-4984-b5fd-fffc2b9d6e51";

interface Player {
  rank: number;
  player_name: string;
  score: number;
  coins_earned: number;
}

interface Props {
  onClose: () => void;
  currentPlayerName?: string;
  newScore?: number;
  newCoins?: number;
  onSaved?: (rank: number) => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export async function submitScore(playerName: string, score: number, coins: number) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_name: playerName, score, coins_earned: coins }),
  });
  return res.json();
}

export async function fetchLeaderboard(): Promise<Player[]> {
  const res = await fetch(API);
  const data = await res.json();
  return data.players ?? [];
}

export default function LeaderboardModal({ onClose, currentPlayerName, newScore, newCoins, onSaved }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchLeaderboard().then(p => { setPlayers(p); setLoading(false); });
  }, []);

  const handleSubmit = async () => {
    if (!currentPlayerName || !newScore || submitting) return;
    setSubmitting(true);
    const res = await submitScore(currentPlayerName, newScore, newCoins ?? 0);
    setSubmitting(false);
    setSubmitted(true);
    if (res.rank) {
      setMyRank(res.rank);
      onSaved?.(res.rank);
    }
    // Перезагрузить таблицу
    const updated = await fetchLeaderboard();
    setPlayers(updated);
  };

  const myEntry = currentPlayerName
    ? players.find(p => p.player_name === currentPlayerName)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-in-up flex flex-col"
        style={{
          background: "#0a1220",
          border: "1px solid rgba(255,255,255,0.09)",
          maxHeight: "85vh",
          boxShadow: "0 -8px 60px rgba(0,0,0,0.6)"
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Icon name="Trophy" size={18} style={{ color: "#f5c542" } as React.CSSProperties} />
              <h3 className="text-base font-bold text-white">Таблица лидеров</h3>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
              <Icon name="X" size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500">Лучшие агенты Cyber Runner</p>
        </div>

        {/* New result banner */}
        {newScore && newScore > 0 && !submitted && (
          <div className="mx-4 mt-4 flex-shrink-0 rounded-xl p-3 flex items-center gap-3"
            style={{ background: "rgba(0,214,143,0.08)", border: "1px solid rgba(0,214,143,0.2)" }}>
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: "var(--vpn-green)" }}>Новый результат!</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {newScore}м · 🪙{newCoins} монет
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: submitting ? "rgba(0,214,143,0.3)" : "var(--vpn-green)",
                color: "#0a1a0f",
              }}
            >
              {submitting ? "..." : "Сохранить"}
            </button>
          </div>
        )}

        {/* Rank badge after submit */}
        {submitted && myRank && (
          <div className="mx-4 mt-4 flex-shrink-0 rounded-xl p-3 text-center"
            style={{ background: "rgba(245,197,66,0.08)", border: "1px solid rgba(245,197,66,0.2)" }}>
            <p className="text-sm font-bold" style={{ color: "#f5c542" }}>
              {myRank <= 3 ? MEDALS[myRank - 1] + " " : ""}Место #{myRank} в рейтинге!
            </p>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🕹️</p>
              <p className="text-gray-400 text-sm">Ещё никто не сыграл</p>
              <p className="text-gray-600 text-xs mt-1">Стань первым!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {players.map((p, i) => {
                const isMe = p.player_name === currentPlayerName;
                const isTop = i < 3;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isMe
                        ? "rgba(0,214,143,0.07)"
                        : isTop ? "rgba(245,197,66,0.04)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isMe ? "rgba(0,214,143,0.2)" : isTop ? "rgba(245,197,66,0.08)" : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    {/* Rank */}
                    <div className="w-7 text-center flex-shrink-0">
                      {i < 3
                        ? <span className="text-base">{MEDALS[i]}</span>
                        : <span className="text-xs font-mono text-gray-500">#{p.rank}</span>
                      }
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate"
                        style={{ color: isMe ? "var(--vpn-green)" : isTop ? "#f5c542" : "rgba(255,255,255,0.85)" }}>
                        {p.player_name}
                        {isMe && <span className="text-[10px] ml-1.5 text-gray-500">ты</span>}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5 font-mono">
                        🪙 {p.coins_earned}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-mono font-bold"
                        style={{ color: isTop ? "#f5c542" : "rgba(255,255,255,0.6)" }}>
                        {p.score}м
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My best if not in list */}
        {!loading && myEntry === undefined && currentPlayerName && submitted && (
          <div className="mx-4 mb-3 flex-shrink-0 py-2 px-3 rounded-xl text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-gray-500">Твой результат не попал в топ-50</p>
          </div>
        )}

        <div className="px-4 pb-4 pt-2 flex-shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
