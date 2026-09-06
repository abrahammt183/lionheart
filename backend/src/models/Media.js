const db = require('../config/database');

class Media {
  // Get all media for a specific post
  static getByPost(postId) {
    try {
      const stmt = db.prepare(`
        SELECT id, post_id, type, url, caption, is_cover, sort_order, created_at
        FROM post_media
        WHERE post_id = ?
        ORDER BY sort_order ASC, created_at ASC
      `);
      return stmt.all(postId);
    } catch (error) {
      console.error('Error in getByPost:', error.message);
      return [];
    }
  }

  // Get cover image for a post
  static getCover(postId) {
    try {
      const stmt = db.prepare(`
        SELECT id, post_id, type, url, caption, created_at
        FROM post_media
        WHERE post_id = ? AND is_cover = 1
        LIMIT 1
      `);
      return stmt.get(postId);
    } catch (error) {
      console.error('Error in getCover:', error.message);
      return null;
    }
  }

  // Get a single media item by ID
  static getById(id) {
    try {
      const stmt = db.prepare(`
        SELECT id, post_id, type, url, caption, is_cover, sort_order, created_at
        FROM post_media
        WHERE id = ?
      `);
      return stmt.get(id);
    } catch (error) {
      console.error('Error in getById:', error.message);
      return null;
    }
  }

  // Add media to a post
  static create(data) {
    const { post_id, type, url, caption, is_cover, sort_order } = data;
    
    const stmt = db.prepare(`
      INSERT INTO post_media (post_id, type, url, caption, is_cover, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      post_id, 
      type || 'image', 
      url, 
      caption || null, 
      is_cover ? 1 : 0,
      sort_order || 0
    );
    
    // If this is marked as cover, ensure no other media for this post is cover
    if (is_cover) {
      const updateStmt = db.prepare(`
        UPDATE post_media SET is_cover = 0 
        WHERE post_id = ? AND id != ?
      `);
      updateStmt.run(post_id, result.lastInsertRowid);
    }
    
    return this.getById(result.lastInsertRowid);
  }

  // Update media
  static update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = ['caption', 'is_cover', 'sort_order'];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'is_cover' ? (data[field] ? 1 : 0) : data[field]);
      }
    }

    if (fields.length === 0) return this.getById(id);

    values.push(id);
    const stmt = db.prepare(`UPDATE post_media SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    // If this is marked as cover, ensure no other media for this post is cover
    if (data.is_cover) {
      const media = this.getById(id);
      if (media) {
        const updateStmt = db.prepare(`
          UPDATE post_media SET is_cover = 0 
          WHERE post_id = ? AND id != ?
        `);
        updateStmt.run(media.post_id, id);
      }
    }
    
    return this.getById(id);
  }

  // Delete media
  static delete(id) {
    const stmt = db.prepare('DELETE FROM post_media WHERE id = ?');
    return stmt.run(id);
  }

  // Delete all media for a post
  static deleteByPost(postId) {
    const stmt = db.prepare('DELETE FROM post_media WHERE post_id = ?');
    return stmt.run(postId);
  }
}

module.exports = Media;
