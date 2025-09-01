# Mandumah Reports Authentication Users

## Static User Credentials

The following are the authorized users for the Mandumah Magazine Reports system:

### User 1
- **Email:** report_user@mandumah.com
- **Password:** Md#2025$Rep1!

### User 2
- **Email:** report_user2@mandumah.com
- **Password:** Md#2025$Rep2!

### User 3
- **Email:** report_user3@mandumah.com
- **Password:** Md#2025$Rep3!

### User 4
- **Email:** report_user4@mandumah.com
- **Password:** Md#2025$Rep4!

### User 5
- **Email:** report_user5@mandumah.com
- **Password:** Md#2025$Rep5!

## Password Security Features

- **Length:** 13 characters
- **Complexity:** Contains uppercase, lowercase, numbers, and special characters
- **Pattern:** Md#2025$Rep[N]! where [N] is the user number
- **Special Characters:** # $ !

## Security Features

### Rate Limiting
- **Failed Attempts:** Maximum 5 failed login attempts
- **Lockout Duration:** 15 minutes after 5 failed attempts
- **Attempt Counter:** Shows remaining attempts to users
- **Auto Reset:** Failed attempts reset after successful login

### Session Management
- **Session Duration:** 8 hours from login time
- **Auto Check:** Session validity checked every 5 minutes
- **Expiry Warning:** Users are alerted when session expires
- **Auto Logout:** Automatic logout on session expiry

### Data Protection
- **Client-Side Storage:** Authentication state stored in localStorage
- **Session Tracking:** Login time tracked for timeout calculation
- **Clean Logout:** All session data cleared on logout

## Security Notes

- These are static credentials stored in the application code
- For production use, consider implementing a proper user management system
- Passwords follow strong security guidelines
- Each user has a unique password
- Failed login attempts are tracked and limited
- Sessions automatically expire for security

## Usage Instructions

1. Distribute these credentials only to authorized personnel
2. Users should keep their credentials secure
3. Inform users about the 8-hour session timeout
4. Users will be automatically logged out after session expires
5. Account will be temporarily blocked after 5 failed attempts

---

**Important:** Keep this document secure and only share with authorized administrators.
