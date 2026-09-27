import sqlite3
conn = sqlite3.connect('skillsprint.db')
c = conn.cursor()
c.execute("UPDATE learning_paths SET status='published' WHERE id='LP-17D8260750'")
conn.commit()
print('Updated path status. Rows affected:', c.rowcount)
