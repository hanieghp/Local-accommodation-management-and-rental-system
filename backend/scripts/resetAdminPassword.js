require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/staylocal')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    role: { type: String, enum: ['traveler', 'host', 'admin'], default: 'traveler' },
    avatar: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function resetAdminPassword() {
    try {
        // Find admin
        const admin = await User.findOne({ email: 'admin@staylocal.com' });
        
        if (!admin) {
            console.log('Admin not found! Creating new admin...');
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await User.create({
                name: 'Admin User',
                email: 'admin@staylocal.com',
                password: hashedPassword,
                phone: '+1234567890',
                role: 'admin',
                isActive: true
            });
            
            console.log('✅ Admin created!');
        } else {
            // Reset password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            admin.password = hashedPassword;
            admin.role = 'admin';
            admin.isActive = true;
            await admin.save();
            
            console.log('✅ Admin password reset successfully!');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email: admin@staylocal.com');
        console.log('Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAdminPassword();
