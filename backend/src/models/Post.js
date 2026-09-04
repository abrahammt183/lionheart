const db = require('../config/database');

class Post {
  // Get all published posts
  static getPublished(limit = 10, offset = 0) {
    const stmt = db.prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, 
             p.views, p.published_at, p.created_at,
             u.display_name as author_name,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  }

  // Count published posts
  static countPublished() {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM posts WHERE status = "published"');
    return stmt.get().total;
  }

  // Get a single post by slug
  static getBySlug(slug) {
    const stmt = db.prepare(`
      SELECT p.*, 
             u.display_name as author_name,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `);
    return stmt.get(slug);
  }

  // Create a new post
  static create(data) {
    const { title, slug, content, excerpt, category_id, author_id, status, featured_image } = data;
    
    const stmt = db.prepare(`
      INSERT INTO posts (title, slug, content, excerpt, category_id, author_id, status, featured_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(title, slug, content, excerpt, category_id, author_id, status || 'draft', featured_image || null);
    return this.getById(result.lastInsertRowid);
  }

  // Get post by ID
  static getById(id) {
    const stmt = db.prepare(`
      SELECT p.*, 
             u.display_name as author_name,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `);
    return stmt.get(id);
  }

  // Update a post
  static update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = ['title', 'slug', 'content', 'excerpt', 'category_id', 'status', 'featured_image'];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (data.status === 'published' && !data.published_at) {
      fields.push('published_at = CURRENT_TIMESTAMP');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    return this.getById(id);
  }

  // Delete a post
  static delete(id) {
    const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
    return stmt.run(id);
  }

  // Increment view count
  static incrementViews(id) {
    const stmt = db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?');
    stmt.run(id);
  }

  // Get posts by category
  static getByCategory(categorySlug, limit = 10, offset = 0) {
    const stmt = db.prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, 
             p.views, p.published_at, p.created_at,
             u.display_name as author_name,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published' AND c.slug = ?
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(categorySlug, limit, offset);
  }

  // Search posts using FTS5
  static search(query, limit = 20) {
    const stmt = db.prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image,
             p.views, p.published_at,
             u.display_name as author_name,
             c.name as category_name,
             fts.rank
      FROM posts_fts fts
      JOIN posts p ON p.id = fts.rowid
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE posts_fts MATCH ? AND p.status = 'published'
      ORDER BY rank
      LIMIT ?
    `);
    return stmt.all(query, limit);
  }
}

module.exports = Post;
