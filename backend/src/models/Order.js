const db = require('../config/database');
const Product = require('./Product');

class Order {
  // Generate a unique order number
  static generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LH-${timestamp}-${random}`;
  }

  // Create a new order
  static create(data) {
    const { 
      user_id, guest_email, items, subtotal, tax, 
      shipping_cost, discount, total, currency,
      shipping_address, billing_address, notes,
      payment_method, payment_id
    } = data;

    const orderNumber = this.generateOrderNumber();

    const stmt = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, guest_email, items, subtotal, 
        tax, shipping_cost, discount, total, currency,
        shipping_address, billing_address, notes,
        payment_method, payment_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      orderNumber,
      user_id || null,
      guest_email || null,
      JSON.stringify(items),
      subtotal,
      tax || 0,
      shipping_cost || 0,
      discount || 0,
      total,
      currency || 'USD',
      shipping_address ? JSON.stringify(shipping_address) : null,
      billing_address ? JSON.stringify(billing_address) : null,
      notes || null,
      payment_method || null,
      payment_id || null,
      'pending'
    );

    // Update stock for each item
    for (const item of items) {
      if (item.product_id) {
        Product.updateStock(item.product_id, -item.quantity);
      }
    }

    return this.getById(result.lastInsertRowid);
  }

  // Get order by ID
  static getById(id) {
    try {
      const stmt = db.prepare(`
        SELECT o.*, u.email as user_email, u.display_name as user_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `);
      const order = stmt.get(id);
      if (order) {
        order.items = JSON.parse(order.items);
        if (order.shipping_address) order.shipping_address = JSON.parse(order.shipping_address);
        if (order.billing_address) order.billing_address = JSON.parse(order.billing_address);
      }
      return order;
    } catch (error) {
      console.error('Error in getById:', error.message);
      return null;
    }
  }

  // Get order by order number
  static getByOrderNumber(orderNumber) {
    try {
      const stmt = db.prepare(`
        SELECT o.*, u.email as user_email, u.display_name as user_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.order_number = ?
      `);
      const order = stmt.get(orderNumber);
      if (order) {
        order.items = JSON.parse(order.items);
        if (order.shipping_address) order.shipping_address = JSON.parse(order.shipping_address);
        if (order.billing_address) order.billing_address = JSON.parse(order.billing_address);
      }
      return order;
    } catch (error) {
      console.error('Error in getByOrderNumber:', error.message);
      return null;
    }
  }

  // Get orders by user ID
  static getByUser(userId, limit = 20, offset = 0) {
    try {
      const stmt = db.prepare(`
        SELECT o.id, o.order_number, o.total, o.status, o.created_at,
               (SELECT COUNT(*) FROM orders WHERE user_id = ?) as total_count
        FROM orders o
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `);
      const orders = stmt.all(userId, userId, limit, offset);
      if (orders.length > 0) {
        orders[0].total_count = orders[0].total_count || 0;
      }
      return orders;
    } catch (error) {
      console.error('Error in getByUser:', error.message);
      return [];
    }
  }

  // Get all orders (admin)
  static getAll(limit = 20, offset = 0) {
    try {
      const stmt = db.prepare(`
        SELECT o.id, o.order_number, o.total, o.status, o.created_at,
               u.email as user_email, u.display_name as user_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `);
      return stmt.all(limit, offset);
    } catch (error) {
      console.error('Error in getAll:', error.message);
      return [];
    }
  }

  // Count all orders
  static countAll() {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as total FROM orders');
      return stmt.get().total;
    } catch (error) {
      console.error('Error in countAll:', error.message);
      return 0;
    }
  }

  // Update order status
  static updateStatus(id, status) {
    const validStatuses = ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const stmt = db.prepare(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
    return this.getById(id);
  }

  // Update payment information
  static updatePayment(id, paymentMethod, paymentId) {
    const stmt = db.prepare(`
      UPDATE orders 
      SET payment_method = ?, payment_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(paymentMethod, paymentId, id);
    return this.getById(id);
  }

  // Cancel order and restore stock
  static cancel(id) {
    const order = this.getById(id);
    if (!order) return null;

    // Restore stock
    for (const item of order.items) {
      if (item.product_id) {
        Product.updateStock(item.product_id, item.quantity);
      }
    }

    return this.updateStatus(id, 'cancelled');
  }
}

module.exports = Order;
