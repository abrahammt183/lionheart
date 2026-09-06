const db = require('../config/database');

class Outbox {
  // Add a message to the outbox queue
  static add(channel, event, payload, scheduledFor = null) {
    try {
      const stmt = db.prepare(`
        INSERT INTO outbox (channel, event, payload, scheduled_for, status)
        VALUES (?, ?, ?, ?, 'pending')
      `);
      
      const result = stmt.run(
        channel,
        event || 'custom',
        JSON.stringify(payload),
        scheduledFor || null
      );
      
      return this.getById(result.lastInsertRowid);
    } catch (error) {
      console.error('Error in add:', error.message);
      return null;
    }
  }

  // Get a single outbox item by ID
  static getById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM outbox WHERE id = ?');
      const item = stmt.get(id);
      if (item) {
        item.payload = JSON.parse(item.payload);
      }
      return item;
    } catch (error) {
      console.error('Error in getById:', error.message);
      return null;
    }
  }

  // Get pending items (ready to send)
  static getPending(limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM outbox
        WHERE status = 'pending'
          AND (scheduled_for IS NULL OR scheduled_for <= CURRENT_TIMESTAMP)
        ORDER BY created_at ASC
        LIMIT ?
      `);
      const items = stmt.all(limit);
      for (const item of items) {
        item.payload = JSON.parse(item.payload);
      }
      return items;
    } catch (error) {
      console.error('Error in getPending:', error.message);
      return [];
    }
  }

  // Count pending items
  static countPending() {
    try {
      const stmt = db.prepare(`
        SELECT COUNT(*) as total FROM outbox
        WHERE status = 'pending'
          AND (scheduled_for IS NULL OR scheduled_for <= CURRENT_TIMESTAMP)
      `);
      return stmt.get().total;
    } catch (error) {
      console.error('Error in countPending:', error.message);
      return 0;
    }
  }

  // Mark item as sent
  static markSent(id) {
    try {
      const stmt = db.prepare(`
        UPDATE outbox SET status = 'sent', sent_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(id);
      return this.getById(id);
    } catch (error) {
      console.error('Error in markSent:', error.message);
      return null;
    }
  }

  // Mark item as failed
  static markFailed(id) {
    try {
      const stmt = db.prepare(`
        UPDATE outbox SET status = 'failed', retries = retries + 1
        WHERE id = ?
      `);
      stmt.run(id);
      return this.getById(id);
    } catch (error) {
      console.error('Error in markFailed:', error.message);
      return null;
    }
  }

  // Get all items (admin)
  static getAll(limit = 50, offset = 0) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM outbox
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `);
      const items = stmt.all(limit, offset);
      for (const item of items) {
        item.payload = JSON.parse(item.payload);
      }
      return items;
    } catch (error) {
      console.error('Error in getAll:', error.message);
      return [];
    }
  }

  // Count all items
  static countAll() {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as total FROM outbox');
      return stmt.get().total;
    } catch (error) {
      console.error('Error in countAll:', error.message);
      return 0;
    }
  }

  // Delete an item
  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM outbox WHERE id = ?');
      return stmt.run(id);
    } catch (error) {
      console.error('Error in delete:', error.message);
      return null;
    }
  }

  // Delete sent items older than X days
  static cleanOld(days = 30) {
    try {
      const stmt = db.prepare(`
        DELETE FROM outbox 
        WHERE status IN ('sent', 'failed') 
          AND created_at < datetime('now', '-' || ? || ' days')
      `);
      return stmt.run(days);
    } catch (error) {
      console.error('Error in cleanOld:', error.message);
      return null;
    }
  }

  // Retry failed items (reset to pending)
  static retryFailed() {
    try {
      const stmt = db.prepare(`
        UPDATE outbox 
        SET status = 'pending', retries = retries + 1
        WHERE status = 'failed' AND retries < 5
      `);
      return stmt.run();
    } catch (error) {
      console.error('Error in retryFailed:', error.message);
      return null;
    }
  }
}

module.exports = Outbox;
