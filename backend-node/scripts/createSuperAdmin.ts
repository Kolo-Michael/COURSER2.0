/**
 * Super admin upsert — Node port of backend/create_super_admin.py +
 * backend/fix_super_admin.py combined (create if missing, else reset
 * password to the documented credential).
 *
 * Usage: npm run superadmin
 */
import { pool } from "../src/db.js";
import { hashPassword } from "../src/security.js";

const EMAIL = "superadmin@smarttutor.com";
const PASSWORD = "SuperAdmin123!";

async function main(): Promise<void> {
  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [EMAIL]
  );
  if (existing.rows[0]) {
    await pool.query(
      `UPDATE users SET hashed_password = $2, is_active = true, is_verified = true WHERE id = $1`,
      [existing.rows[0].id, hashPassword(PASSWORD)]
    );
    console.log("Super admin password reset to the documented credential.");
  } else {
    await pool.query(
      `INSERT INTO users (username, email, hashed_password, full_name, role, is_active, is_verified)
       VALUES ($1, $2, $3, $4, 'super_admin', true, true)`,
      ["superadmin", EMAIL, hashPassword(PASSWORD), "Super Admin"]
    );
    console.log("Super admin created.");
  }
  console.log(`Email: ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});