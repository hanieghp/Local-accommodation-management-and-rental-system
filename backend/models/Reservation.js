const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    checkIn: {
        type: Date,
        required: [true, 'Check-in date is required']
    },
    checkOut: {
        type: Date,
        required: [true, 'Check-out date is required']
    },
    guests: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    pricing: {
        perNight: {
            type: Number,
            required: true
        },
        nights: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        },
        serviceFee: {
            type: Number,
            default: 0
        },
        cleaningFee: {
            type: Number,
            default: 0
        },
        taxes: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    specialRequests: {
        type: String,
        maxlength: 500
    },
    review: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: Date
    },
    cancellation: {
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        cancelledAt: Date,
        refundAmount: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Validate check-out is after check-in
reservationSchema.pre('save', function(next) {
    if (this.checkOut <= this.checkIn) {
        next(new Error('Check-out date must be after check-in date'));
    }
    next();
});

// Index for queries
reservationSchema.index({ guest: 1, status: 1 });
reservationSchema.index({ host: 1, status: 1 });
reservationSchema.index({ property: 1, checkIn: 1, checkOut: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
