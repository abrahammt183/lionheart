const express = require('express');
const router = express.Router();
const Outbox = require('../models/Outbox');
const { authenticate, requireAdmin } = require('../services/auth');

// ============================================
// POST /api/outbox - Add message to outbox
// ============================================
router.post('/', authenticate, (req, res) => {
  try {
    const { channel, event, payload, scheduled_for } = req.body;

    if (!channel || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Channel and payload are required'
      });
    }

    const validChannels = ['telegram', 'twitter', 'email', 'whatsapp'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`
      });
    }

    const item = Outbox.add(channel, event || 'custom', payload, scheduled_for || null);

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error adding to outbox:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to outbox'
    });
  }
});

// ============================================
// GET /api/outbox/pending - Get pending items
// ============================================
router.get('/pending', authenticate, requireAdmin, (req, res) => {
  try {
    const items = Outbox.getPending(parseInt(req.query.limit) || 10);
    const total = Outbox.countPending();

    res.json({
      success: true,
      data: items,
      count: items.length,
      total_pending: total
    });
  } catch (error) {
    console.error('Error fetching pending items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending items'
    });
  }
});

// ============================================
// GET /api/outbox - Get all outbox items (admin)
// ============================================
router.get('/', authenticate, requireAdmin, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const items = Outbox.getAll(limit, offset);
    const total = Outbox.countAll();

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching outbox items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch outbox items'
    });
  }
});

// ============================================
// DELETE /api/outbox/:id - Delete an outbox item (admin)
// ============================================
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = Outbox.getById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Outbox item not found'
      });
    }

    Outbox.delete(id);

    res.json({
      success: true,
      message: 'Outbox item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting outbox item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete outbox item'
    });
  }
});

// ============================================
// POST /api/outbox/retry - Retry failed items (admin)
// ============================================
router.post('/retry', authenticate, requireAdmin, (req, res) => {
  try {
    const result = Outbox.retryFailed();

    res.json({
      success: true,
      message: 'Failed items reset to pending',
      affected: result.changes || 0
    });
  } catch (error) {
    console.error('Error retrying failed items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry items'
    });
  }
});

// ============================================
// POST /api/outbox/clean - Clean old items (admin)
// ============================================
router.post('/clean', authenticate, requireAdmin, (req, res) => {
  try {
    const days = parseInt(req.body.days) || 30;
    const result = Outbox.cleanOld(days);

    res.json({
      success: true,
      message: `Cleaned items older than ${days} days`,
      deleted: result.changes || 0
    });
  } catch (error) {
    console.error('Error cleaning old items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean old items'
    });
  }
});

module.exports = router;
