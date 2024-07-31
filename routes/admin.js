const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const moment = require('moment');
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
  const month = today.getMonth() + 1; // Months are 0-indexed
  const year = today.getFullYear();

  try {
    // Fetch unpaid members for this month
    const unpaidMembers = await Member.find({
      'paymentHistory': {
        $not: {
          $elemMatch: {
            month: month,
            year: year,
            paid: true
          }
        }
      }
    });

    // Render the dashboard with unpaidMembers
    res.render('dashboard', { 
      today: today.toISOString().split('T')[0], 
      unpaidMembers 
    });
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

  try {
    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      // Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      await processMemberData(data, res, filePath);
    } else if (req.file.mimetype === 'text/csv') {
      // CSV file
      const results = [];

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          await processMemberData(results, res, filePath);
        });
    } else {
      return res.status(400).send('Invalid file type. Only CSV and Excel files are supported.');
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error processing file.');
  }
});

function excelSerialDateToJSDate(serial) {
  // Excel serial date starts from 1900-01-01
  const excelStartDate = new Date(Date.UTC(1899, 11, 30));
  return new Date(excelStartDate.getTime() + (serial * 86400000));
}

async function processMemberData(data, res, filePath) {
  try {
    for (const item of data) {
      try {
        // Log raw data for debugging
        console.log('Processing item:', item);

        // Extract 'Join Date' value
        let joinDateValue = item['Join Date\t'];

        // Check if joinDateValue is a number (Excel serial date)
        let joinDate;
        if (typeof joinDateValue === 'number') {
          joinDate = excelSerialDateToJSDate(joinDateValue);
        } else {
          // Parse joinDate using moment if it's a string
          joinDate = moment(joinDateValue, 'MM-DD-YYYY', true).toDate();
        }

        if (isNaN(joinDate.getTime())) {
          throw new Error(`Invalid joinDate format for entry: ${item['Join Date\t']}`);
        }

        // Convert Fees Paid to boolean
        const feesPaid = item['Fees Paid'] === 'Yes'; // Adjust as needed for your actual values

        await Member.create({
          name: item['Name'],
          joinDate: joinDate,
          feesPaid: feesPaid
        });

      } catch (dateError) {
        // Log error for specific date parsing issues
        console.error('Error processing date for item:', item);
        console.error('Date parsing error:', dateError.message);
        // Optionally, you could collect these errors and return them to the user
      }
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    res.redirect('/admin/dashboard');

  } catch (error) {
    console.error('Error in processMemberData:', error.message);
    res.status(500).send('Error processing file.');
  }
}

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

// Route to mark a member as completed

// Route to mark a member as paid
router.post('/mark-completed', async (req, res) => {
  const { memberId } = req.body;
  const today = new Date();
  const month = today.getMonth() + 1; // Months are 0-indexed
  const year = today.getFullYear();

  try {
    // Update member payment history
    await Member.updateOne(
      { _id: memberId },
      {
        $set: { feesPaid: true },
        $push: { paymentHistory: { month, year, paid: true } }
      }
    );

    // Send success response
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error marking member as completed.' });
  }
});



// Route to update member payment status
router.post('/update-payment-status', async (req, res) => {
  const { memberId, month, year, paid } = req.body;

  try {
    await Member.findByIdAndUpdate(memberId, {
      $set: {
        'paymentHistory.$[elem].paid': paid
      }
    }, {
      arrayFilters: [{ 'elem.month': month, 'elem.year': year }],
      new: true
    });
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating payment status.');
  }
});

// Route to mark a member as paid for the current month
router.post('/mark-paid', async (req, res) => {
  const { memberId } = req.body;
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  try {
    await Member.findById(memberId, async (err, member) => {
      if (err) {
        throw err;
      }

      const paymentRecord = member.paymentHistory.find(record => record.month === month && record.year === year);
      
      if (paymentRecord) {
        paymentRecord.paid = true;
      } else {
        member.paymentHistory.push({ month, year, paid: true });
      }

      await member.save();
      res.redirect('/admin/dashboard');
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error marking member as paid.');
  }
});

module.exports = router;
