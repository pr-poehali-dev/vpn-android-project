"""
Leaderboard для игры Cyber Runner.
GET  / — топ-50 игроков
POST / — сохранить результат { player_name, score, coins_earned }
"""
import json
import os
import psycopg2

SCHEMA = "t_p31858906_vpn_android_project"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""
            SELECT player_name, score, coins_earned
            FROM {SCHEMA}.leaderboard
            ORDER BY score DESC
            LIMIT 50
            """
        )
        rows = cur.fetchall()
        conn.close()

        players = [
            {"rank": i + 1, "player_name": r[0], "score": r[1], "coins_earned": r[2]}
            for i, r in enumerate(rows)
        ]
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"players": players})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        name = str(body.get("player_name", "Агент"))[:32].strip() or "Агент"
        score = int(body.get("score", 0))
        coins = int(body.get("coins_earned", 0))

        if score <= 0:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "score must be > 0"})}

        conn = get_conn()
        cur = conn.cursor()

        # Сохраняем только если это лучший результат игрока
        cur.execute(
            f"SELECT id, score FROM {SCHEMA}.leaderboard WHERE player_name = %s ORDER BY score DESC LIMIT 1",
            (name,)
        )
        existing = cur.fetchone()

        if existing is None or score > existing[1]:
            if existing:
                cur.execute(f"DELETE FROM {SCHEMA}.leaderboard WHERE player_name = %s", (name,))
            cur.execute(
                f"INSERT INTO {SCHEMA}.leaderboard (player_name, score, coins_earned) VALUES (%s, %s, %s)",
                (name, score, coins)
            )
            conn.commit()
            is_record = True
        else:
            is_record = False

        conn.close()

        # Получаем позицию
        conn2 = get_conn()
        cur2 = conn2.cursor()
        cur2.execute(
            f"SELECT COUNT(*)+1 FROM {SCHEMA}.leaderboard WHERE score > %s", (score,)
        )
        rank = cur2.fetchone()[0]
        conn2.close()

        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"saved": True, "is_record": is_record, "rank": rank})}

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method not allowed"})}