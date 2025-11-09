# Exim4 Email Configuration for Mandumah Reports

## Overview
The Mandumah Reports system now uses **Exim4** (local MTA) instead of external SMTP servers for sending background job completion emails with Excel file attachments.

## Configuration

### Email Service Setup
- **Host**: `localhost`
- **Port**: `25` (default SMTP port for local MTA)
- **Secure**: `false` (no TLS/SSL needed for localhost)
- **Authentication**: Not required (local MTA)

### Environment Variables
Update your `.env.production` file with:

```bash
# Email Configuration (Using Exim4 Local MTA)
FROM_EMAIL=reports@mandumah.com
FROM_NAME=Mandumah Reports System
REPLY_TO_EMAIL=noreply@mandumah.com
```

**Note**: No SMTP credentials needed since Exim4 runs locally.

## Email Features

### Successful Export Email
- ✅ Subject: `✅ [Report Type] Export Completed`
- 📎 **Attachment**: Excel file with exported data
- 📊 Record count included in email body
- 🎨 Professional HTML template with Mandumah branding

### Failed Export Email
- ❌ Subject: `❌ [Report Type] Export Failed`
- 💬 Error details included
- 🔄 Instructions for retry

### Email Structure
```javascript
{
  from: '"Mandumah Reports System" <reports@mandumah.com>',
  to: 'user@example.com',
  replyTo: 'noreply@mandumah.com',
  subject: '✅ Report Export Completed',
  html: '<HTML content with styling>',
  text: '<Plain text version>',
  attachments: [{
    filename: 'report-2025-11-09.xlsx',
    path: '/tmp/report-2025-11-09.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }]
}
```

## Testing Exim4 Configuration

### Test Script
Run the test script to verify Exim4 is working:

```bash
node test-exim4.js
```

Expected output:
```
🚀 Testing Exim4 email configuration...
✅ Email sent successfully!
📧 Message ID: <message-id@localhost>
📨 Response: 250 OK
```

### Manual Testing via Command Line
```bash
# Send a test email using sendmail (Exim4's interface)
echo "Test email from Exim4" | mail -s "Test Subject" your-email@example.com

# Check Exim4 mail queue
exim -bp

# View Exim4 logs
tail -f /var/log/exim4/mainlog
```

## Exim4 Server Requirements

### Installation (if not already installed)
```bash
# Install Exim4
sudo apt-get update
sudo apt-get install exim4

# Configure Exim4
sudo dpkg-reconfigure exim4-config
```

### Configuration Steps
1. Select: **internet site; mail is sent and received directly using SMTP**
2. System mail name: `mandumah.com`
3. IP addresses to listen on: `127.0.0.1; ::1`
4. Other destinations: `mandumah.com`
5. Relay domains: (leave empty)
6. Machines to relay for: (leave empty)
7. Keep DNS queries minimal: **No**
8. Delivery method: **mbox format in /var/mail/**
9. Split configuration: **No**

### Service Management
```bash
# Start Exim4
sudo systemctl start exim4

# Enable on boot
sudo systemctl enable exim4

# Check status
sudo systemctl status exim4

# Restart after config changes
sudo systemctl restart exim4
```

## Troubleshooting

### Email Not Sending
1. **Check Exim4 is running:**
   ```bash
   sudo systemctl status exim4
   ```

2. **Check port 25 is listening:**
   ```bash
   sudo netstat -tlnp | grep :25
   ```

3. **Check Exim4 logs:**
   ```bash
   sudo tail -f /var/log/exim4/mainlog
   ```

4. **Test with sendmail:**
   ```bash
   echo "Test" | sendmail -v your-email@example.com
   ```

### Attachment Not Received
1. **Check file exists at the time of sending:**
   - Log message: `📎 Attaching file: report.xlsx (/tmp/report.xlsx)`
   
2. **Check file permissions:**
   ```bash
   ls -la /tmp/*.xlsx
   ```

3. **Verify attachment in logs:**
   - EmailService logs show attachment details

### Email Goes to Spam
1. **Configure SPF record:**
   ```
   mandumah.com. IN TXT "v=spf1 mx ~all"
   ```

2. **Configure DKIM** (optional but recommended)
3. **Configure DMARC** (optional but recommended)

## Background Job Flow

1. **Job Submission** → User selects "Background Export"
2. **Job Queue** → Job added to queue with user email
3. **Job Processing** → Report generated in background
4. **File Creation** → Excel file saved to `/tmp/` (writable temp directory)
5. **Email Sending** → Exim4 sends email with attachment
6. **Automatic Cleanup** → Temporary file deleted immediately after email sent
7. **Scheduled Cleanup** → Old export files (>1 day) automatically cleaned from `/tmp/`

## Report Types Supporting Background Jobs

All report types now support background export:
- ✅ General Reports (Standard, Details, Categorized, etc.)
- ✅ Citation Title Translations
- ✅ Citation Author Translations  
- ✅ Estenad University Reports
- ✅ Custom Citation Reports
- ✅ Custom Estenad Reports

## Code Location

- **Email Service**: `src/lib/emailService.ts`
- **Job Processor**: `src/lib/jobProcessor.ts`
- **Job Queue**: `src/lib/jobQueue.ts`
- **API Endpoint**: `src/app/api/jobs/route.ts`
- **Test Script**: `test-exim4.js`

## Security Notes

1. **Local Only**: Exim4 listens only on `127.0.0.1` (localhost)
2. **No Authentication**: Not needed since it's local communication
3. **File Permissions**: Excel files are created with restricted permissions
4. **Temporary Files**: Should be cleaned up after sending (optional)

## File Storage

### Temporary Export Files
- **Location**: `/tmp/` directory (standard Linux temp directory)
- **Why /tmp**: Guaranteed to be writable, no permission issues
- **Automatic Cleanup**: Files deleted immediately after email sent
- **Scheduled Cleanup**: Old files (>1 day) cleaned up automatically
- **File Pattern**: `All_Magazines_Data_*.xlsx`, `All_Conferences_Data_*.xlsx`, `export_*.xlsx`

### Cleanup Strategy
1. **Immediate**: File deleted right after successful email delivery
2. **Scheduled**: `cleanupOldFiles()` function removes files older than 1 day
3. **Safe**: Only deletes files matching export patterns, not other /tmp files

### No Permission Issues
Unlike `/var/www/reports/public/exports/`, the `/tmp/` directory:
- ✅ Always writable by all processes
- ✅ No need to set folder permissions
- ✅ Standard location for temporary files on Linux
- ✅ Automatically cleaned by system on reboot (optional)

## Performance

- **Email Sending**: < 1 second (local delivery)
- **Attachment Size**: Supports large Excel files (no size limit by default)
- **Concurrent Jobs**: Limited to 2 concurrent background jobs by job queue
- **File Cleanup**: Automatic, no manual intervention needed

## Future Enhancements

- [ ] Add email delivery confirmation tracking
- [ ] Implement retry logic for failed emails
- [ ] Add email templates for different languages (Arabic/English)
- [ ] Configure automatic cleanup of sent attachments
- [ ] Add admin dashboard for email logs

## References

- Exim4 Documentation: https://www.exim.org/docs.html
- Nodemailer Documentation: https://nodemailer.com/
- SPF/DKIM Setup: https://www.digitalocean.com/community/tutorials/how-to-set-up-spf-and-dkim
