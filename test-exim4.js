const nodemailer = require('nodemailer');

// Test Exim4 configuration
let transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 25,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

let mailOptions = {
    from: 'reports@mandumah.com',
    to: 'saloom.dogorshom@gmail.com',
    subject: 'Test email via Exim4 - Mandumah Reports',
    text: 'This is a test email from Mandumah Big Data Export system using Exim4.',
    html: '<h2>Mandumah Reports Test</h2><p>This is a test email from Mandumah Big Data Export system using Exim4.</p>',
    replyTo: 'noreply@mandumah.com'
};

console.log('🚀 Testing Exim4 email configuration...');

transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
        console.error('❌ Email send failed:', err);
        process.exit(1);
    } else {
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📨 Response:', info.response);
        process.exit(0);
    }
});
