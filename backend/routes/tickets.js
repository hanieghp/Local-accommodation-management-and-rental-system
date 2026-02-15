const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/tickets
// @desc    Get user's tickets (or all for admin)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        
        // Admin sees all tickets, users see only their own
        if (req.user.role !== 'admin') {
            query.user = req.user.id;
        }
        
        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }
        
        const tickets = await Ticket.find(query)
            .populate('user', 'name email avatar')
            .populate('messages.sender', 'name avatar')
            .sort({ updatedAt: -1 });
        
        res.json({
            success: true,
            data: tickets
        });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/tickets/:id
// @desc    Get single ticket
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('user', 'name email avatar')
            .populate('messages.sender', 'name avatar');
        
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        // Check authorization
        if (req.user.role !== 'admin' && ticket.user._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this ticket'
            });
        }
        
        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/tickets
// @desc    Create new ticket
// @access  Private
router.post('/', protect, [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('category').optional().isIn(['bug', 'feature', 'complaint', 'question', 'other']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        
        const { subject, message, category, priority } = req.body;
        
        const ticket = await Ticket.create({
            user: req.user.id,
            subject,
            category: category || 'other',
            priority: priority || 'medium',
            messages: [{
                sender: req.user.id,
                senderRole: 'user',
                message
            }]
        });
        
        // Populate user info
        await ticket.populate('user', 'name email avatar');
        
        res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/tickets/:id/reply
// @desc    Reply to ticket
// @access  Private
router.post('/:id/reply', protect, [
    body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        // Check authorization
        const isOwner = ticket.user.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to reply to this ticket'
            });
        }
        
        // Add reply
        ticket.messages.push({
            sender: req.user.id,
            senderRole: isAdmin ? 'admin' : 'user',
            message: req.body.message
        });
        
        // If admin replies, set status to in-progress
        if (isAdmin && ticket.status === 'open') {
            ticket.status = 'in-progress';
        }
        
        await ticket.save();
        
        // Populate and return
        await ticket.populate('user', 'name email avatar');
        await ticket.populate('messages.sender', 'name avatar');
        
        // Create notification for the other party
        if (isAdmin) {
            await Notification.create({
                recipient: ticket.user,
                sender: req.user._id,
                type: 'system_message',
                title: 'New Reply to Your Ticket',
                message: `Admin replied to your ticket: "${ticket.subject}"`
            });
        }
        
        res.json({
            success: true,
            message: 'Reply added successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Reply ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/tickets/:id/status
// @desc    Update ticket status (Admin only)
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), [
    body('status').isIn(['open', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        ).populate('user', 'name email avatar');
        
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        // Notify user
        await Notification.create({
            recipient: ticket.user._id,
            sender: req.user._id,
            type: 'system_message',
            title: 'Ticket Status Updated',
            message: `Your ticket "${ticket.subject}" status changed to: ${req.body.status}`
        });
        
        res.json({
            success: true,
            message: 'Ticket status updated',
            data: ticket
        });
    } catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/tickets/:id
// @desc    Delete ticket (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Ticket deleted'
        });
    } catch (error) {
        console.error('Delete ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
