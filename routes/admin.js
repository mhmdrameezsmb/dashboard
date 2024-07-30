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

  // Convert feesPaid to boolean
  const feesPaidBoolean = feesPaid === 'on'; // Adjust based on form input

  const newMember = new Member({
    name,
    joinDate: new Date(joinDate),
    feesPaid: feesPaidBoolean
  });

  try {
    await newMember.save();
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving member.');
  }
});

// Dashboard
router.get('/dashboard', async (req, res) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
    try {
      // Find members who have not paid fees and have a joinDate within the current month
      const unpaidMembers = await Member.find({
        feesPaid: false,
        joinDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });
  
      res.render('dashboard', { today: today.toISOString().split('T')[0], unpaidMembers });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching dashboard data.');
    }
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

// Route to display all registered members
router.get('/members', async (req, res) => {
  try {
    const members = await Member.find(); // Fetch all members from the database
    res.render('members', { members });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching members.');
  }
});

// Route to update member details
router.post('/update-member', async (req, res) => {
  const { memberId, name, joinDate, feesPaid } = req.body;

  try {
    await Member.findByIdAndUpdate(memberId, {
      name,
      joinDate: new Date(joinDate),
      feesPaid: feesPaid === 'on'
    });
    res.redirect('/admin/members');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating member.');
  }
});

// Route to delete a member
router.post('/delete-member', async (req, res) => {
  const { memberId } = req.body;

  try {
    await Member.findByIdAndDelete(memberId);
    res.redirect('/admin/members');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting member.');
  }
});

async function processMemberData(data) {
  try {
    for (const item of data) {
      await Member.create({
        name: item.name,
        joinDate: new Date(item.joinDate), // Ensure joinDate is a Date object
        feesPaid: item.feesPaid === 'true' || item.feesPaid === true
      });
    }
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing file.');
  }
}
  
module.exports = router;
