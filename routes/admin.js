const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const Member = require('../models/Member');

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Get registration form
router.get('/register', (req, res) => {
  res.render('register');
});

// Handle registration form submission
router.post('/register', async (req, res) => {
  const { name, joinDate, feesPaid } = req.body;
  const newMember = new Member({ name, joinDate, feesPaid });
  await newMember.save();
  res.redirect('/admin/dashboard');
});

// Dashboard
router.get('/dashboard', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const unpaidMembers = await Member.find({ feesPaid: false });
  res.render('dashboard', { today, unpaidMembers });
});

// Get upload form
router.get('/upload', (req, res) => {
  res.render('upload');
});

// Handle file upload and process CSV/Excel
router.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;

  if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    // Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    await processMemberData(data);
  } else if (req.file.mimetype === 'text/csv') {
    // CSV file
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        await processMemberData(results);
      });
  } else {
    return res.status(400).send('Invalid file type. Only CSV and Excel files are supported.');
  }
});

async function processMemberData(data) {
  try {
    for (const item of data) {
      await Member.create({
        name: item.name,
        joinDate: new Date(item.joinDate),
        feesPaid: item.feesPaid === 'true'
      });
    }
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing file.');
  }
}

module.exports = router;
