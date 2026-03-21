import nodemailer from 'nodemailer';
import config from './Index.js';

const transporter = nodemailer.createTransport({
  service: 'gmail', // ✅ IMPORTANT
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_APP_PASS,
  },
});

// debug
transporter.verify((err) => {
  if (err) {
    console.error('❌ Mail Error:', err);
  }
});

export default transporter;
