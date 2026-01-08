# ShiftSync Email Integration

A complete email management system for ShiftSync that allows users to connect their Gmail, Outlook, or custom email accounts and view emails directly within the application.

## Features

- 🔗 **Multi-Account Support**: Connect multiple email accounts (Gmail, Outlook, custom)
- 📧 **Email Display**: View inbox with email list and full email viewer
- 🔍 **Search**: Search emails by sender, subject, or content
- 🔄 **Sync**: Manual sync to refresh emails
- 🏷️ **Read Status**: Track read/unread emails
- 📎 **Attachments**: Detect and display email attachments
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices

## Components

### EmailAccountConnection
Allows users to connect email accounts via OAuth or credentials.

```tsx
<EmailAccountConnection
  onAccountConnected={(account) => console.log(account)}
  onLoading={(loading) => console.log(loading)}
/>
```

### EmailAccountList
Display connected accounts with ability to switch between them and disconnect.

```tsx
<EmailAccountList
  accounts={accounts}
  selectedAccountId={selectedAccountId}
  onSelectAccount={handleSelect}
  onDisconnect={handleDisconnect}
/>
```

### EmailList
Shows inbox with email list. Supports search and sync.

```tsx
<EmailList
  emails={emails}
  selectedEmailId={selectedEmailId}
  onSelectEmail={handleSelect}
  isLoading={loading}
/>
```

### EmailViewer
Display full email content with sender information and attachments.

```tsx
<EmailViewer
  email={selectedEmail}
  isLoading={loading}
/>
```

## Services

### emailService

#### Methods

- `connectEmailAccount(provider, credentials)` - Connect new email account
- `getConnectedAccounts()` - Get list of connected accounts
- `disconnectAccount(accountId)` - Disconnect an account
- `getEmails(accountId, limit)` - Get emails from account
- `getEmail(accountId, emailId)` - Get single email details
- `markAsRead(accountId, emailId)` - Mark email as read
- `syncEmails(accountId)` - Sync emails from account
- `searchEmails(accountId, query)` - Search emails

## Backend API Endpoints

You need to implement these endpoints in your backend:

### Authentication
```
POST /api/emails/connect
Body: { provider: 'gmail|outlook|custom', credentials?: { email, password } }
Response: { id, email, provider, isConnected, lastSync }
```

### Account Management
```
GET /api/emails/accounts
Response: Array<{ id, email, provider, isConnected, lastSync }>

DELETE /api/emails/accounts/:accountId
Response: 204 No Content
```

### Email Operations
```
GET /api/emails/:accountId?limit=20
Response: Array<Email>

GET /api/emails/:accountId/:emailId
Response: Email

PATCH /api/emails/:accountId/:emailId
Body: { isRead: boolean }
Response: Email

POST /api/emails/:accountId/sync
Response: Array<Email>

GET /api/emails/:accountId/search?q=query
Response: Array<Email>
```

## Email Type

```typescript
interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;              // HTML content
  date: string;              // ISO string
  isRead: boolean;
  hasAttachments: boolean;
}
```

## Installation

The email components are already installed and configured. Make sure to:

1. Update the backend API endpoints in `services/emailService.ts`
2. Configure OAuth providers (Google, Microsoft) in your backend
3. Implement email fetching logic using libraries like:
   - `imap` for IMAP servers
   - `nodemailer` for SMTP integration
   - Google Gmail API
   - Microsoft Graph API

## Integration with Backend

### Example Node.js/Express Implementation

```typescript
// routes/email.routes.ts
import express from 'express';
import { emailController } from '../controllers/emailController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

// Account management
router.post('/connect', emailController.connectAccount);
router.get('/accounts', emailController.getAccounts);
router.delete('/accounts/:accountId', emailController.disconnectAccount);

// Email operations
router.get('/:accountId', emailController.getEmails);
router.get('/:accountId/:emailId', emailController.getEmail);
router.patch('/:accountId/:emailId', emailController.updateEmail);
router.post('/:accountId/sync', emailController.syncEmails);
router.get('/:accountId/search', emailController.searchEmails);

export default router;
```

## Styling

All components use CSS modules in their respective folders:
- `EmailAccountConnection.css`
- `EmailAccountList.css`
- `EmailList.css`
- `EmailViewer.css`
- `Email.css` (main page)

Colors and styling follow the ShiftSync design system with primary color `#4285F4`.

## Usage Example

```tsx
import { Email } from './pages';

export const App = () => {
  return (
    <div>
      <Email />
    </div>
  );
};
```

## Security Considerations

- Never store passwords in localStorage
- Use OAuth2 for Gmail/Outlook authentication
- Implement HTTPS for all email communications
- Validate and sanitize email content before display
- Use IMAP over TLS for custom email accounts
- Implement rate limiting for email fetch/sync operations

## Future Enhancements

- [ ] Email composition and sending
- [ ] Folder/label support
- [ ] Email filtering and rules
- [ ] Rich text email editing
- [ ] Email forwarding
- [ ] Attachment download/preview
- [ ] Email templates
- [ ] Calendar integration
- [ ] Spam detection
- [ ] Email encryption

## Troubleshooting

### "Failed to connect" error
- Check email credentials
- Verify OAuth app is properly configured
- Ensure IMAP is enabled for the email account

### Emails not syncing
- Check network connection
- Verify backend is running
- Check email account permissions

### Slow performance
- Limit email fetch to recent messages
- Implement pagination
- Use database caching

## Support

For issues or questions, please refer to the main ShiftSync documentation or contact the development team.
