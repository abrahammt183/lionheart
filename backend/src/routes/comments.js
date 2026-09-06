const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { authenticate, requireAdmin } = require('../services/auth');

// ============================================
// GET /api/comments/post/:postId
// Get comments for a specific post
// ============================================
router.get('/post/:postId', (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Check if post exists
    const post = Post.getById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const comments = Comment.getByPost(postId, limit, offset);
    const total = Comment.countByPost(postId);

    res.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

// ============================================
// GET /api/comments/:id/replies
// Get replies to a comment
// ============================================
router.get('/:id/replies', (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const comment = Comment.getById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const replies = Comment.getReplies(commentId, limit, offset);

    res.json({
      success: true,
      data: replies,
      pagination: { page, limit }
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch replies'
    });
  }
});

// ============================================
// POST /api/comments
// Create a new comment (requires auth)
// ============================================
router.post('/', authenticate, (req, res) => {
  try {
    const { post_id, content, parent_id } = req.body;

    if (!post_id || !content) {
      return res.status(400).json({
        success: false,
        error: 'Post ID and content are required'
      });
    }

    if (content.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be at least 3 characters'
      });
    }

    // Check if post exists
    const post = Post.getById(post_id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if parent comment exists (if provided)
    if (parent_id) {
      const parent = Comment.getById(parent_id);
      if (!parent) {
        return res.status(404).json({
          success: false,
          error: 'Parent comment not found'
        });
      }
    }

    const comment = Comment.create({
      post_id,
      user_id: req.user.id,
      content,
      parent_id: parent_id || null
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment submitted for approval'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

// ============================================
// PUT /api/comments/:id/status
// Update comment status (admin only)
// ============================================
router.put('/:id/status', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'spam', 'trash'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (pending, approved, spam, trash)'
      });
    }

    const comment = Comment.getById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const updated = Comment.updateStatus(id, status);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating comment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment status'
    });
  }
});

// ============================================
// DELETE /api/comments/:id
// Delete a comment (admin only)
// ============================================
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const comment = Comment.getById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    Comment.delete(id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

// ============================================
// GET /api/comments/pending
// Get pending comments for moderation (admin only)
// ============================================
router.get('/pending', authenticate, requireAdmin, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const comments = Comment.getPending(limit, offset);
    const total = Comment.countPending();

    res.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending comments'
    });
  }
});

module.exports = router;
