const db = require('../config/database');

class Comment {
  // Get comments for a specific post
  static getByPost(postId, limit = 20, offset = 0) {
    try {
      // First, get the approved parent comments
      const stmt = db.prepare(`
        SELECT c.id, c.content, c.status, c.created_at, c.updated_at,
               c.parent_id,
               u.id as user_id, u.display_name as user_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ? AND c.parent_id IS NULL AND c.status = 'approved'
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `);
      
      const comments = stmt.all(postId, limit, offset);
      
      // For each comment, get the reply count
      for (const comment of comments) {
        const replyStmt = db.prepare(`
          SELECT COUNT(*) as count FROM comments 
          WHERE parent_id = ? AND status = 'approved'
        `);
        const result = replyStmt.get(comment.id);
        comment.reply_count = result.count;
      }
      
      return comments;
    } catch (error) {
      console.error('Error in getByPost:', error.message);
      return [];
    }
  }

  // Get replies to a specific comment
  static getReplies(commentId, limit = 10, offset = 0) {
    try {
      const stmt = db.prepare(`
        SELECT c.id, c.content, c.status, c.created_at,
               u.id as user_id, u.display_name as user_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.parent_id = ? AND c.status = 'approved'
        ORDER BY c.created_at ASC
        LIMIT ? OFFSET ?
      `);
      return stmt.all(commentId, limit, offset);
    } catch (error) {
      console.error('Error in getReplies:', error.message);
      return [];
    }
  }

  // Count comments for a post
  static countByPost(postId) {
    try {
      const stmt = db.prepare(`
        SELECT COUNT(*) as total 
        FROM comments 
        WHERE post_id = ? AND status = 'approved' AND parent_id IS NULL
      `);
      return stmt.get(postId).total;
    } catch (error) {
      console.error('Error in countByPost:', error.message);
      return 0;
    }
  }

  // Get a single comment by ID
  static getById(id) {
    try {
      const stmt = db.prepare(`
        SELECT c.*, u.display_name as user_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `);
      return stmt.get(id);
    } catch (error) {
      console.error('Error in getById:', error.message);
      return null;
    }
  }

  // Create a new comment
  static create(data) {
    const { post_id, user_id, content, parent_id } = data;
    
    const stmt = db.prepare(`
      INSERT INTO comments (post_id, user_id, content, parent_id, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    
    const result = stmt.run(post_id, user_id, content, parent_id || null);
    return this.getById(result.lastInsertRowid);
  }

  // Update comment status (approve, spam, trash)
  static updateStatus(id, status) {
    const stmt = db.prepare(`
      UPDATE comments SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
    return this.getById(id);
  }

  // Delete a comment
  static delete(id) {
    const stmt = db.prepare('DELETE FROM comments WHERE id = ?');
    return stmt.run(id);
  }

  // Get pending comments (for moderation)
  static getPending(limit = 20, offset = 0) {
    try {
      const stmt = db.prepare(`
        SELECT c.id, c.content, c.created_at,
               u.display_name as user_name,
               p.title as post_title, p.slug as post_slug
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN posts p ON c.post_id = p.id
        WHERE c.status = 'pending'
        ORDER BY c.created_at ASC
        LIMIT ? OFFSET ?
      `);
      return stmt.all(limit, offset);
    } catch (error) {
      console.error('Error in getPending:', error.message);
      return [];
    }
  }

  // Count pending comments
  static countPending() {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as total FROM comments WHERE status = "pending"');
      return stmt.get().total;
    } catch (error) {
      console.error('Error in countPending:', error.message);
      return 0;
    }
  }
}

module.exports = Comment;
