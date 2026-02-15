const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const Reservation = require('../models/Reservation');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/reports/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
    try {
        // Get counts
        const totalUsers = await User.countDocuments();
        const totalHosts = await User.countDocuments({ role: 'host' });
        const totalTravelers = await User.countDocuments({ role: 'traveler' });
        const totalProperties = await Property.countDocuments();
        const approvedProperties = await Property.countDocuments({ isApproved: true });
        const pendingProperties = await Property.countDocuments({ isApproved: false });
        const totalReservations = await Reservation.countDocuments();

        // Get reservation stats by status
        const reservationStats = await Reservation.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$pricing.total' }
                }
            }
        ]);

        // Get monthly revenue (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyRevenue = await Reservation.aggregate([
            {
                $match: {
                    status: { $in: ['confirmed', 'completed'] },
                    createdAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$pricing.total' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Get top cities by properties
        const topCities = await Property.aggregate([
            { $match: { isApproved: true } },
            {
                $group: {
                    _id: '$address.city',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get property types distribution
        const propertyTypes = await Property.aggregate([
            { $match: { isApproved: true } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsers = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const recentReservations = await Reservation.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    hosts: totalHosts,
                    travelers: totalTravelers,
                    recentSignups: recentUsers
                },
                properties: {
                    total: totalProperties,
                    approved: approvedProperties,
                    pending: pendingProperties,
                    byType: propertyTypes,
                    topCities
                },
                reservations: {
                    total: totalReservations,
                    recent: recentReservations,
                    byStatus: reservationStats,
                    monthlyRevenue
                }
            }
        });
    } catch (error) {
        console.error('Dashboard report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/reports/host-stats
// @desc    Get host's property and reservation stats
// @access  Private/Host
router.get('/host-stats', protect, authorize('host', 'admin'), async (req, res) => {
    try {
        const hostId = req.user.id;

        // Get host's properties
        const properties = await Property.find({ host: hostId });
        const propertyIds = properties.map(p => p._id);

        // Property stats
        const totalProperties = properties.length;
        const approvedProperties = properties.filter(p => p.isApproved).length;
        const totalCapacity = properties.reduce((sum, p) => sum + p.capacity.guests, 0);

        // Reservation stats
        const reservations = await Reservation.find({ host: hostId });
        const totalReservations = reservations.length;
        
        const reservationsByStatus = await Reservation.aggregate([
            { $match: { host: hostId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Revenue calculation
        const completedReservations = reservations.filter(
            r => ['confirmed', 'completed'].includes(r.status)
        );
        const totalRevenue = completedReservations.reduce(
            (sum, r) => sum + r.pricing.total, 0
        );

        // Monthly revenue (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = await Reservation.aggregate([
            {
                $match: {
                    host: req.user._id,
                    status: { $in: ['confirmed', 'completed'] },
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$pricing.total' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Average rating
        const ratedProperties = properties.filter(p => p.rating.count > 0);
        const averageRating = ratedProperties.length > 0
            ? ratedProperties.reduce((sum, p) => sum + p.rating.average, 0) / ratedProperties.length
            : 0;

        res.json({
            success: true,
            data: {
                properties: {
                    total: totalProperties,
                    approved: approvedProperties,
                    pending: totalProperties - approvedProperties,
                    totalCapacity
                },
                reservations: {
                    total: totalReservations,
                    byStatus: reservationsByStatus
                },
                revenue: {
                    total: totalRevenue,
                    monthly: monthlyRevenue
                },
                rating: {
                    average: Math.round(averageRating * 10) / 10,
                    totalReviews: ratedProperties.reduce((sum, p) => sum + p.rating.count, 0)
                }
            }
        });
    } catch (error) {
        console.error('Host stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/reports/user-activity
// @desc    Get user activity report (Admin only)
// @access  Private/Admin
router.get('/user-activity', protect, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.$lte = new Date(endDate);
        }

        const matchStage = Object.keys(dateFilter).length > 0
            ? { createdAt: dateFilter }
            : {};

        // New users over time
        const newUsers = await User.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Active users (users with reservations)
        const activeUsers = await Reservation.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$guest',
                    reservationCount: { $sum: 1 }
                }
            },
            { $count: 'activeUsers' }
        ]);

        // Top bookers
        const topBookers = await Reservation.aggregate([
            { $match: { status: { $in: ['confirmed', 'completed'] } } },
            {
                $group: {
                    _id: '$guest',
                    totalBookings: { $sum: 1 },
                    totalSpent: { $sum: '$pricing.total' }
                }
            },
            { $sort: { totalBookings: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    name: '$user.name',
                    email: '$user.email',
                    totalBookings: 1,
                    totalSpent: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                newUsers,
                activeUsers: activeUsers[0]?.activeUsers || 0,
                topBookers
            }
        });
    } catch (error) {
        console.error('User activity report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/reports/revenue
// @desc    Get revenue report (Admin only)
// @access  Private/Admin
router.get('/revenue', protect, authorize('admin'), async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;

        let groupBy;
        if (period === 'daily') {
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
        } else if (period === 'weekly') {
            groupBy = {
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' }
            };
        } else {
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            };
        }

        const revenueData = await Reservation.aggregate([
            {
                $match: {
                    status: { $in: ['confirmed', 'completed'] }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    totalRevenue: { $sum: '$pricing.total' },
                    serviceFees: { $sum: '$pricing.serviceFee' },
                    taxes: { $sum: '$pricing.taxes' },
                    reservationCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Total summary
        const summary = await Reservation.aggregate([
            {
                $match: {
                    status: { $in: ['confirmed', 'completed'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricing.total' },
                    totalServiceFees: { $sum: '$pricing.serviceFee' },
                    totalTaxes: { $sum: '$pricing.taxes' },
                    totalReservations: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                period,
                details: revenueData,
                summary: summary[0] || {
                    totalRevenue: 0,
                    totalServiceFees: 0,
                    totalTaxes: 0,
                    totalReservations: 0
                }
            }
        });
    } catch (error) {
        console.error('Revenue report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
