import sqlite3
import datetime

conn = sqlite3.connect('skillsprint.db')
c = conn.cursor()

c.execute("SELECT id FROM users WHERE email='sales.emp@fourangrybirds.vn'")
user_id = c.fetchone()[0]

c.execute("SELECT id FROM learning_paths")
paths = c.fetchall()
path_id = paths[0][0]

now = datetime.datetime.now().isoformat()
c.execute("INSERT INTO enrollments (user_id, path_id, lessons_read, tasks_done, started_at, completed_at, status, source, assigned_at) VALUES (?, ?, '[]', '[]', ?, ?, 'completed', 'self', ?)", (user_id, path_id, now, now, now))

conn.commit()
print('Successfully forced completed path for Sales')
