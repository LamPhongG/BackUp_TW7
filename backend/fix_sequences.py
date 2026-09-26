import psycopg

conn = psycopg.connect('postgresql://postgres:123@localhost:5432/skillsprint_db')
cur = conn.cursor()

# Find all auto-increment sequence columns in public schema
cur.execute("""
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_default LIKE 'nextval%';
""")
seq_cols = cur.fetchall()
print(f"Found {len(seq_cols)} sequence columns:")

for table, col in seq_cols:
    cur.execute(f"SELECT COALESCE(MAX({col}), 0) FROM {table};")
    max_val = cur.fetchone()[0]
    cur.execute(f"SELECT pg_get_serial_sequence('{table}', '{col}');")
    seq_name = cur.fetchone()[0]
    if seq_name:
        next_val = max(1, max_val + 1)
        cur.execute(f"SELECT setval('{seq_name}', {next_val}, false);")
        print(f"  - Table {table}.{col}: max_val={max_val} -> setval('{seq_name}', {next_val})")

conn.commit()
conn.close()
print("All PostgreSQL sequences successfully synchronized!")
