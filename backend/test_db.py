import psycopg

try:
    conn = psycopg.connect("postgresql://postgres:123@localhost:5432/skillsprint_db")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    row = cur.fetchone()
    print("PostgreSQL connected OK!")
    print("DB version:", row[0][:80])
    cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;")
    tables = [r[0] for r in cur.fetchall()]
    print("Tables:", tables if tables else "(empty - chua chay migrations)")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
