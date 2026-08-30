// ─── server.js ───
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───
app.use(cors());
app.use(express.json());

// ─── MONGODB CONNECTION ───
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solvit';

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB successfully!'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

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

// 2. Complaint Schema
const complaintSchema = new mongoose.Schema({
    id: String,
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
    assignedDepartment: String
});
const Complaint = mongoose.model('Complaint', complaintSchema);

// 3. Petition Schema
const petitionSchema = new mongoose.Schema({
    id: String,
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

// Health check
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

// ─── UPDATED LOGIN ROUTE (supports email OR mobile) ───
app.post('/api/users/login', async (req, res) => {
    try {
        const { identifier, password, role } = req.body;
        // Check if identifier matches either email or mobile
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

// ─── COMPLAINTS ───
app.get('/api/complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find();
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/complaints', async (req, res) => {
    try {
        const complaint = new Complaint(req.body);
        await complaint.save();
        res.json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/complaints/:id', async (req, res) => {
    try {
        const complaint = await Complaint.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        res.json({ success: true, complaint });
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
        const petition = new Petition(req.body);
        await petition.save();
        res.json({ success: true, petition });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/petitions/:id', async (req, res) => {
    try {
        const petition = await Petition.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        res.json({ success: true, petition });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── LAND APPLICATIONS ───
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
        const app = new LandApplication(req.body);
        await app.save();
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/land/:id', async (req, res) => {
    try {
        const app = await LandApplication.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── RTI REQUESTS ───
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
        const rti = new RTIRequest(req.body);
        await rti.save();
        res.json({ success: true, rti });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/rti/:id', async (req, res) => {
    try {
        const rti = await RTIRequest.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
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
        const report = new HealthReport(req.body);
        await report.save();
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/health-reports/:id', async (req, res) => {
    try {
        const report = await HealthReport.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
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
        const report = new EducationReport(req.body);
        await report.save();
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/education-reports/:id', async (req, res) => {
    try {
        const report = await EducationReport.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
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
        const complaint = new SafetyComplaint(req.body);
        await complaint.save();
        res.json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/safety-complaints/:id', async (req, res) => {
    try {
        const complaint = await SafetyComplaint.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        res.json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── AGRICULTURE APPLICATIONS ───
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
        const app = new AgricultureApplication(req.body);
        await app.save();
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/agriculture/:id', async (req, res) => {
    try {
        const app = await AgricultureApplication.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── LOAN APPLICATIONS ───
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
        const app = new LoanApplication(req.body);
        await app.save();
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/loan/:id', async (req, res) => {
    try {
        const app = await LoanApplication.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        res.json({ success: true, app });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── CORRUPTION REPORTS ───
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
        const report = new CorruptionReport(req.body);
        await report.save();
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/corruption/:id', async (req, res) => {
    try {
        const report = await CorruptionReport.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── INFRASTRUCTURE REPORTS ───
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
        const report = new InfrastructureReport(req.body);
        await report.save();
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/infrastructure/:id', async (req, res) => {
    try {
        const report = await InfrastructureReport.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
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
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});