const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const Reservation = require('../models/Reservation');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

const createNotification = async (data) => {
    try {
        await Notification.create(data);
    } catch (error) {
        console.error('Notification creation error:', error);
    }
};

// @route   GET /api/reservations
// @desc    Get user's reservations (as guest) or all for admin
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'admin') {
            // No filter - see all
        } else {
            query = { guest: req.user.id };
        }

        if (req.query.status) { // /api/reservations?status=confirmed
            query.status = req.query.status;
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const reservations = await Reservation.find(query)
            .populate('property', 'title images address price')
            .populate('host', 'name avatar')
            .populate('guest', 'name email phone avatar')
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
        console.error('Reservations fetch error:', error);
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

        // Check auth
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
    body('guests').isInt({ min: 1 }).withMessage('At least 1 guest required')
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

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        if (!property.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Property is not available'
            });
        }

        // Check capacity
        const totalGuests = typeof guests === 'object' ? (guests.adults || 0) + (guests.children || 0) : parseInt(guests) || 1;
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

        const guestsData = typeof guests === 'object' ? guests : { adults: parseInt(guests) || 1, children: 0 };

        const reservation = await Reservation.create({
            property: propertyId,
            guest: req.user.id,
            host: property.host,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: totalGuests,
            pricing: {
                perNight: property.price.perNight,
                nights,
                subtotal,
                serviceFee,
                taxes,
                total,
                currency: property.price.currency || 'USD'
            },
            specialRequests
        });

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

// @route   PUT /api/reservations/:id/status
// @desc    Update reservation status (Admin only - can change to any status)
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, reason } = req.body;
        
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
            });
        }

        const reservation = await Reservation.findById(req.params.id)
            .populate('property', 'title')
            .populate('guest', 'name')
            .populate('host', 'name');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const oldStatus = reservation.status;
        reservation.status = status;
        reservation.updatedAt = Date.now();
        
        // If cancelling, add cancellation info
        if (status === 'cancelled') {
            reservation.cancellation = {
                cancelledBy: req.user.id,
                reason: reason || 'Cancelled by admin',
                cancelledAt: Date.now(),
                refundAmount: reservation.pricing?.total || 0
            };
        }
        
        await reservation.save();

        // Notify guest about status change
        await createNotification({
            recipient: reservation.guest._id,
            sender: req.user.id,
            type: 'reservation_updated',
            title: 'Reservation Status Updated',
            message: `Your reservation for ${reservation.property.title} status changed from ${oldStatus} to ${status}`,
            relatedProperty: reservation.property._id,
            relatedReservation: reservation._id
        });

        res.json({
            success: true,
            message: `Reservation status updated to ${status}`,
            data: reservation
        });
    } catch (error) {
        console.error('Update reservation status error:', error);
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

        // Check auth
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

// @route   GET /api/reservations/:id/receipt
// @desc    Generate PDF receipt for reservation
// @access  Private
router.get('/:id/receipt', protect, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('property', 'title address price images')
            .populate('guest', 'name email phone')
            .populate('host', 'name email phone');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Check auth
        const isGuest = reservation.guest && reservation.guest._id.toString() === req.user.id;
        const isHost = reservation.host && reservation.host._id.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isGuest && !isHost && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this receipt'
            });
        }

        // Create PDF
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            bufferPages: true
        });
        
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=receipt-${reservation._id}.pdf`);
            res.setHeader('Content-Length', pdfData.length);
            res.send(pdfData);
        });

        const guestName = reservation.guest?.name || 'Guest';
        const guestEmail = reservation.guest?.email || 'N/A';
        const guestPhone = reservation.guest?.phone || '';
        const propertyTitle = reservation.property?.title || 'Property';
        const hostName = reservation.host?.name || 'Host';
        const pricing = reservation.pricing || {};

        // Header
        doc.fontSize(28).font('Helvetica-Bold').fillColor('#18a999').text('StayLocal', { align: 'center' });
        doc.fontSize(14).font('Helvetica').fillColor('#666666').text('Reservation Receipt', { align: 'center' });
        doc.moveDown(1.5);

        // Line
        doc.strokeColor('#18a999').lineWidth(2);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // Reservation Info Box
        doc.fillColor('#000000');
        doc.fontSize(11).font('Helvetica-Bold').text('Reservation ID: ', { continued: true });
        doc.font('Helvetica').text(reservation._id.toString());
        
        doc.font('Helvetica-Bold').text('Booking Date: ', { continued: true });
        doc.font('Helvetica').text(new Date(reservation.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        }));
        
        doc.font('Helvetica-Bold').text('Status: ', { continued: true });
        const statusText = reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1);
        doc.fillColor(reservation.status === 'confirmed' ? '#10b981' : 
                      reservation.status === 'cancelled' ? '#ef4444' : '#f59e0b')
           .font('Helvetica-Bold').text(statusText);
        doc.fillColor('#000000');
        doc.moveDown(1.5);

        // Guest Information
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#18a999').text('Guest Information');
        doc.strokeColor('#e0e0e0').lineWidth(1);
        doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
        doc.moveDown(0.8);
        doc.fillColor('#000000');
        
        doc.fontSize(11).font('Helvetica-Bold').text('Name: ', { continued: true });
        doc.font('Helvetica').text(guestName);
        doc.font('Helvetica-Bold').text('Email: ', { continued: true });
        doc.font('Helvetica').text(guestEmail);
        if (guestPhone) {
            doc.font('Helvetica-Bold').text('Phone: ', { continued: true });
            doc.font('Helvetica').text(guestPhone);
        }
        doc.moveDown(1.5);

        // Property Information
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#18a999').text('Property Details');
        doc.strokeColor('#e0e0e0');
        doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
        doc.moveDown(0.8);
        doc.fillColor('#000000');
        
        doc.fontSize(11).font('Helvetica-Bold').text('Property: ', { continued: true });
        doc.font('Helvetica').text(propertyTitle);
        
        if (reservation.property?.address) {
            const addr = reservation.property.address;
            const addressParts = [addr.fullAddress, addr.city, addr.state, addr.country].filter(Boolean);
            if (addressParts.length > 0) {
                doc.font('Helvetica-Bold').text('Address: ', { continued: true });
                doc.font('Helvetica').text(addressParts.join(', '));
            }
        }
        
        doc.font('Helvetica-Bold').text('Host: ', { continued: true });
        doc.font('Helvetica').text(hostName);
        doc.moveDown(1.5);

        // Stay Details
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#18a999').text('Stay Details');
        doc.strokeColor('#e0e0e0');
        doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
        doc.moveDown(0.8);
        doc.fillColor('#000000');
        
        doc.fontSize(11).font('Helvetica-Bold').text('Check-in: ', { continued: true });
        doc.font('Helvetica').text(new Date(reservation.checkIn).toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }));
        
        doc.font('Helvetica-Bold').text('Check-out: ', { continued: true });
        doc.font('Helvetica').text(new Date(reservation.checkOut).toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }));
        
        doc.font('Helvetica-Bold').text('Guests: ', { continued: true });
        doc.font('Helvetica').text(String(reservation.guests || 1));
        
        doc.font('Helvetica-Bold').text('Nights: ', { continued: true });
        doc.font('Helvetica').text(String(pricing.nights || 1));
        doc.moveDown(1.5);

        // Payment Details
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#18a999').text('Payment Summary');
        doc.strokeColor('#e0e0e0');
        doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
        doc.moveDown(0.8);
        doc.fillColor('#000000');
        
        doc.fontSize(11).font('Helvetica-Bold').text('Price per Night: ', { continued: true });
        doc.font('Helvetica').text('$' + (pricing.perNight || 0));
        
        doc.font('Helvetica-Bold').text('Subtotal: ', { continued: true });
        doc.font('Helvetica').text('$' + (pricing.subtotal || 0));
        
        if (pricing.cleaningFee) {
            doc.font('Helvetica-Bold').text('Cleaning Fee: ', { continued: true });
            doc.font('Helvetica').text('$' + pricing.cleaningFee);
        }
        
        if (pricing.serviceFee) {
            doc.font('Helvetica-Bold').text('Service Fee: ', { continued: true });
            doc.font('Helvetica').text('$' + pricing.serviceFee);
        }
        
        doc.moveDown(0.5);
        doc.strokeColor('#18a999').lineWidth(2);
        doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
        doc.moveDown(0.5);
        
        doc.fontSize(16).font('Helvetica-Bold').text('Total: ', { continued: true });
        doc.fillColor('#18a999').text('$' + (pricing.total || 0));
        doc.moveDown(2);

        // Footer
        doc.fillColor('#999999').fontSize(10);
        doc.text('Thank you for choosing StayLocal!', { align: 'center' });
        doc.text('This is an electronically generated receipt.', { align: 'center' });
        doc.text('Generated on: ' + new Date().toLocaleString(), { align: 'center' });

        // Finalize
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error generating receipt: ' + error.message
            });
        }
    }
});

module.exports = router;
