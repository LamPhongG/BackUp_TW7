import sqlite3
conn = sqlite3.connect('skillsprint.db')
c = conn.cursor()
print(c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='enrollments'").fetchone()[0])
