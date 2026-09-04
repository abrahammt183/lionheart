const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Find user by email
  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  // Find user by ID
  static findById(id) {
    const stmt = db.prepare('SELECT id, email, display_name, role, is_active, created_at, updated_at FROM users WHERE id = ?');
    return stmt.get(id);
  }

  // Create a new user
  static create(email, password, displayName = null) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, display_name, role)
      VALUES (?, ?, ?, 'user')
    `);
    
    const result = stmt.run(email, hashedPassword, displayName);
    return this.findById(result.lastInsertRowid);
  }

  // Verify password
  static verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  }

  // Update user
  static update(id, data) {
    const updates = [];
    const values = [];

    if (data.display_name) {
      updates.push('display_name = ?');
      values.push(data.display_name);
    }
    if (data.role) {
      updates.push('role = ?');
      values.push(data.role);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }
}

module.exports = User;
