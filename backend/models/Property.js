const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Property title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    type: {
        type: String,
        enum: ['villa', 'apartment', 'suite', 'eco-lodge', 'cabin', 'hotel', 'house', 'cottage', 'room', 'eco'],
        required: [true, 'Property type is required']
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: String,
        country: {
            type: String,
            default: 'USA'
        },
        zipCode: String,
        fullAddress: String
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    price: {
        perNight: {
            type: Number,
            required: [true, 'Price per night is required'],
            min: [0, 'Price cannot be negative']
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    capacity: {
        guests: {
            type: Number,
            required: [true, 'Guest capacity is required'],
            min: [1, 'At least 1 guest required']
        },
        bedrooms: {
            type: Number,
            default: 1
        },
        beds: {
            type: Number,
            default: 1
        },
        bathrooms: {
            type: Number,
            default: 1
        }
    },
    amenities: [{
        type: String,
        enum: ['wifi', 'parking', 'pool', 'kitchen', 'ac', 'heating', 'tv', 'washer', 'dryer', 'balcony', 'garden', 'bbq', 'gym', 'hot-tub', 'fireplace', 'beach-access', 'mountain-view', 'pet-friendly']
    }],
    images: [{
        url: String,
        caption: String
    }],
    rules: {
        checkIn: {
            type: String,
            default: '15:00'
        },
        checkOut: {
            type: String,
            default: '11:00'
        },
        smokingAllowed: {
            type: Boolean,
            default: false
        },
        petsAllowed: {
            type: Boolean,
            default: false
        },
        partiesAllowed: {
            type: Boolean,
            default: false
        }
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isApproved: {
        type: Boolean,
        default: false
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

// Index for search and filtering
propertySchema.index({ 'address.city': 'text', title: 'text', description: 'text' }); //Property.find({ $text: { $search: "Dublin apartment" } })
propertySchema.index({ 'price.perNight': 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ 'capacity.guests': 1 });
propertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Property', propertySchema);
