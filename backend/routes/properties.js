const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Property = require('../models/Property');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/properties
// @desc    Get all properties with search and filter
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Build query
        const query = { isAvailable: true, isApproved: true };

        // Search by text
        if (req.query.search) {
            query.$text = { $search: req.query.search };
        }

        // Filter by city
        if (req.query.city) {
            query['address.city'] = new RegExp(req.query.city, 'i');
        }

        // Filter by type
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filter by price range
        if (req.query.minPrice || req.query.maxPrice) {
            query['price.perNight'] = {};
            if (req.query.minPrice) {
                query['price.perNight'].$gte = parseInt(req.query.minPrice);
            }
            if (req.query.maxPrice) {
                query['price.perNight'].$lte = parseInt(req.query.maxPrice);
            }
        }

        // Filter by capacity
        if (req.query.guests) {
            query['capacity.guests'] = { $gte: parseInt(req.query.guests) };
        }

        // Filter by bedrooms
        if (req.query.bedrooms) {
            query['capacity.bedrooms'] = { $gte: parseInt(req.query.bedrooms) };
        }

        // Filter by amenities
        if (req.query.amenities) {
            const amenitiesArray = req.query.amenities.split(',');
            query.amenities = { $all: amenitiesArray };
        }

        // Sort options
        let sortOption = { createdAt: -1 };
        if (req.query.sort === 'price_asc') {
            sortOption = { 'price.perNight': 1 };
        } else if (req.query.sort === 'price_desc') {
            sortOption = { 'price.perNight': -1 };
        } else if (req.query.sort === 'rating') {
            sortOption = { 'rating.average': -1 };
        }

        const properties = await Property.find(query)
            .populate('host', 'name avatar')
            .skip(skip)
            .limit(limit)
            .sort(sortOption);

        const total = await Property.countDocuments(query);

        res.json({
            success: true,
            data: properties,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Properties fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/properties/:id
// @desc    Get single property
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('host', 'name avatar phone email createdAt');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        res.json({
            success: true,
            data: property
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/properties
// @desc    Create new property
// @access  Private/Host
router.post('/', protect, authorize('host', 'admin'), [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('type').isIn(['villa', 'apartment', 'suite', 'eco-lodge', 'cabin', 'hotel']).withMessage('Invalid property type'),
    body('address.city').notEmpty().withMessage('City is required'),
    body('price.perNight').isNumeric().withMessage('Price per night is required'),
    body('capacity.guests').isInt({ min: 1 }).withMessage('Guest capacity must be at least 1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const propertyData = {
            ...req.body,
            host: req.user.id,
            isApproved: req.user.role === 'admin' // Auto-approve for admin
        };

        const property = await Property.create(propertyData);

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: property
        });
    } catch (error) {
        console.error('Property creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private/Host (owner) or Admin
router.put('/:id', protect, authorize('host', 'admin'), async (req, res) => {
    try {
        let property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Check ownership (unless admin)
        if (property.host.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this property'
            });
        }

        req.body.updatedAt = Date.now();

        property = await Property.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Property updated successfully',
            data: property
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private/Host (owner) or Admin
router.delete('/:id', protect, authorize('host', 'admin'), async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Check ownership (unless admin)
        if (property.host.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this property'
            });
        }

        await property.deleteOne();

        res.json({
            success: true,
            message: 'Property deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/properties/host/my-properties
// @desc    Get host's own properties
// @access  Private/Host
router.get('/host/my-properties', protect, authorize('host', 'admin'), async (req, res) => {
    try {
        const properties = await Property.find({ host: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: properties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/properties/:id/approve
// @desc    Approve property (Admin only)
// @access  Private/Admin
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        );

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        res.json({
            success: true,
            message: 'Property approved',
            data: property
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/properties/admin/pending
// @desc    Get pending properties for approval (Admin only)
// @access  Private/Admin
router.get('/admin/pending', protect, authorize('admin'), async (req, res) => {
    try {
        const properties = await Property.find({ isApproved: false })
            .populate('host', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: properties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
