CREATE TABLE IF NOT EXISTS t_p31858906_vpn_android_project.leaderboard (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(32) NOT NULL,
  score INTEGER NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON t_p31858906_vpn_android_project.leaderboard(score DESC);
