const db = require('../config/database');

class Product {
  // Get all active products
  static getActive(limit = 20, offset = 0) {
    try {
      const stmt = db.prepare(`
        SELECT p.id, p.name, p.slug, p.description, p.price, 
               p.compare_price, p.stock, p.stock_status, 
               p.images, p.category_id, p.tags, p.is_featured,
               c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active'
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT ? OFFSET ?
      `);
      return stmt.all(limit, offset);
    } catch (error) {
      console.error('Error in getActive:', error.message);
      return [];
    }
  }

  // Count active products
  static countActive() {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as total FROM products WHERE status = "active"');
      return stmt.get().total;
    } catch (error) {
      console.error('Error in countActive:', error.message);
      return 0;
    }
  }

  // Get a single product by slug
  static getBySlug(slug) {
    try {
      const stmt = db.prepare(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ?
      `);
      return stmt.get(slug);
    } catch (error) {
      console.error('Error in getBySlug:', error.message);
      return null;
    }
  }

  // Get product by ID
  static getById(id) {
    try {
      const stmt = db.prepare(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `);
      return stmt.get(id);
    } catch (error) {
      console.error('Error in getById:', error.message);
      return null;
    }
  }

  // Create a new product
  static create(data) {
    const { 
      name, slug, description, price, compare_price, 
      cost_per_item, stock, stock_status, images, 
      category_id, tags, weight, dimensions, status, 
      is_featured, metadata 
    } = data;

    const stmt = db.prepare(`
      INSERT INTO products (
        name, slug, description, price, compare_price, 
        cost_per_item, stock, stock_status, images, 
        category_id, tags, weight, dimensions, status, 
        is_featured, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, slug, description || null, price, compare_price || null,
      cost_per_item || null, stock || 0, stock_status || 'in_stock',
      images ? JSON.stringify(images) : null,
      category_id || null, tags ? JSON.stringify(tags) : null,
      weight || null, dimensions ? JSON.stringify(dimensions) : null,
      status || 'draft',
      is_featured ? 1 : 0,
      metadata ? JSON.stringify(metadata) : null
    );

    return this.getById(result.lastInsertRowid);
  }

  // Update a product
  static update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'name', 'slug', 'description', 'price', 'compare_price', 
      'cost_per_item', 'stock', 'stock_status', 'images', 
      'category_id', 'tags', 'weight', 'dimensions', 'status', 
      'is_featured', 'metadata'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        if (['images', 'tags', 'dimensions', 'metadata'].includes(field) && typeof data[field] === 'object') {
          values.push(JSON.stringify(data[field]));
        } else if (field === 'is_featured') {
          values.push(data[field] ? 1 : 0);
        } else {
          values.push(data[field]);
        }
      }
    }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getById(id);
  }

  // Delete a product
  static delete(id) {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    return stmt.run(id);
  }

  // Get products by category
  static getByCategory(categorySlug, limit = 20, offset = 0) {
    try {
      const stmt = db.prepare(`
        SELECT p.id, p.name, p.slug, p.price, p.images, p.stock_status,
               c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active' AND c.slug = ?
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT ? OFFSET ?
      `);
      return stmt.all(categorySlug, limit, offset);
    } catch (error) {
      console.error('Error in getByCategory:', error.message);
      return [];
    }
  }

  // Update stock
  static updateStock(id, quantity) {
    const stmt = db.prepare(`
      UPDATE products 
      SET stock = stock + ?, 
          stock_status = CASE 
            WHEN stock + ? <= 0 THEN 'out_of_stock' 
            ELSE 'in_stock' 
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(quantity, quantity, id);
  }

  // Check if product is in stock
  static isInStock(id, quantity = 1) {
    const stmt = db.prepare('SELECT stock, stock_status FROM products WHERE id = ?');
    const product = stmt.get(id);
    if (!product) return false;
    return product.stock >= quantity && product.stock_status !== 'out_of_stock';
  }
}

module.exports = Product;
