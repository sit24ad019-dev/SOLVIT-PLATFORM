// ─── server.js ───
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───
app.use(cors());
app.use(express.json());

// ─── MONGODB CONNECTION ───
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solvit';

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB successfully!'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// ─── HELPER: Generate unique tracking ID ───
function generateTrackingId(prefix = 'TRK') {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// ─── HAVERSINE ALGORITHM ───
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (deg) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ─── BLOCKCHAIN UTILITIES ───
function generateHash(data) {
    const jsonString = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
}

function createBlock(complaint, previousHash = '0') {
    const blockData = {
        complaintId: complaint.id,
        trackingId: complaint.trackingId,
        title: complaint.title,
        category: complaint.category,
        status: complaint.status,
        userId: complaint.userId,
        timestamp: new Date().toISOString(),
        previousHash: previousHash
    };
    const hash = generateHash(blockData);
    return { ...blockData, hash };
}

function verifyBlock(block) {
    const { hash, ...blockData } = block;
    const recomputedHash = generateHash(blockData);
    return recomputedHash === hash;
}

// ─── SCHEMAS ───

// 1. User Schema
const userSchema = new mongoose.Schema({
    id: String,
    fullName: String,
    email: String,
    mobile: String,
    password: String,
    role: String,
    state: String,
    district: String,
    language: String,
    registeredAt: Date,
    complaints: [String],
    petitions: [String]
});
const User = mongoose.model('User', userSchema);

// 2. Complaint Schema (with Blockchain)
const complaintSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    title: String,
    description: String,
    category: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    media: String,
    timeline: Array,
    assignedOfficer: String,
    assignedDepartment: String,
    blockchain: {
        transactionId: String,
        previousHash: String,
        hash: String,
        blockNumber: Number
    },
    blockchainHistory: Array
});
const Complaint = mongoose.model('Complaint', complaintSchema);

// 3. Petition Schema
const petitionSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    title: String,
    description: String,
    category: String,
    district: String,
    state: String,
    location: String,
    latitude: String,
    longitude: String,
    proofImage: String,
    proofVideo: String,
    petitionLetter: String,
    currentSignatures: Number,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const Petition = mongoose.model('Petition', petitionSchema);

// 4. Land Application Schema
const landSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    surveyNumber: String,
    ownerName: String,
    propertyType: String,
    area: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    document: String,
    notes: String,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const LandApplication = mongoose.model('LandApplication', landSchema);

// 5. RTI Schema
const rtiSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    department: String,
    question: String,
    reason: String,
    period: String,
    format: String,
    district: String,
    document: String,
    notes: String,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const RTIRequest = mongoose.model('RTIRequest', rtiSchema);

// 6. Health Report Schema
const healthSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    type: String,
    description: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    photo: String,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const HealthReport = mongoose.model('HealthReport', healthSchema);

// 7. Education Report Schema
const educationSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    schoolName: String,
    issueType: String,
    description: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    photo: String,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const EducationReport = mongoose.model('EducationReport', educationSchema);

// 8. Safety Complaint Schema
const safetySchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    incidentType: String,
    description: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    photo: String,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const SafetyComplaint = mongoose.model('SafetyComplaint', safetySchema);

// 9. Agriculture Application Schema
const agricultureSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    farmerName: String,
    aadhaar: String,
    cropType: String,
    landArea: String,
    serviceType: String,
    description: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    photo: String,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const AgricultureApplication = mongoose.model('AgricultureApplication', agricultureSchema);

// 10. Loan Waiver Schema
const loanSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    aadhaar: String,
    farmerName: String,
    mobile: String,
    bankName: String,
    loanAmount: Number,
    loanDate: String,
    farmerCategory: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    landPatta: String,
    loanLetter: String,
    bankDetails: String,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const LoanApplication = mongoose.model('LoanApplication', loanSchema);

// 11. Corruption Report Schema
const corruptionSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    reportType: String,
    involvedParty: String,
    description: String,
    incidentDate: String,
    incidentTime: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    contactInfo: String,
    evidence: [String],
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const CorruptionReport = mongoose.model('CorruptionReport', corruptionSchema);

// 12. Infrastructure Report Schema
const infrastructureSchema = new mongoose.Schema({
    id: String,
    trackingId: { type: String, unique: true, sparse: true },
    type: String,
    subType: String,
    description: String,
    location: String,
    district: String,
    latitude: String,
    longitude: String,
    photo: String,
    status: String,
    createdAt: Date,
    userId: String,
    userName: String,
    timeline: Array
});
const InfrastructureReport = mongoose.model('InfrastructureReport', infrastructureSchema);

// ─── API ROUTES ───

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'SOLVIT API is running!' });
});

// ─── USERS ───
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { identifier, password, role } = req.body;
        const user = await User.findOne({
            $or: [{ email: identifier }, { mobile: identifier }],
            password,
            role
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── COMPLAINTS (with Haversine + Blockchain) ───
app.get('/api/complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find();
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Duplicate check (Haversine)
app.post('/api/complaints/check-duplicate', async (req, res) => {
    try {
        const { category, latitude, longitude } = req.body;
        if (!latitude || !longitude) {
            return res.json({ duplicates: [] });
        }
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const existing = await Complaint.find({
            category,
            createdAt: { $gte: since }
        });
        const nearby = [];
        for (const c of existing) {
            if (!c.latitude || !c.longitude) continue;
            const dist = haversineDistance(
                parseFloat(latitude), parseFloat(longitude),
                parseFloat(c.latitude), parseFloat(c.longitude)
            );
            if (dist <= 50) {
                nearby.push({
                    id: c.id,
                    title: c.title,
                    distance: Math.round(dist),
                    createdAt: c.createdAt,
                    status: c.status
                });
            }
        }
        nearby.sort((a, b) => a.distance - b.distance);
        res.json({ duplicates: nearby });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create complaint with blockchain
app.post('/api/complaints', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) {
            data.trackingId = generateTrackingId('TRK');
        }

        // Create blockchain block
        const blockNumber = await Complaint.countDocuments() + 1;
        const lastComplaint = await Complaint.findOne().sort({ 'blockchain.blockNumber': -1 });
        const previousHash = lastComplaint?.blockchain?.hash || '0';

        const block = createBlock(data, previousHash);
        block.blockNumber = blockNumber;

        data.blockchain = {
            transactionId: '0x' + block.hash.substring(0, 40),
            previousHash: previousHash,
            hash: block.hash,
            blockNumber: blockNumber
        };
        data.blockchainHistory = [block];

        const complaint = new Complaint(data);
        await complaint.save();
        res.json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update complaint with blockchain
app.put('/api/complaints/:id', async (req, res) => {
    try {
        const existing = await Complaint.findOne({ id: req.params.id });
        if (!existing) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        const updateData = req.body;

        if (updateData.status && updateData.status !== existing.status) {
            const history = existing.blockchainHistory || [];
            const previousHash = history.length > 0
                ? history[history.length - 1].hash
                : (existing.blockchain?.hash || '0');

            const block = createBlock(
                { ...existing.toObject(), ...updateData },
                previousHash
            );
            block.blockNumber = (existing.blockchain?.blockNumber || 0) + 1;
            block.statusChange = {
                from: existing.status,
                to: updateData.status
            };

            history.push(block);
            updateData.blockchainHistory = history;
            updateData.blockchain = {
                transactionId: '0x' + block.hash.substring(0, 40),
                previousHash: previousHash,
                hash: block.hash,
                blockNumber: block.blockNumber
            };
        }

        const complaint = await Complaint.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );
        res.json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify blockchain
app.get('/api/complaints/:id/verify', async (req, res) => {
    try {
        const complaint = await Complaint.findOne({ id: req.params.id });
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        const history = complaint.blockchainHistory || [];
        const results = history.map((block, i) => {
            const isValid = verifyBlock(block);
            const chainValid = i === 0 || block.previousHash === history[i - 1].hash;
            return {
                blockNumber: block.blockNumber,
                hash: block.hash,
                previousHash: block.previousHash,
                status: block.status,
                timestamp: block.timestamp,
                hashValid: isValid,
                chainValid: chainValid
            };
        });

        const allValid = results.every(r => r.hashValid && r.chainValid);

        res.json({
            complaintId: complaint.id,
            verified: allValid,
            totalBlocks: history.length,
            blocks: results
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PETITIONS ───
app.get('/api/petitions', async (req, res) => {
    try {
        const petitions = await Petition.find();
        res.json(petitions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/petitions', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('PET');
        const petition = new Petition(data);
        await petition.save();
        res.json({ success: true, petition });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/petitions/:id', async (req, res) => {
    try {
        const petition = await Petition.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, petition });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── LAND ───
app.get('/api/land', async (req, res) => {
    try {
        const apps = await LandApplication.find();
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/land', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('LND');
        const app = new LandApplication(data);
        await app.save();
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/land/:id', async (req, res) => {
    try {
        const app = await LandApplication.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── RTI ───
app.get('/api/rti', async (req, res) => {
    try {
        const rtis = await RTIRequest.find();
        res.json(rtis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/rti', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('RTI');
        const rti = new RTIRequest(data);
        await rti.save();
        res.json({ success: true, rti });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/rti/:id', async (req, res) => {
    try {
        const rti = await RTIRequest.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, rti });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── HEALTH REPORTS ───
app.get('/api/health-reports', async (req, res) => {
    try {
        const reports = await HealthReport.find();
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/health-reports', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('HLT');
        const report = new HealthReport(data);
        await report.save();
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/health-reports/:id', async (req, res) => {
    try {
        const report = await HealthReport.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── EDUCATION REPORTS ───
app.get('/api/education-reports', async (req, res) => {
    try {
        const reports = await EducationReport.find();
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/education-reports', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('EDU');
        const report = new EducationReport(data);
        await report.save();
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/education-reports/:id', async (req, res) => {
    try {
        const report = await EducationReport.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── SAFETY COMPLAINTS ───
app.get('/api/safety-complaints', async (req, res) => {
    try {
        const complaints = await SafetyComplaint.find();
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/safety-complaints', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('SAF');
        const complaint = new SafetyComplaint(data);
        await complaint.save();
        res.json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/safety-complaints/:id', async (req, res) => {
    try {
        const complaint = await SafetyComplaint.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── AGRICULTURE ───
app.get('/api/agriculture', async (req, res) => {
    try {
        const apps = await AgricultureApplication.find();
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/agriculture', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('AGR');
        const app = new AgricultureApplication(data);
        await app.save();
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/agriculture/:id', async (req, res) => {
    try {
        const app = await AgricultureApplication.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── LOAN ───
app.get('/api/loan', async (req, res) => {
    try {
        const apps = await LoanApplication.find();
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/loan', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('LNW');
        const app = new LoanApplication(data);
        await app.save();
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/loan/:id', async (req, res) => {
    try {
        const app = await LoanApplication.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── CORRUPTION ───
app.get('/api/corruption', async (req, res) => {
    try {
        const reports = await CorruptionReport.find();
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/corruption', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('COR');
        const report = new CorruptionReport(data);
        await report.save();
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/corruption/:id', async (req, res) => {
    try {
        const report = await CorruptionReport.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── INFRASTRUCTURE ───
app.get('/api/infrastructure', async (req, res) => {
    try {
        const reports = await InfrastructureReport.find();
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/infrastructure', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('INF');
        const report = new InfrastructureReport(data);
        await report.save();
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/infrastructure/:id', async (req, res) => {
    try {
        const report = await InfrastructureReport.findOneAndUpdate(
            { id: req.params.id }, req.body, { new: true }
        );
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── ROOT ───
app.get('/', (req, res) => {
    res.json({ message: '🌾 SOLVIT API is running!', version: '1.0.0' });
});

// ─── START SERVER ───
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});