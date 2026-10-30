require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// Use your Atlas URI from .env, or fallback to local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solvit';

// ─── DEFINE SCHEMA (Simplified to match backend) ───
const complaintSchema = new mongoose.Schema({
    id: String,
    trackingId: String,
    title: String,
    description: String,
    category: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    status: String,
    createdAt: Date,
    slaDeadline: Date,
    isReviewed: Boolean,
    isEscalated: Boolean,
    userId: String,
    userName: String,
    media: String,
    timeline: Array,
    blockchain: Object
});

const Complaint = mongoose.model('Complaint', complaintSchema);

async function seedDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Read the JSON file
        const rawData = fs.readFileSync('./mock_data.json');
        const complaints = JSON.parse(rawData);

        // 2. Clear existing complaints (Optional: This keeps the demo clean)
        console.log('Clearing old complaints...');
        await Complaint.deleteMany({});

        // 3. Insert the new data
        console.log(`Inserting ${complaints.length} complaints...`);
        await Complaint.insertMany(complaints);

        console.log('🎉 Data inserted successfully! You can now check MongoDB Compass or your website.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
}

seedDatabase();