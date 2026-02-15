const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// Helper to create notification
const createNotification = async (data) => {
    try {
        await Notification.create(data);
    } catch (error) {
        console.error('Notification creation error:', error);
    }
};

// @route   GET /api/reservations
// @desc    Get user's reservations (as guest)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const query = { guest: req.user.id };

        if (req.query.status) {
            query.status = req.query.status;
        }

        const reservations = await Reservation.find(query)
            .populate('property', 'title images address price')
            .populate('host', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reservations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/reservations/host
// @desc    Get host's received reservations
// @access  Private/Host
router.get('/host', protect, authorize('host', 'admin'), async (req, res) => {
    try {
        const query = { host: req.user.id };

        if (req.query.status) {
            query.status = req.query.status;
        }

        const reservations = await Reservation.find(query)
            .populate('property', 'title images address')
            .populate('guest', 'name email phone avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reservations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/reservations/:id
// @desc    Get single reservation
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('property')
            .populate('guest', 'name email phone avatar')
            .populate('host', 'name email phone avatar');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Check authorization
        const isGuest = reservation.guest._id.toString() === req.user.id;
        const isHost = reservation.host._id.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isGuest && !isHost && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this reservation'
            });
        }

        res.json({
            success: true,
            data: reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/reservations
// @desc    Create reservation
// @access  Private
router.post('/', protect, [
    body('property').notEmpty().withMessage('Property ID is required'),
    body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
    body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
    body('guests.adults').isInt({ min: 1 }).withMessage('At least 1 adult required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { property: propertyId, checkIn, checkOut, guests, specialRequests } = req.body;

        // Get property
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        if (!property.isAvailable || !property.isApproved) {
            return res.status(400).json({
                success: false,
                message: 'Property is not available'
            });
        }

        // Check capacity
        const totalGuests = guests.adults + (guests.children || 0);
        if (totalGuests > property.capacity.guests) {
            return res.status(400).json({
                success: false,
                message: `Property can only accommodate ${property.capacity.guests} guests`
            });
        }

        // Check for conflicting reservations
        const conflictingReservation = await Reservation.findOne({
            property: propertyId,
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
            ]
        });

        if (conflictingReservation) {
            return res.status(400).json({
                success: false,
                message: 'Property is not available for these dates'
            });
        }

        // Calculate pricing
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        
        if (nights < 1) {
            return res.status(400).json({
                success: false,
                message: 'Minimum stay is 1 night'
            });
        }

        const subtotal = property.price.perNight * nights;
        const serviceFee = Math.round(subtotal * 0.1); // 10% service fee
        const taxes = Math.round(subtotal * 0.08); // 8% tax
        const total = subtotal + serviceFee + taxes;

        const reservation = await Reservation.create({
            property: propertyId,
            guest: req.user.id,
            host: property.host,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests,
            pricing: {
                nightlyRate: property.price.perNight,
                nights,
                subtotal,
                serviceFee,
                taxes,
                total,
                currency: property.price.currency
            },
            specialRequests
        });

        // Notify host
        await createNotification({
            recipient: property.host,
            sender: req.user.id,
            type: 'reservation_request',
            title: 'New Reservation Request',
            message: `You have a new reservation request for ${property.title}`,
            relatedProperty: propertyId,
            relatedReservation: reservation._id
        });

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: reservation
        });
    } catch (error) {
        console.error('Reservation creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/reservations/:id/confirm
// @desc    Confirm reservation (Host only)
// @access  Private/Host
router.put('/:id/confirm', protect, authorize('host', 'admin'), async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('property', 'title');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Check if user is the host
        if (reservation.host.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (reservation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Reservation cannot be confirmed'
            });
        }

        reservation.status = 'confirmed';
        reservation.updatedAt = Date.now();
        await reservation.save();

        // Notify guest
        await createNotification({
            recipient: reservation.guest,
            sender: req.user.id,
            type: 'reservation_confirmed',
            title: 'Reservation Confirmed',
            message: `Your reservation for ${reservation.property.title} has been confirmed!`,
            relatedProperty: reservation.property._id,
            relatedReservation: reservation._id
        });

        res.json({
            success: true,
            message: 'Reservation confirmed',
            data: reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/reservations/:id/cancel
// @desc    Cancel reservation
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('property', 'title');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Check authorization
        const isGuest = reservation.guest.toString() === req.user.id;
        const isHost = reservation.host.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isGuest && !isHost && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (!['pending', 'confirmed'].includes(reservation.status)) {
            return res.status(400).json({
                success: false,
                message: 'Reservation cannot be cancelled'
            });
        }

        reservation.status = 'cancelled';
        reservation.cancellation = {
            cancelledBy: req.user.id,
            reason: req.body.reason || 'No reason provided',
            cancelledAt: Date.now(),
            refundAmount: reservation.pricing.total // Full refund for now
        };
        reservation.updatedAt = Date.now();
        await reservation.save();

        // Notify the other party
        const notifyUser = isGuest ? reservation.host : reservation.guest;
        await createNotification({
            recipient: notifyUser,
            sender: req.user.id,
            type: 'reservation_cancelled',
            title: 'Reservation Cancelled',
            message: `Reservation for ${reservation.property.title} has been cancelled`,
            relatedProperty: reservation.property._id,
            relatedReservation: reservation._id
        });

        res.json({
            success: true,
            message: 'Reservation cancelled',
            data: reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/reservations/:id/review
// @desc    Add review to completed reservation
// @access  Private
router.put('/:id/review', protect, [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 500 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.guest.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the guest can leave a review'
            });
        }

        if (reservation.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only review completed reservations'
            });
        }

        if (reservation.review && reservation.review.rating) {
            return res.status(400).json({
                success: false,
                message: 'Review already exists'
            });
        }

        reservation.review = {
            rating: req.body.rating,
            comment: req.body.comment,
            createdAt: Date.now()
        };
        await reservation.save();

        // Update property rating
        const property = await Property.findById(reservation.property);
        const allReviews = await Reservation.find({
            property: reservation.property,
            'review.rating': { $exists: true }
        });

        const totalRating = allReviews.reduce((sum, r) => sum + r.review.rating, 0);
        property.rating.average = Math.round((totalRating / allReviews.length) * 10) / 10;
        property.rating.count = allReviews.length;
        await property.save();

        res.json({
            success: true,
            message: 'Review added successfully',
            data: reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/reservations/admin/all
// @desc    Get all reservations (Admin only)
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status) {
            query.status = req.query.status;
        }

        const reservations = await Reservation.find(query)
            .populate('property', 'title address')
            .populate('guest', 'name email')
            .populate('host', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Reservation.countDocuments(query);

        res.json({
            success: true,
            data: reservations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
