// routes/email.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/faq-question", async (req, res) => {
  const { question, username } = req.body;

  if (!question || !username) {
    return res.status(400).json({ message: "Missing question or username" });
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlBody = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          .container {
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #6C0018;
            color: #ffffff;
            text-align: center;
            padding: 20px;
          }
          .header img {
            max-width: 160px;
            margin-bottom: 10px;
          }
          .content {
            padding: 30px;
            text-align: left;
            color: #000000;
          }
          .content h2 {
            color: #6C0018;
            font-size: 20px;
            margin-bottom: 10px;
          }
          .content p {
            margin: 10px 0;
            line-height: 1.6;
          }
          .question-box {
            background-color: #fef3c7;
            border-left: 5px solid #f59e0b;
            padding: 15px;
            margin-top: 15px;
            font-size: 16px;
          }
          .footer {
            background-color: #6C0018;
            color: #ffffff;
            font-size: 12px;
            padding: 15px;
            text-align: center;
          }
          .footer p:first-of-type {
            color: #F59701;
            font-weight: bold;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://newamericanuniversity.asu.edu/modules/composer/webspark-module-asu_footer/img/ASU-EndorsedLogo.png" alt="ASU Logo">
            <h1>MU/STPV Inventory Alerts</h1>
          </div>
          <div class="content">
            <h2>New FAQ Question Submitted</h2>
            <p><strong>User:</strong> ${username}</p>
            <div class="question-box">
              <strong>Question:</strong><br/>
              ${question}
            </div>
            <p>This question was submitted through the FAQ system on the Inventory Logger app.</p>
          </div>
          <div class="footer">
        <p style="color: #F59701; margin-bottom: 5px; font-weight: bold;">Memorial Union & Student Pavilion Inventory System <br>© Arizona State University</p>
        <p style="margin-top: 5px;">This email was generated and sent by an automated system and is not monitored. Kindly refrain from replying directly to this message.</p>
      </div>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: `"Inventory Logger" <${process.env.EMAIL_SENDER}>`,
    to: "vinny.24@asu.edu",
    subject: "New FAQ Question for Inventory Logging System",
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

module.exports = router;
