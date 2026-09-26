import psycopg
from app.core.security import hash_password

conn = psycopg.connect("postgresql://postgres:123@localhost:5432/skillsprint_db", autocommit=True)
cur = conn.cursor()

print("Updating check constraints to include admin role...")
cur.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_user_role;")
cur.execute("ALTER TABLE users ADD CONSTRAINT ck_users_user_role CHECK (user_role IN ('admin', 'hr', 'reviewer', 'employee'));")

cur.execute("ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS ck_audit_logs_actor_role;")
cur.execute("ALTER TABLE audit_logs ADD CONSTRAINT ck_audit_logs_actor_role CHECK (actor_role IN ('admin', 'hr', 'reviewer', 'employee'));")

print("Seeding admin account admin@fourangrybirds.vn...")
cur.execute("SELECT id FROM users WHERE email = 'admin@fourangrybirds.vn';")
admin_user = cur.fetchone()
if not admin_user:
    pw_hash = hash_password("Demo@123")
    cur.execute(
        """
        INSERT INTO users (id, email, password_hash, name, user_role, job_title, department_code, is_active, created_at)
        VALUES ('USR-ADMIN-01', 'admin@fourangrybirds.vn', %s, 'Alexandre Admin', 'admin', 'System Administrator', 'Company-wide', true, NOW());
        """,
        (pw_hash,),
    )
    print("Created admin account: admin@fourangrybirds.vn / Demo@123")
else:
    cur.execute("UPDATE users SET user_role = 'admin', is_active = true WHERE email = 'admin@fourangrybirds.vn';")
    print("Updated existing admin account.")

conn.close()
print("Database role constraints and admin user ready!")
