const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticate, requireAdmin } = require('../services/auth');

// ============================================
// GET /api/products - Get all active products
// ============================================
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const products = Product.getActive(limit, offset);
    const total = Product.countActive();

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// ============================================
// GET /api/products/:slug - Get a single product
// ============================================
router.get('/:slug', (req, res) => {
  try {
    const product = Product.getBySlug(req.params.slug);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Don't show inactive products to regular users
    if (product.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// ============================================
// GET /api/products/category/:slug - Products by category
// ============================================
router.get('/category/:slug', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const products = Product.getByCategory(req.params.slug, limit, offset);

    res.json({
      success: true,
      data: products,
      pagination: { page, limit }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// ============================================
// POST /api/products - Create a new product (admin)
// ============================================
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, slug, price } = req.body;

    if (!name || !slug || !price) {
      return res.status(400).json({
        success: false,
        error: 'Name, slug, and price are required'
      });
    }

    const product = Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        success: false,
        error: 'A product with this slug already exists'
      });
    }
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

// ============================================
// PUT /api/products/:id - Update a product (admin)
// ============================================
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = Product.getById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const updated = Product.update(id, req.body);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        success: false,
        error: 'A product with this slug already exists'
      });
    }
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// ============================================
// DELETE /api/products/:id - Delete a product (admin)
// ============================================
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = Product.getById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    Product.delete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

// ============================================
// PATCH /api/products/:id/stock - Update stock (admin)
// ============================================
router.patch('/:id/stock', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Quantity is required'
      });
    }

    const product = Product.getById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    Product.updateStock(id, quantity);
    const updated = Product.getById(id);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock'
    });
  }
});

module.exports = router;
