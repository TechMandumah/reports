import nodemailer from 'nodemailer';
import * as fs from 'fs';
import { JobType } from '@/types/jobs';

// Email configuration using Exim4 local MTA
const EMAIL_CONFIG = {
  host: 'localhost', // Exim4 running locally
  port: 25,          // default SMTP port for local MTA
  secure: false,     // false for local MTA
  // No authentication needed for local Exim4
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'reports@mandumah.com';
const FROM_NAME = process.env.FROM_NAME || 'Mandumah Reports System';
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || 'noreply@mandumah.com';

// Create reusable transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Verify connection configuration
transporter.verify(function (error: any, success: any) {
  if (error) {
    console.log('❌ Exim4 connection error:', error);
  } else {
    console.log('✅ Exim4 server is ready to send messages');
  }
});

export async function sendJobCompletionEmail(
  userEmail: string,
  jobType: JobType,
  fileName: string,
  filePath: string | null,
  recordCount?: number,
  errorMessage?: string
): Promise<void> {
  try {
    const isSuccess = !errorMessage && filePath;
    const jobTypeLabel = getJobTypeLabel(jobType);
    
    const subject = isSuccess 
      ? `✅ ${jobTypeLabel} Export Completed`
      : `❌ ${jobTypeLabel} Export Failed`;
    
    const htmlContent = isSuccess 
      ? generateSuccessEmailHtml(jobTypeLabel, fileName, recordCount)
      : generateFailureEmailHtml(jobTypeLabel, errorMessage);
    
    const textContent = isSuccess
      ? generateSuccessEmailText(jobTypeLabel, fileName, recordCount)
      : generateFailureEmailText(jobTypeLabel, errorMessage);
    
    const mailOptions: any = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: 'saloom.dogorshom@gmail.com', // Testing email address
        // to: userEmail, --- IGNORE ---
      replyTo: REPLY_TO_EMAIL,
      subject: subject,
      text: textContent,
      html: htmlContent
    };
    
    // Attach file if successful
    if (isSuccess && filePath && fs.existsSync(filePath)) {
      console.log(`📎 Attaching file: ${fileName} (${filePath})`);
      mailOptions.attachments = [
        {
          filename: fileName,
          path: filePath,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ];
    }
    
    console.log(`📧 Sending ${isSuccess ? 'success' : 'failure'} email to: ${userEmail}`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

function getJobTypeLabel(jobType: JobType): string {
  switch (jobType) {
    case 'magazines_export':
      return 'Magazines Data';
    case 'conferences_export':
      return 'Conferences Data';
    case 'custom_report':
      return 'Custom Report';
    default:
      return 'Report';
  }
}

function generateSuccessEmailHtml(
  jobTypeLabel: string,
  fileName: string,
  recordCount?: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #C02025; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
            .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🎉 Export Completed Successfully!</h2>
            </div>
            <div class="content">
                <div class="success-icon">✅</div>
                
                <p>Good news! Your <strong>${jobTypeLabel}</strong> export has been completed successfully.</p>
                
                <div class="info-box">
                    <h3>Export Details:</h3>
                    <ul>
                        <li><strong>File Name:</strong> ${fileName}</li>
                        ${recordCount ? `<li><strong>Records Exported:</strong> ${recordCount.toLocaleString()}</li>` : ''}
                        <li><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</li>
                        <li><strong>Export Time:</strong> ${new Date().toLocaleTimeString()}</li>
                    </ul>
                </div>
                
                <p>📎 <strong>The Excel file is attached to this email.</strong></p>
                
                <p>You can open the file in Microsoft Excel or Google Sheets. The first column contains clickable hyperlinks that will take you directly to the corresponding records in the system.</p>
                
                <div class="info-box">
                    <h4>📋 What's Next?</h4>
                    <ul>
                        <li>Download and save the attached Excel file</li>
                        <li>Click on any ID in the first column to edit that record</li>
                        <li>Use Excel's filtering and sorting features to analyze your data</li>
                    </ul>
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <p>Best regards,<br>The Mandumah Reports Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message from the Mandumah Reports System.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateFailureEmailHtml(
  jobTypeLabel: string,
  errorMessage?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .error-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
            .error-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>❌ Export Failed</h2>
            </div>
            <div class="content">
                <div class="error-icon">⚠️</div>
                
                <p>We're sorry, but your <strong>${jobTypeLabel}</strong> export encountered an error and could not be completed.</p>
                
                ${errorMessage ? `
                <div class="error-box">
                    <h4>Error Details:</h4>
                    <p><code>${errorMessage}</code></p>
                </div>
                ` : ''}
                
                <h4>🔧 What you can do:</h4>
                <ul>
                    <li>Try running the export again in a few minutes</li>
                    <li>Check if you have proper permissions for this type of export</li>
                    <li>Contact our support team if the problem persists</li>
                </ul>
                
                <p>Our technical team has been notified of this issue and will investigate.</p>
                
                <p>We apologize for any inconvenience this may have caused.</p>
                
                <p>Best regards,<br>The Mandumah Reports Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message from the Mandumah Reports System.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateSuccessEmailText(
  jobTypeLabel: string,
  fileName: string,
  recordCount?: number
): string {
  return `
Export Completed Successfully!

Your ${jobTypeLabel} export has been completed successfully.

Export Details:
- File Name: ${fileName}
${recordCount ? `- Records Exported: ${recordCount.toLocaleString()}` : ''}
- Export Date: ${new Date().toLocaleDateString()}
- Export Time: ${new Date().toLocaleTimeString()}

The Excel file is attached to this email. You can open it in Microsoft Excel or Google Sheets. The first column contains clickable hyperlinks that will take you directly to the corresponding records in the system.

What's Next:
- Download and save the attached Excel file
- Click on any ID in the first column to edit that record
- Use Excel's filtering and sorting features to analyze your data

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Mandumah Reports Team

---
This is an automated message from the Mandumah Reports System.
  `;
}

function generateFailureEmailText(
  jobTypeLabel: string,
  errorMessage?: string
): string {
  return `
Export Failed

We're sorry, but your ${jobTypeLabel} export encountered an error and could not be completed.

${errorMessage ? `Error Details: ${errorMessage}` : ''}

What you can do:
- Try running the export again in a few minutes
- Check if you have proper permissions for this type of export
- Contact our support team if the problem persists

Our technical team has been notified of this issue and will investigate.

We apologize for any inconvenience this may have caused.

Best regards,
The Mandumah Reports Team

---
This is an automated message from the Mandumah Reports System.
  `;
}

// Test email function
export async function sendTestEmail(to: string): Promise<void> {
  await sendJobCompletionEmail(
    to,
    'magazines_export',
    'Test_Export.xlsx',
    null,
    undefined,
    'This is a test email to verify the email service is working correctly.'
  );
}