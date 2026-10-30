// ─── server.js ───
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedRoles = new Set(['citizen', 'government']);

// ─── MIDDLEWARE ───
app.use(cors());
app.use(express.json());

// ─── MONGODB CONNECTION ───
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI must be configured before starting the API.');
const uriDatabaseName = MONGODB_URI.match(/^mongodb(?:\+srv)?:\/\/[^/?]+\/([^/?]+)/)?.[1];
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || uriDatabaseName || 'solvit';

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
    const hashInput = JSON.stringify(blockData);
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
    return { ...blockData, hash, hashInput };
}

function verifyBlock(block) {
    if (!block.hashInput || !block.hash) return false;
    const recomputedHash = crypto.createHash('sha256').update(block.hashInput).digest('hex');
    return recomputedHash === block.hash;
}

// ─── SCHEMAS ───

// 1. User Schema
const userSchema = new mongoose.Schema({
    id: String, fullName: String, email: String, mobile: String, password: String, role: String, state: String, district: String, language: String, registeredAt: Date, lastLoginAt: Date
});
const User = mongoose.model('User', userSchema);

function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, 64);
    return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password, storedPassword) {
    const [algorithm, saltHex, hashHex] = (storedPassword || '').split('$');
    if (algorithm !== 'scrypt' || !saltHex || !hashHex) {
        return storedPassword === password;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expectedHash = Buffer.from(hashHex, 'hex');
    const actualHash = crypto.scryptSync(password, salt, expectedHash.length);
    return actualHash.length === expectedHash.length && crypto.timingSafeEqual(actualHash, expectedHash);
}

function publicUser(user) {
    const result = user.toObject();
    delete result.password;
    return result;
}

// 2. Complaint Schema (WITH NEW SLA & ESCALATION FIELDS)
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
    blockchain: { transactionId: String, previousHash: String, hash: String, blockNumber: Number },
    blockchainHistory: Array,
    // NEW FIELDS:
    slaDeadline: Date,
    isReviewed: { type: Boolean, default: false },
    isEscalated: { type: Boolean, default: false },
    clusterGroup: String
});
const Complaint = mongoose.model('Complaint', complaintSchema);

// 3. Petition Schema
const petitionSchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, title: String, description: String, category: String, district: String, state: String, location: String, latitude: String, longitude: String, proofImage: String, proofVideo: String, petitionLetter: String, currentSignatures: Number, status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const Petition = mongoose.model('Petition', petitionSchema);

// 4. Land Application Schema
const landSchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, surveyNumber: String, ownerName: String, propertyType: String, area: String, location: String, district: String, latitude: String, longitude: String, document: String, notes: String, status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const LandApplication = mongoose.model('LandApplication', landSchema);

// 5. RTI Schema
const rtiSchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, department: String, question: String, reason: String, period: String, format: String, district: String, document: String, notes: String, status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const RTIRequest = mongoose.model('RTIRequest', rtiSchema);

// 6. Health Report Schema
const healthSchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, type: String, description: String, location: String, district: String, latitude: String, longitude: String, photo: String, status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const HealthReport = mongoose.model('HealthReport', healthSchema);

// 7. Education Report Schema
const educationSchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, schoolName: String, issueType: String, description: String, location: String, district: String, latitude: String, longitude: String, photo: String, status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const EducationReport = mongoose.model('EducationReport', educationSchema);

// 8. Safety Complaint Schema
const safetySchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, incidentType: String, description: String, location: String, district: String, latitude: String, longitude: String, photo: String, status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const SafetyComplaint = mongoose.model('SafetyComplaint', safetySchema);

// 9. Agriculture Application Schema
const agricultureSchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, farmerName: String, aadhaar: String, cropType: String, landArea: String, serviceType: String, description: String, location: String, district: String, latitude: String, longitude: String, photo: String, status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const AgricultureApplication = mongoose.model('AgricultureApplication', agricultureSchema);

// 10. Loan Waiver Schema
const loanSchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, aadhaar: String, farmerName: String, mobile: String, bankName: String, loanAmount: Number, loanDate: String, farmerCategory: String, location: String, district: String, latitude: String, longitude: String, landPatta: String, loanLetter: String, bankDetails: String, status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const LoanApplication = mongoose.model('LoanApplication', loanSchema);

// 11. Corruption Report Schema
const corruptionSchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, reportType: String, involvedParty: String, description: String, incidentDate: String, incidentTime: String, location: String, district: String, latitude: String, longitude: String, contactInfo: String, evidence: [String], status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const CorruptionReport = mongoose.model('CorruptionReport', corruptionSchema);

// 12. Infrastructure Report Schema
const infrastructureSchema = new mongoose.Schema({
    id: String, trackingId: { type: String, unique: true, sparse: true }, type: String, subType: String, description: String, location: String, district: String, latitude: String, longitude: String, photo: String, status: String, createdAt: Date, userId: String, userName: String, timeline: Array
});
const InfrastructureReport = mongoose.model('InfrastructureReport', infrastructureSchema);

// ─── API ROUTES ───

app.get('/api/health', (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
        status: connected ? 'OK' : 'ERROR',
        database: connected ? 'connected' : 'disconnected',
        databaseName: MONGODB_DB_NAME
    });
});

app.get('/api/users', async (req, res) => {
    try { res.json(await User.find().select('-password')); }
    catch (err) { console.error('Failed to fetch users:', err); res.status(500).json({ error: 'Unable to fetch users' }); }
});
app.post('/api/users/register', async (req, res) => {
    try {
        const { fullName, email, mobile, password, role, state, district, language } = req.body || {};
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedMobile = typeof mobile === 'string' ? mobile.trim() : '';
        if (typeof fullName !== 'string' || !fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !normalizedMobile || typeof password !== 'string' || password.length < 6 || !allowedRoles.has(role)) {
            return res.status(400).json({ error: 'Please provide valid registration details.' });
        }

        const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }] });
        if (existingUser) return res.status(409).json({ error: 'An account with that email or mobile number already exists.' });

        const user = await User.create({
            id: `USR-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            fullName: fullName.trim(),
            email: normalizedEmail,
            mobile: normalizedMobile,
            password: hashPassword(password),
            role,
            state,
            district: district || 'Not specified',
            language,
            registeredAt: new Date()
        });
        res.status(201).json({ success: true, user: publicUser(user) });
    } catch (err) {
        console.error('Failed to register user:', err);
        res.status(500).json({ error: 'Unable to register user. Please try again.' });
    }
});
app.post('/api/users/login', async (req, res) => {
    try {
        const { identifier, password, role } = req.body || {};
        if (typeof identifier !== 'string' || typeof password !== 'string' || !allowedRoles.has(role)) {
            return res.status(400).json({ error: 'Please provide valid login details.' });
        }
        const normalizedIdentifier = identifier.trim();
        const user = await User.findOne({
            $or: [{ email: normalizedIdentifier.toLowerCase() }, { mobile: normalizedIdentifier }],
            role
        });
        if (!user || !verifyPassword(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!user.password.startsWith('scrypt$')) {
            user.password = hashPassword(password);
        }
        user.lastLoginAt = new Date();
        await user.save();
        res.json({ success: true, user: publicUser(user) });
    } catch (err) {
        console.error('Failed to log in user:', err);
        res.status(500).json({ error: 'Unable to log in. Please try again.' });
    }
});

// ─── COMPLAINTS ───
app.get('/api/complaints', async (req, res) => {
    try { res.json(await Complaint.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/complaints/check-duplicate', async (req, res) => {
    try {
        const { category, latitude, longitude } = req.body;
        if (!latitude || !longitude) return res.json({ duplicates: [] });
        const since = new Date(); since.setDate(since.getDate() - 30);
        const existing = await Complaint.find({ category, createdAt: { $gte: since } });
        const nearby = [];
        for (const c of existing) {
            if (!c.latitude || !c.longitude) continue;
            const dist = haversineDistance(parseFloat(latitude), parseFloat(longitude), parseFloat(c.latitude), parseFloat(c.longitude));
            if (dist <= 50) nearby.push({ id: c.id, title: c.title, distance: Math.round(dist), createdAt: c.createdAt, status: c.status });
        }
        res.json({ duplicates: nearby.sort((a, b) => a.distance - b.distance) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/complaints', async (req, res) => {
    try {
        const data = req.body;
        if (!data.trackingId) data.trackingId = generateTrackingId('TRK');

        // Setup 24-Hour SLA
        const now = new Date();
        data.createdAt = now;
        data.slaDeadline = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // +24 hours
        data.isReviewed = false;
        data.isEscalated = false;

        // Blockchain block
        const blockNumber = await Complaint.countDocuments() + 1;
        const lastComplaint = await Complaint.findOne().sort({ 'blockchain.blockNumber': -1 });
        const previousHash = lastComplaint?.blockchain?.hash || '0';
        const block = createBlock(data, previousHash);
        block.blockNumber = blockNumber;
        data.blockchain = { transactionId: '0x' + block.hash.substring(0, 40), previousHash: previousHash, hash: block.hash, blockNumber: blockNumber };
        data.blockchainHistory = [block];

        const complaint = new Complaint(data);
        await complaint.save();
        res.json({ success: true, complaint });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mark as Reviewed (Stops 24h Timer)
app.put('/api/complaints/:id/review', async (req, res) => {
    try {
        const existing = await Complaint.findOne({ id: req.params.id });
        if (!existing) return res.status(404).json({ error: 'Complaint not found' });

        const timeline = existing.timeline || [];
        timeline.push({ status: 'Under Review', date: new Date().toISOString(), remark: 'Complaint reviewed by government. 24h SLA met.' });

        const complaint = await Complaint.findOneAndUpdate(
            { id: req.params.id },
            { isReviewed: true, status: 'Under Review', timeline: timeline },
            { new: true }
        );
        res.json({ success: true, complaint });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Escalate to CM Cell
app.put('/api/complaints/:id/escalate', async (req, res) => {
    try {
        const existing = await Complaint.findOne({ id: req.params.id });
        if (!existing) return res.status(404).json({ error: 'Complaint not found' });

        const timeline = existing.timeline || [];
        timeline.push({ status: 'Escalated to CM Cell', date: new Date().toISOString(), remark: 'Citizen escalated due to 24hr SLA breach.' });

        const complaint = await Complaint.findOneAndUpdate(
            { id: req.params.id },
            { isEscalated: true, status: 'Escalated to CM Cell', timeline: timeline },
            { new: true }
        );
        res.json({ success: true, complaint });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Standard Update (For Status Changes)
app.put('/api/complaints/:id', async (req, res) => {
    try {
        const existing = await Complaint.findOne({ id: req.params.id });
        if (!existing) return res.status(404).json({ error: 'Complaint not found' });

        const updateData = req.body;
        if (updateData.status && updateData.status !== existing.status) {
            const history = existing.blockchainHistory || [];
            const previousHash = history.length > 0 ? history[history.length - 1].hash : (existing.blockchain?.hash || '0');
            const block = createBlock({ ...existing.toObject(), ...updateData }, previousHash);
            block.blockNumber = (existing.blockchain?.blockNumber || 0) + 1;
            block.statusChange = { from: existing.status, to: updateData.status };
            
            history.push(block);
            updateData.blockchainHistory = history;
            updateData.blockchain = { transactionId: '0x' + block.hash.substring(0, 40), previousHash: previousHash, hash: block.hash, blockNumber: block.blockNumber };
        }

        const complaint = await Complaint.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });
        res.json({ success: true, complaint });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Verify Blockchain
app.get('/api/complaints/:id/verify', async (req, res) => {
    try {
        const complaint = await Complaint.findOne({ id: req.params.id });
        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

        const history = complaint.blockchainHistory || [];
        const results = history.map((block, i) => {
            const isValid = verifyBlock(block);
            const chainValid = i === 0 || block.previousHash === history[i - 1].hash;
            return { blockNumber: block.blockNumber, hashValid: isValid, chainValid: chainValid };
        });
        const allValid = results.every(r => r.hashValid && r.chainValid);
        res.json({ complaintId: complaint.id, verified: allValid, totalBlocks: history.length, blocks: results });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Text Clustering
// AI Text Clustering (Keyword-Based Department Mapping)
app.get('/api/complaints/clusters', async (req, res) => {
    try {
        const complaints = await Complaint.find();

        // Define the standard Indian Civic Departments and their related keywords
        const departmentRules = [
            {
                name: "🚰 Drainage & Sewage",
                keywords: ["drain", "sewage", "waterlog", "gutter", "overflow", "stagnant", "toilet", "manhole", "sanitation"]
            },
            {
                name: "🚧 Roads & Potholes",
                keywords: ["road", "pothole", "bridge", "tar", "highway", "street", "footpath", "pavement", "speed breaker", "accident"]
            },
            {
                name: "🗑️ Garbage & Waste",
                keywords: ["garbage", "trash", "waste", "dump", "bin", "dustbin", "cleaning", "sweep", "plastic", "litter"]
            },
            {
                name: "💧 Water Supply",
                keywords: ["water", "pipe", "leak", "supply", "tanker", "drinking", "tap", "borewell", "muddy", "pressure"]
            },
            {
                name: "⚡ Electricity & Power",
                keywords: ["electricity", "power", "outage", "transformer", "pole", "wire", "streetlight", "street light", "current", "shock", "voltage"]
            },
            {
                name: "🏥 Public Health",
                keywords: ["hospital", "disease", "doctor", "medicine", "mosquito", "health", "fever", "clinic", "ambulance", "dengue", "sanitizer"]
            },
            {
                name: "🚦 Traffic & Transport",
                keywords: ["traffic", "bus", "signal", "transport", "parking", "auto", "train", "vehicle", "congestion", "zebra crossing"]
            },
            {
                name: "🚓 Police & Public Safety",
                keywords: ["police", "theft", "safety", "crime", "security", "fir", "robbery", "harassment", "emergency", "sos"]
            },
            {
                name: "🏫 Education & Schools",
                keywords: ["school", "teacher", "book", "scholarship", "education", "student", "mid-day meal", "classroom", "exam"]
            },
            {
                name: "🌾 Agriculture & Farming",
                keywords: ["crop", "farmer", "subsidy", "insurance", "land", "tractor", "fertilizer", "harvest", "irrigation", "loan", "pest"]
            },
            {
                name: "🏛️ Corruption & RTI",
                keywords: ["bribe", "corrupt", "rti", "information", "officer", "money", "demand", "illegal", "fraud", "misuse"]
            }
        ];

        const clusters = {};

        // Analyze every complaint
        complaints.forEach(c => {
            const text = `${c.title || ''} ${c.description || ''} ${c.category || ''}`.toLowerCase();
            
            let matchedDepartment = null;

            // Try to find a matching department based on keywords
            for (const rule of departmentRules) {
                if (rule.keywords.some(keyword => text.includes(keyword))) {
                    matchedDepartment = rule.name;
                    break; // Stop searching once a match is found
                }
            }

            // If no keywords match, put it in "General / Others"
            if (!matchedDepartment) {
                matchedDepartment = "📋 General / Others";
            }

            // Initialize the cluster if it doesn't exist
            if (!clusters[matchedDepartment]) {
                clusters[matchedDepartment] = { 
                    clusterName: matchedDepartment, 
                    count: 0,
                    complaints: []
                };
            }

            // Add to cluster
            clusters[matchedDepartment].count++;
            clusters[matchedDepartment].complaints.push(c.title);
        });

        // Convert object to array, filter out empty clusters, and sort by highest count
        const sortedClusters = Object.values(clusters)
            .filter(c => c.count > 0)
            .sort((a, b) => b.count - a.count);

        res.json(sortedClusters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ─── VISUAL REPORT SUMMARY ───
app.get('/api/complaints/report/summary', async (req, res) => {
    try {
        const complaints = await Complaint.find();

        const summary = {
            total: complaints.length,
            resolved: 0,
            pending: 0,
            escalated: 0,
            byCategory: {},
            byDistrict: {},
            monthlyTrend: {}
        };

        complaints.forEach(c => {
            // Status Counts
            const status = (c.status || 'Submitted').toLowerCase();
            if (status.includes('resolve') || status.includes('complete') || status.includes('closed')) {
                summary.resolved++;
            } else if (c.isEscalated) {
                summary.escalated++;
            } else {
                summary.pending++;
            }

            // Category Counts (Where to fund?)
            const category = c.category || 'Others';
            summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;

            // District Counts (Where to allocate resources?)
            const district = c.district || 'Unknown';
            summary.byDistrict[district] = (summary.byDistrict[district] || 0) + 1;

            // Monthly Trend (Last 6 months)
            const date = new Date(c.createdAt);
            const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            summary.monthlyTrend[monthYear] = (summary.monthlyTrend[monthYear] || 0) + 1;
        });

        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Monthly Report CSV
app.get('/api/complaints/report/monthly', async (req, res) => {
    try {
        const complaints = await Complaint.find();
        let csv = 'ID,Title,Category,District,Status,Date\n';
        complaints.forEach(c => {
            const title = `"${(c.title || '').replace(/"/g, '""')}"`;
            csv += `"${c.id}",${title},"${c.category}","${c.district}","${c.status}","${new Date(c.createdAt).toLocaleDateString()}"\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.attachment('monthly_report.csv');
        return res.send(csv);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── OTHER SERVICES (PETITIONS, LAND, RTI, HEALTH, ETC) ───
// (Keep all your existing routes for petitions, land, rti, health, education, safety, agriculture, loan, corruption, infrastructure here unchanged)
const makeStandardRoutes = (Model, prefix, idPrefix) => {
    app.get(`/api/${prefix}`, async (req, res) => { try { res.json(await Model.find()); } catch (err) { res.status(500).json({ error: err.message }); } });
    app.post(`/api/${prefix}`, async (req, res) => {
        try {
            const data = req.body;
            if (!data.trackingId) data.trackingId = generateTrackingId(idPrefix);
            const item = new Model(data);
            await item.save();
            res.json({ success: true, item });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
    app.put(`/api/${prefix}/:id`, async (req, res) => {
        try {
            const item = await Model.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
            res.json({ success: true, item });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
};
makeStandardRoutes(Petition, 'petitions', 'PET');
makeStandardRoutes(LandApplication, 'land', 'LND');
makeStandardRoutes(RTIRequest, 'rti', 'RTI');
makeStandardRoutes(HealthReport, 'health-reports', 'HLT');
makeStandardRoutes(EducationReport, 'education-reports', 'EDU');
makeStandardRoutes(SafetyComplaint, 'safety-complaints', 'SAF');
makeStandardRoutes(AgricultureApplication, 'agriculture', 'AGR');
makeStandardRoutes(LoanApplication, 'loan', 'LNW');
makeStandardRoutes(CorruptionReport, 'corruption', 'COR');
makeStandardRoutes(InfrastructureReport, 'infrastructure', 'INF');

async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
        console.log(`✅ Connected to MongoDB database "${MONGODB_DB_NAME}"`);
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
}

startServer();