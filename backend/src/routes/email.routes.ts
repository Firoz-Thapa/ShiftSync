import express from 'express';
import axios from 'axios';
const router = express.Router();

router.get('/connect/:provider', (req, res) => {
  const p = req.params.provider;
  if (p === 'gmail') {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
    url.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI || '');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    return res.redirect(url.toString());
  }
  if (p === 'outlook') {
    const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    url.searchParams.set('client_id', process.env.OUTLOOK_CLIENT_ID || '');
    url.searchParams.set('redirect_uri', process.env.OUTLOOK_REDIRECT_URI || '');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid profile offline_access Mail.Read Mail.Send');
    return res.redirect(url.toString());
  }
  return res.status(400).json({ success: false, message: 'Unsupported provider' });
});

// OAuth callback handler
router.get('/callback/:provider', async (req, res) => {
  const { code, error } = req.query;
  const provider = req.params.provider;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/email?error=${error}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/email?error=no_code`);
  }

  try {
    let tokenData: any;

    if (provider === 'gmail') {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      });
      tokenData = response.data;
    } else if (provider === 'outlook') {
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: 'openid profile offline_access Mail.Read Mail.Send',
      });
      tokenData = response.data;
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}/email?error=unsupported_provider`);
    }

    // TODO: Store tokenData (access_token, refresh_token, expiry) in DB associated with user
    // For now, redirect to frontend with success
    return res.redirect(`${process.env.FRONTEND_URL}/email?success=true&provider=${provider}&token=${tokenData.access_token}`);
  } catch (err: any) {
    console.error(`OAuth callback error for ${provider}:`, err.message);
    return res.redirect(`${process.env.FRONTEND_URL}/email?error=token_exchange_failed`);
  }
});

export default router;