const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticate, requireAdmin } = require('../services/auth');

// ============================================
// POST /api/orders - Create a new order
// ============================================
router.post('/', authenticate, (req, res) => {
  try {
    const { items, shipping_address, billing_address, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order items are required'
      });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = Product.getById(item.product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product with ID ${item.product_id} not found`
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: `Product "${product.name}" is not available`
        });
      }

      if (!Product.isInStock(item.product_id, item.quantity)) {
        return res.status(400).json({
          success: false,
          error: `Not enough stock for "${product.name}"`
        });
      }

      validatedItems.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: product.price * item.quantity
      });

      subtotal += product.price * item.quantity;
    }

    // Calculate totals
    const tax = subtotal * 0.1; // 10% tax
    const shipping_cost = 0; // Free shipping for now
    const discount = 0;
    const total = subtotal + tax + shipping_cost - discount;

    // Create order
    const order = Order.create({
      user_id: req.user.id,
      items: validatedItems,
      subtotal,
      tax,
      shipping_cost,
      discount,
      total,
      currency: 'USD',
      shipping_address: shipping_address || null,
      billing_address: billing_address || null,
      notes: notes || null
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// ============================================
// GET /api/orders/me - Get current user's orders
// ============================================
router.get('/me', authenticate, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const orders = Order.getByUser(req.user.id, limit, offset);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// ============================================
// GET /api/orders/:id - Get order by ID (user or admin)
// ============================================
router.get('/:id', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = Order.getById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user is authorized (admin or order owner)
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// ============================================
// GET /api/orders (admin only) - Get all orders
// ============================================
router.get('/', authenticate, requireAdmin, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const orders = Order.getAll(limit, offset);
    const total = Order.countAll();

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// ============================================
// PUT /api/orders/:id/status (admin only) - Update order status
// ============================================
router.put('/:id/status', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const order = Order.getById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const updated = Order.updateStatus(id, status);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order status'
    });
  }
});

// ============================================
// POST /api/orders/:id/cancel - Cancel order
// ============================================
router.post('/:id/cancel', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = Order.getById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user is authorized (admin or order owner)
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'This order cannot be cancelled'
      });
    }

    const cancelled = Order.cancel(id);

    res.json({
      success: true,
      data: cancelled,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

module.exports = router;
