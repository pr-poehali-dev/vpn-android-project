import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import LeaderboardModal from "@/components/vpn/LeaderboardModal";

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 390;
const H = 320;
const GROUND = H - 56;
const GRAVITY = 0.55;
const JUMP_FORCE = -11.5;
const BASE_SPEED = 4.5;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Rect { x: number; y: number; w: number; h: number }

interface Obstacle extends Rect {
  type: "virus" | "hacker" | "firewall";
  color: string;
  speed: number;
}

interface Coin extends Rect {
  collected: boolean;
  anim: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  size: number;
}

interface GameState {
  running: boolean;
  dead: boolean;
  score: number;
  coins: number;
  distance: number;
  frame: number;
  speed: number;
  player: { x: number; y: number; vy: number; grounded: boolean; shieldHits: number; invincible: number };
  obstacles: Obstacle[];
  coinObjects: Coin[];
  particles: Particle[];
  bgLayers: { x: number; speed: number }[];
  groundOffset: number;
  lastObstacle: number;
  lastCoin: number;
  doubleJumpUsed: boolean;
}

// ─── Upgrade definitions ─────────────────────────────────────────────────────
const UPGRADES = [
  { id: "shield",      name: "Щит",           desc: "Выдерживает 1 удар",     icon: "Shield",     levels: [0,  80,  160, 280], effect: "shieldHits" },
  { id: "magnet",      name: "Магнит",         desc: "Притягивает монеты",     icon: "Magnet",     levels: [0,  60,  120, 220], effect: "magnet" },
  { id: "doublejump",  name: "Двойной прыжок", desc: "Прыгай дважды в воздухе",icon: "ChevronsUp", levels: [0,  70,  null, null], effect: "doubleJump" },
  { id: "speed",       name: "Адреналин",      desc: "Больше монет за скорость",icon: "Zap",       levels: [0,  50,  100, 180], effect: "speedBonus" },
] as const;

type UpgradeId = typeof UPGRADES[number]["id"];

interface UpgradeLevels { shield: number; magnet: number; doublejump: number; speed: number }

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, shieldLevel: number, invincible: number) {
  const t = frame * 0.15;
  const legSwing = Math.sin(t) * 6;
  const bodyBob = Math.abs(Math.sin(t)) * 2;

  // Shield glow
  if (shieldLevel > 0) {
    ctx.save();
    const alpha = invincible > 0 ? 0.3 + Math.sin(frame * 0.3) * 0.2 : 0.25;
    ctx.shadowColor = "#00d68f";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = `rgba(0,214,143,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 14, y + 16 - bodyBob, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  if (invincible > 0 && Math.floor(invincible / 4) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Legs
  ctx.fillStyle = "#1e40af";
  // Left leg
  ctx.save();
  ctx.translate(x + 8, y + 28 - bodyBob);
  ctx.rotate(legSwing * 0.08);
  drawRoundRect(ctx, -4, 0, 8, 14, 3);
  ctx.restore();
  // Right leg
  ctx.save();
  ctx.translate(x + 20, y + 28 - bodyBob);
  ctx.rotate(-legSwing * 0.08);
  drawRoundRect(ctx, -4, 0, 8, 14, 3);
  ctx.restore();

  // Body
  ctx.fillStyle = "#1e3a5f";
  drawRoundRect(ctx, x + 2, y + 14 - bodyBob, 24, 18, 5);

  // Visor/head
  ctx.fillStyle = "#0f172a";
  drawRoundRect(ctx, x + 4, y + 2 - bodyBob, 20, 16, 6);
  // Visor glow
  const grad = ctx.createLinearGradient(x + 4, y + 6, x + 24, y + 6);
  grad.addColorStop(0, "rgba(0,214,143,0.9)");
  grad.addColorStop(1, "rgba(96,165,250,0.7)");
  ctx.fillStyle = grad;
  drawRoundRect(ctx, x + 7, y + 5 - bodyBob, 14, 8, 3);

  // Arms
  ctx.fillStyle = "#1e40af";
  ctx.fillRect(x - 2, y + 15 - bodyBob, 6, 10);
  ctx.fillRect(x + 24, y + 15 - bodyBob, 6, 10);

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, frame: number) {
  ctx.save();
  const pulse = Math.sin(frame * 0.12) * 0.15 + 1;

  if (obs.type === "virus") {
    // Virus — red spiky circle
    ctx.shadowColor = obs.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = obs.color;
    ctx.beginPath();
    const cx = obs.x + obs.w / 2;
    const cy = obs.y + obs.h / 2;
    const r = (obs.w / 2) * pulse;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r2 = i % 2 === 0 ? r : r * 0.6;
      if (i === 0) ctx.moveTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      else ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    }
    ctx.closePath();
    ctx.fill();
    // Core
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.type === "hacker") {
    // Hacker — hooded figure
    ctx.shadowColor = obs.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#1a0a2e";
    drawRoundRect(ctx, obs.x + 4, obs.y + 10, obs.w - 8, obs.h - 10, 4);
    ctx.fillStyle = "#2d1b4e";
    ctx.beginPath();
    ctx.arc(obs.x + obs.w / 2, obs.y + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    // Hood shadow
    ctx.fillStyle = "#0d0618";
    drawRoundRect(ctx, obs.x + 6, obs.y + 4, obs.w - 12, 14, 8);
    // Eyes glow
    ctx.fillStyle = obs.color;
    ctx.shadowColor = obs.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(obs.x + 9, obs.y + 10, 4, 3);
    ctx.fillRect(obs.x + obs.w - 13, obs.y + 10, 4, 3);
  } else {
    // Firewall — wall of fire
    ctx.shadowColor = obs.color;
    ctx.shadowBlur = 14;
    const wg = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
    wg.addColorStop(0, "#ff6b00");
    wg.addColorStop(0.5, "#ff4d00");
    wg.addColorStop(1, "#cc2200");
    ctx.fillStyle = wg;
    drawRoundRect(ctx, obs.x, obs.y, obs.w, obs.h, 4);
    // Flame tips
    for (let i = 0; i < 4; i++) {
      const fx = obs.x + 4 + i * (obs.w / 4);
      const fh = 8 + Math.sin(frame * 0.2 + i) * 4;
      ctx.fillStyle = "#ffcc00";
      ctx.beginPath();
      ctx.arc(fx, obs.y - fh / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,200,0,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
  }
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin, frame: number) {
  if (coin.collected) return;
  const bob = Math.sin(frame * 0.1 + coin.x * 0.05) * 3;
  ctx.save();
  ctx.shadowColor = "#f5c542";
  ctx.shadowBlur = 8;
  const cg = ctx.createRadialGradient(coin.x + 7, coin.y + bob + 5, 2, coin.x + 7, coin.y + bob + 7, 8);
  cg.addColorStop(0, "#ffe066");
  cg.addColorStop(1, "#c8930a");
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(coin.x + 7, coin.y + bob + 7, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.arc(coin.x + 5, coin.y + bob + 5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function overlap(a: Rect, b: Rect, pad = 6) {
  return a.x + pad < b.x + b.w - pad &&
    a.x + a.w - pad > b.x + pad &&
    a.y + pad < b.y + b.h - pad &&
    a.y + a.h - pad > b.y + pad;
}

function spawnParticles(x: number, y: number, color: string, count = 8): Particle[] {
  return Array.from({ length: count }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 5,
    vy: (Math.random() - 0.5) * 5 - 2,
    life: 1,
    color,
    size: 2 + Math.random() * 3,
  }));
}

// ─── Coin exchange modal ──────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { hours: 1,  cost: 100,  label: "1 час" },
  { hours: 6,  cost: 500,  label: "6 часов" },
  { hours: 24, cost: 1800, label: "1 день" },
  { hours: 72, cost: 4500, label: "3 дня" },
];

interface ShopModalProps {
  totalCoins: number;
  onBuy: (cost: number, hours: number) => void;
  onClose: () => void;
}

function ShopModal({ totalCoins, onBuy, onClose }: ShopModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: "#0e1520", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Магазин подписки</h3>
              <p className="text-xs text-gray-400 mt-0.5">Обменяй монеты на VPN-время</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl"
            style={{ background: "rgba(245,197,66,0.1)", border: "1px solid rgba(245,197,66,0.2)" }}>
            <span className="text-lg">🪙</span>
            <span className="text-sm font-bold" style={{ color: "#f5c542" }}>{totalCoins} монет</span>
            <span className="text-xs text-gray-400 ml-auto">твой баланс</span>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {SHOP_ITEMS.map(item => {
            const canBuy = totalCoins >= item.cost;
            return (
              <button
                key={item.hours}
                onClick={() => canBuy && onBuy(item.cost, item.hours)}
                disabled={!canBuy}
                className="rounded-xl p-3 text-left transition-all duration-200"
                style={{
                  background: canBuy ? "rgba(0,214,143,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${canBuy ? "rgba(0,214,143,0.3)" : "rgba(255,255,255,0.07)"}`,
                  opacity: canBuy ? 1 : 0.5,
                }}
              >
                <p className="text-sm font-bold text-white">{item.label}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-sm">🪙</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: "#f5c542" }}>{item.cost}</span>
                </div>
                {canBuy && (
                  <p className="text-[10px] mt-1.5 tracking-wider" style={{ color: "var(--vpn-green)" }}>КУПИТЬ →</p>
                )}
              </button>
            );
          })}
        </div>
        <div className="px-4 pb-4">
          <p className="text-[10px] text-center text-gray-500">
            Подписка активируется автоматически после покупки
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Upgrade screen ───────────────────────────────────────────────────────────
interface UpgradeScreenProps {
  upgradeLevels: UpgradeLevels;
  totalCoins: number;
  onBuyUpgrade: (id: UpgradeId, cost: number) => void;
  onClose: () => void;
}

function UpgradeScreen({ upgradeLevels, totalCoins, onBuyUpgrade, onClose }: UpgradeScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: "#0e1520", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Прокачка агента</h3>
              <p className="text-xs text-gray-400 mt-0.5">Улучши своего персонажа</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl"
            style={{ background: "rgba(245,197,66,0.1)", border: "1px solid rgba(245,197,66,0.2)" }}>
            <span className="text-lg">🪙</span>
            <span className="text-sm font-bold" style={{ color: "#f5c542" }}>{totalCoins} монет</span>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3 max-h-80 overflow-y-auto">
          {UPGRADES.map(upg => {
            const currentLevel = upgradeLevels[upg.id];
            const validLevels = upg.levels.filter(l => l !== null);
            const maxLevel = validLevels.length - 1;
            const isMax = currentLevel >= maxLevel;
            const nextCost = isMax ? 0 : (validLevels[currentLevel + 1] as number);
            const canBuy = !isMax && totalCoins >= nextCost;

            return (
              <div key={upg.id} className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,214,143,0.12)", border: "1px solid rgba(0,214,143,0.2)" }}>
                    <Icon name={upg.icon as never} size={18} style={{ color: "var(--vpn-green)" } as React.CSSProperties} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{upg.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: isMax ? "rgba(0,214,143,0.15)" : "rgba(255,255,255,0.06)", color: isMax ? "var(--vpn-green)" : "rgba(255,255,255,0.4)" }}>
                        {isMax ? "МАКС" : `Ур.${currentLevel}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{upg.desc}</p>
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: Math.max(maxLevel, 1) }).map((_, i) => (
                        <div key={i} className="h-1 flex-1 rounded-full"
                          style={{ background: i < currentLevel ? "var(--vpn-green)" : "rgba(255,255,255,0.1)" }} />
                      ))}
                    </div>
                  </div>
                  {!isMax && (
                    <button
                      onClick={() => canBuy && onBuyUpgrade(upg.id, nextCost)}
                      disabled={!canBuy}
                      className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200"
                      style={{
                        background: canBuy ? "var(--vpn-green)" : "rgba(255,255,255,0.05)",
                        opacity: canBuy ? 1 : 0.5,
                      }}
                    >
                      <span className="text-xs">🪙</span>
                      <span className="text-[11px] font-bold" style={{ color: canBuy ? "#0a1a0f" : "rgba(255,255,255,0.4)" }}>{nextCost}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Game Component ───────────────────────────────────────────────────────
export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);
  const jumpRef = useRef(false);

  const [uiState, setUiState] = useState({
    score: 0, coins: 0, dead: false, running: false, started: false,
    totalCoins: 0, bestScore: 0,
  });
  const [upgradeLevels, setUpgradeLevels] = useState<UpgradeLevels>({ shield: 0, magnet: 0, doublejump: 0, speed: 0 });
  const [showShop, setShowShop] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("vpn_runner_name") || "");
  const [editingName, setEditingName] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState({ score: 0, coins: 0 });

  const upgradeLevelsRef = useRef(upgradeLevels);
  upgradeLevelsRef.current = upgradeLevels;

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  const initState = useCallback((): GameState => ({
    running: false,
    dead: false,
    score: 0,
    coins: 0,
    distance: 0,
    frame: 0,
    speed: BASE_SPEED,
    player: { x: 60, y: GROUND - 44, vy: 0, grounded: true, shieldHits: upgradeLevelsRef.current.shield, invincible: 0 },
    obstacles: [],
    coinObjects: [],
    particles: [],
    bgLayers: [{ x: 0, speed: 0.5 }, { x: 0, speed: 1.2 }],
    groundOffset: 0,
    lastObstacle: 200,
    lastCoin: 100,
    doubleJumpUsed: false,
  }), []);

  const jump = useCallback(() => {
    const gs = stateRef.current;
    if (!gs || !gs.running || gs.dead) return;
    if (gs.player.grounded) {
      gs.player.vy = JUMP_FORCE;
      gs.player.grounded = false;
      gs.doubleJumpUsed = false;
    } else if (upgradeLevelsRef.current.doublejump >= 1 && !gs.doubleJumpUsed) {
      gs.player.vy = JUMP_FORCE * 0.85;
      gs.doubleJumpUsed = true;
      gs.particles.push(...spawnParticles(gs.player.x + 14, gs.player.y + 30, "#60a5fa", 6));
    }
  }, []);

  const startGame = useCallback(() => {
    stateRef.current = initState();
    stateRef.current.running = true;
    setUiState(u => ({ ...u, score: 0, coins: 0, dead: false, running: true, started: true }));
  }, [initState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  // ─── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const OBSTACLE_TYPES: Obstacle["type"][] = ["virus", "hacker", "firewall"];
    const OBS_COLORS = { virus: "#ff4d4d", hacker: "#a855f7", firewall: "#ff6b00" };
    const OBS_SIZES: Record<string, { w: number; h: number }> = {
      virus: { w: 34, h: 34 },
      hacker: { w: 28, h: 48 },
      firewall: { w: 18, h: 56 },
    };

    function spawnObstacle(gs: GameState) {
      const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      const size = OBS_SIZES[type];
      gs.obstacles.push({
        type, color: OBS_COLORS[type],
        x: W + 20, y: GROUND - size.h,
        w: size.w, h: size.h, speed: gs.speed,
      });
    }

    function spawnCoins(gs: GameState) {
      const count = 3 + Math.floor(Math.random() * 4);
      const startX = W + 20;
      const yVariants = [GROUND - 20, GROUND - 60, GROUND - 100];
      const baseY = yVariants[Math.floor(Math.random() * yVariants.length)];
      for (let i = 0; i < count; i++) {
        gs.coinObjects.push({ x: startX + i * 28, y: baseY, w: 14, h: 14, collected: false, anim: 0 });
      }
    }

    function drawBg(gs: GameState) {
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#060d1a");
      sky.addColorStop(1, "#0d1f38");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Stars / nodes layer 1 (slow)
      ctx.fillStyle = "rgba(0,214,143,0.15)";
      const nodes = [20, 80, 150, 230, 320, 380, 70, 190, 290];
      nodes.forEach((nx, i) => {
        const ox = ((nx - gs.bgLayers[0].x * 0.5) % W + W) % W;
        const ny = 20 + (i * 37) % 80;
        ctx.beginPath();
        ctx.arc(ox, ny, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Grid lines (parallax)
      ctx.strokeStyle = "rgba(0,214,143,0.05)";
      ctx.lineWidth = 1;
      const gridOffset = gs.groundOffset % 40;
      for (let gx = -gridOffset; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, GROUND); ctx.stroke();
      }

      // Ground strip
      const gnd = ctx.createLinearGradient(0, GROUND, 0, H);
      gnd.addColorStop(0, "#0a1628");
      gnd.addColorStop(1, "#060d18");
      ctx.fillStyle = gnd;
      ctx.fillRect(0, GROUND, W, H - GROUND);

      // Ground line glow
      ctx.shadowColor = "rgba(0,214,143,0.4)";
      ctx.shadowBlur = 6;
      ctx.strokeStyle = "rgba(0,214,143,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(W, GROUND);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Ground dashes
      ctx.strokeStyle = "rgba(0,214,143,0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([20, 30]);
      ctx.lineDashOffset = -gs.groundOffset;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 8);
      ctx.lineTo(W, GROUND + 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawHUD(gs: GameState) {
      // Score
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 13px 'IBM Plex Mono'";
      ctx.fillText(`${Math.floor(gs.distance)}м`, W - 70, 28);

      // Coins HUD
      ctx.fillStyle = "#f5c542";
      ctx.font = "bold 13px 'IBM Plex Mono'";
      ctx.fillText(`🪙 ${gs.coins}`, 16, 28);

      // Shield pips
      if (upgradeLevelsRef.current.shield > 0) {
        for (let i = 0; i < upgradeLevelsRef.current.shield; i++) {
          const hasHit = i >= gs.player.shieldHits;
          ctx.fillStyle = hasHit ? "rgba(0,214,143,0.2)" : "rgba(0,214,143,0.8)";
          ctx.beginPath();
          ctx.arc(16 + i * 16, 44, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Speed indicator
      const speedPct = (gs.speed - BASE_SPEED) / 4;
      if (speedPct > 0) {
        ctx.fillStyle = `rgba(245,197,66,${0.3 + speedPct * 0.5})`;
        ctx.font = "10px 'IBM Plex Mono'";
        ctx.fillText(`⚡ x${(1 + speedPct).toFixed(1)}`, W - 70, 48);
      }
    }

    function tick() {
      const gs = stateRef.current;
      if (!gs) { rafRef.current = requestAnimationFrame(tick); return; }

      drawBg(gs);

      if (!gs.running || gs.dead) {
        drawHUD(gs);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      gs.frame++;
      gs.distance += gs.speed * 0.05;
      gs.score = Math.floor(gs.distance);
      gs.groundOffset += gs.speed;
      gs.bgLayers[0].x += gs.bgLayers[0].speed;
      gs.speed = BASE_SPEED + Math.min(gs.distance * 0.008, 5);

      // Physics
      gs.player.vy += GRAVITY;
      gs.player.y += gs.player.vy;
      if (gs.player.y >= GROUND - 44) {
        gs.player.y = GROUND - 44;
        gs.player.vy = 0;
        gs.player.grounded = true;
        gs.doubleJumpUsed = false;
      }
      if (gs.player.invincible > 0) gs.player.invincible--;

      // Spawn obstacles
      gs.lastObstacle++;
      const minGap = Math.max(90, 160 - gs.distance * 0.1);
      if (gs.lastObstacle > minGap && Math.random() < 0.03) {
        spawnObstacle(gs);
        gs.lastObstacle = 0;
      }

      // Spawn coins
      gs.lastCoin++;
      if (gs.lastCoin > 60 && Math.random() < 0.04) {
        spawnCoins(gs);
        gs.lastCoin = 0;
      }

      // Move & check obstacles
      gs.obstacles = gs.obstacles.filter(obs => {
        obs.x -= obs.speed;
        if (obs.x + obs.w < 0) return false;

        // Collision
        const pr: Rect = { x: gs.player.x + 6, y: gs.player.y + 4, w: 20, h: 40 };
        if (overlap(pr, obs) && gs.player.invincible === 0) {
          if (gs.player.shieldHits > 0) {
            gs.player.shieldHits--;
            gs.player.invincible = 60;
            gs.particles.push(...spawnParticles(gs.player.x + 14, gs.player.y + 20, "#00d68f", 12));
          } else {
            gs.dead = true;
            gs.running = false;
            gs.particles.push(...spawnParticles(gs.player.x + 14, gs.player.y + 20, "#ff4d4d", 20));
            const finalScore = gs.score;
            const finalCoins = gs.coins;
            setLastScore({ score: finalScore, coins: finalCoins });
            setUiState(u => ({
              ...u, dead: true, running: false,
              score: finalScore,
              coins: finalCoins,
              totalCoins: u.totalCoins + finalCoins,
              bestScore: Math.max(u.bestScore, finalScore),
            }));
          }
        }
        return true;
      });

      // Magnet radius
      const magnetRadius = upgradeLevelsRef.current.magnet === 0 ? 0
        : upgradeLevelsRef.current.magnet === 1 ? 60
        : upgradeLevelsRef.current.magnet === 2 ? 100 : 150;

      // Move & collect coins
      gs.coinObjects = gs.coinObjects.filter(coin => {
        coin.x -= gs.speed;
        if (coin.x + coin.w < 0) return false;
        if (coin.collected) { coin.anim++; return coin.anim < 20; }

        // Magnet
        if (magnetRadius > 0) {
          const dx = (gs.player.x + 14) - (coin.x + 7);
          const dy = (gs.player.y + 20) - (coin.y + 7);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < magnetRadius) {
            coin.x += dx * 0.15;
            coin.y += dy * 0.15;
          }
        }

        const pr: Rect = { x: gs.player.x + 4, y: gs.player.y + 4, w: 24, h: 40 };
        if (overlap(pr, coin, 0)) {
          coin.collected = true;
          const bonus = upgradeLevelsRef.current.speed > 0 ? 1 + upgradeLevelsRef.current.speed * 0.5 : 1;
          gs.coins += Math.ceil(bonus);
          gs.particles.push(...spawnParticles(coin.x + 7, coin.y + 7, "#f5c542", 6));
          setUiState(u => ({ ...u, coins: gs.coins }));
        }
        return true;
      });

      // Particles
      gs.particles = gs.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.04;
        return p.life > 0;
      });

      // Draw
      gs.obstacles.forEach(obs => drawObstacle(ctx, obs, gs.frame));
      gs.coinObjects.forEach(coin => drawCoin(ctx, coin, gs.frame));
      drawParticles(ctx, gs.particles);
      drawPlayer(ctx, gs.player.x, gs.player.y, gs.frame, upgradeLevelsRef.current.shield, gs.player.invincible);
      drawHUD(gs);

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleBuyUpgrade = (id: UpgradeId, cost: number) => {
    setUiState(u => {
      if (u.totalCoins < cost) return u;
      setUpgradeLevels(prev => ({ ...prev, [id]: prev[id] + 1 }));
      showNotif("Улучшение куплено!");
      return { ...u, totalCoins: u.totalCoins - cost };
    });
  };

  const handleBuySubscription = (cost: number, hours: number) => {
    setUiState(u => {
      if (u.totalCoins < cost) return u;
      showNotif(`+${hours}ч подписки активировано!`);
      return { ...u, totalCoins: u.totalCoins - cost };
    });
    setShowShop(false);
  };

  return (
    <div className="pt-4 flex flex-col gap-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Cyber Runner</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Прыгай, уклоняйся, зарабатывай</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:border-yellow-400/40"
            style={{ background: "rgba(245,197,66,0.07)", border: "1px solid rgba(245,197,66,0.15)" }}>
            <Icon name="Trophy" size={14} style={{ color: "#f5c542" } as React.CSSProperties} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(245,197,66,0.1)", border: "1px solid rgba(245,197,66,0.2)" }}>
            <span className="text-sm">🪙</span>
            <span className="text-sm font-bold font-mono" style={{ color: "#f5c542" }}>{uiState.totalCoins}</span>
          </div>
        </div>
      </div>

      {/* Player name */}
      <div className="flex items-center gap-2">
        {editingName ? (
          <input
            autoFocus
            value={playerName}
            maxLength={20}
            onChange={e => setPlayerName(e.target.value)}
            onBlur={() => { setEditingName(false); localStorage.setItem("vpn_runner_name", playerName); }}
            onKeyDown={e => { if (e.key === "Enter") { setEditingName(false); localStorage.setItem("vpn_runner_name", playerName); } }}
            placeholder="Введи имя агента..."
            className="flex-1 text-xs px-3 py-2 rounded-xl font-mono focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,214,143,0.3)", color: "var(--vpn-green)" }}
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:border-white/15"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Icon name="User" size={12} className="text-muted-foreground" />
            <span className="font-mono" style={{ color: playerName ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
              {playerName || "Нажми, чтобы задать имя"}
            </span>
            <Icon name="Pencil" size={10} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(0,214,143,0.15)", boxShadow: "0 0 30px rgba(0,214,143,0.06)" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full"
          style={{ display: "block", touchAction: "none" }}
          onPointerDown={e => { e.preventDefault(); if (!uiState.started || uiState.dead) startGame(); else jump(); }}
        />

        {/* Start overlay */}
        {!uiState.started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(6,13,26,0.85)", backdropFilter: "blur(4px)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(0,214,143,0.12)", border: "1px solid rgba(0,214,143,0.3)" }}>
              <Icon name="Play" size={32} style={{ color: "var(--vpn-green)" } as React.CSSProperties} />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Cyber Runner</h3>
            <p className="text-gray-400 text-xs text-center px-8 mb-5">
              Убегай от хакеров, вирусов и файрволов.<br />Собирай монеты и прокачивай агента.
            </p>
            <button onClick={startGame}
              className="px-8 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: "var(--vpn-green)", color: "#0a1a0f" }}>
              Начать игру
            </button>
            <p className="text-gray-600 text-[11px] mt-3">Тап / Пробел — прыжок</p>
          </div>
        )}

        {/* Death overlay */}
        {uiState.dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: "rgba(6,13,26,0.9)", backdropFilter: "blur(4px)" }}>
            <p className="text-2xl">☠️</p>
            <p className="text-red-400 font-bold text-base">Агент захвачен!</p>
            <p className="text-gray-400 text-xs">
              <span className="text-white font-mono">{uiState.score}м</span>
              {" · "}
              <span style={{ color: "#f5c542" }} className="font-mono">🪙{uiState.coins}</span>
            </p>
            <div className="flex gap-2 mt-1">
              <button onClick={startGame}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "var(--vpn-green)", color: "#0a1a0f" }}>
                Снова
              </button>
              <button onClick={() => setShowLeaderboard(true)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5"
                style={{ background: "rgba(245,197,66,0.15)", border: "1px solid rgba(245,197,66,0.3)", color: "#f5c542" }}>
                <Icon name="Trophy" size={14} style={{ color: "#f5c542" } as React.CSSProperties} />
                Рейтинг
              </button>
            </div>
            <p className="text-gray-600 text-[10px]">Рекорд: {uiState.bestScore}м</p>
          </div>
        )}
      </div>

      {/* Live score row */}
      {uiState.running && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-3 flex items-center gap-2">
            <Icon name="Ruler" size={14} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Дистанция</p>
              <p className="text-sm font-mono font-semibold text-foreground">{uiState.score}м</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-3 flex items-center gap-2">
            <span className="text-sm">🪙</span>
            <div>
              <p className="text-xs text-muted-foreground">Эта сессия</p>
              <p className="text-sm font-mono font-semibold" style={{ color: "#f5c542" }}>{uiState.coins}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowUpgrades(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", color: "var(--vpn-green)" }}>
          <Icon name="Swords" size={16} style={{ color: "var(--vpn-green)" } as React.CSSProperties} />
          Прокачка
        </button>
        <button
          onClick={() => setShowShop(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "rgba(245,197,66,0.1)", border: "1px solid rgba(245,197,66,0.25)", color: "#f5c542" }}>
          <span>🪙</span>
          Обменять
        </button>
      </div>

      {/* Best score */}
      {uiState.bestScore > 0 && (
        <div className="glass-card rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Trophy" size={14} style={{ color: "#f5c542" } as React.CSSProperties} />
            <span className="text-xs text-muted-foreground">Лучший результат</span>
          </div>
          <span className="text-sm font-mono font-semibold text-foreground">{uiState.bestScore}м</span>
        </div>
      )}

      {/* Upgrade levels display */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-[10px] text-muted-foreground tracking-widest mb-3">СНАРЯЖЕНИЕ АГЕНТА</p>
        <div className="grid grid-cols-4 gap-2">
          {UPGRADES.map(upg => (
            <div key={upg.id} className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: upgradeLevels[upg.id] > 0 ? "rgba(0,214,143,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${upgradeLevels[upg.id] > 0 ? "rgba(0,214,143,0.25)" : "rgba(255,255,255,0.06)"}`
                }}>
                <Icon name={upg.icon as never} size={16}
                  style={{ color: upgradeLevels[upg.id] > 0 ? "var(--vpn-green)" : "rgba(255,255,255,0.2)" } as React.CSSProperties} />
              </div>
              <span className="text-[9px] text-center text-muted-foreground leading-tight">{upg.name}</span>
              {upgradeLevels[upg.id] > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: upgradeLevels[upg.id] }).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full" style={{ background: "var(--vpn-green)" }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-sm font-semibold animate-fade-in-up"
          style={{ background: "var(--vpn-green)", color: "#0a1a0f", boxShadow: "0 4px 20px rgba(0,214,143,0.4)" }}>
          {notification}
        </div>
      )}

      {showUpgrades && (
        <UpgradeScreen
          upgradeLevels={upgradeLevels}
          totalCoins={uiState.totalCoins}
          onBuyUpgrade={handleBuyUpgrade}
          onClose={() => setShowUpgrades(false)}
        />
      )}
      {showShop && (
        <ShopModal
          totalCoins={uiState.totalCoins}
          onBuy={handleBuySubscription}
          onClose={() => setShowShop(false)}
        />
      )}
      {showLeaderboard && (
        <LeaderboardModal
          onClose={() => setShowLeaderboard(false)}
          currentPlayerName={playerName || undefined}
          newScore={uiState.dead && lastScore.score > 0 ? lastScore.score : undefined}
          newCoins={uiState.dead && lastScore.score > 0 ? lastScore.coins : undefined}
          onSaved={(rank) => showNotif(`Место #${rank} в рейтинге!`)}
        />
      )}
    </div>
  );
}