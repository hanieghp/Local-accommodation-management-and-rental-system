const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: [
            'reservation_request',
            'reservation_confirmed',
            'reservation_cancelled',
            'reservation_completed',
            'new_review',
            'property_approved',
            'property_rejected',
            'payment_received',
            'payment_refunded',
            'system_message'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    relatedProperty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    },
    relatedReservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
