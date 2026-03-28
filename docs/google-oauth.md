# Google OAuth Configuration Guide

This guide explains how to configure Google OAuth 2.0 authentication for SmartDocs.

## Prerequisites

- A Google Cloud account
- Admin access to create OAuth 2.0 credentials
- Backend and frontend applications running (development or production)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make note of the **Project ID**

## Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (for production) or **Internal** (for testing within your organization)
3. Fill in the required information:
   - **App name**: SmartDocs (or your app name)
   - **User support email**: Your support email
   - **Developer contact email**: Your email
4. Add scopes (click "Add or remove scopes"):
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Save and continue through the wizard

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. Select **Web application** as application type
4. Configure the following:

### Development (Local)

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback/google
```

### Production

**Authorized redirect URIs:**
```
https://your-domain.com/auth/callback/google
```

5. Click **Create**
6. **Save the following credentials:**
   - **Client ID**: `GOOGLE_CLIENT_ID`
   - **Client Secret**: `GOOGLE_CLIENT_SECRET`

⚠️ **Important**: Store the Client Secret securely. Never commit it to version control.

## Step 4: Configure Backend Environment Variables

Add the following variables to your `.env` file in the backend:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
```

For production:
```bash
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback/google
```

### Verify Configuration

The backend will validate the configuration on startup and log warnings if:
- `GOOGLE_CLIENT_ID` is set but `GOOGLE_CLIENT_SECRET` is missing
- `GOOGLE_CLIENT_SECRET` is set but `GOOGLE_CLIENT_ID` is missing

## Step 5: Run Database Migration

The Google OAuth implementation requires database schema changes. Run the migration:

```bash
cd backend
alembic upgrade head
```

This adds the following columns to the `users` table:
- `google_id` (unique, nullable)
- `provider` (enum: 'manual', 'google')
- `avatar_url` (nullable)

## Step 6: Test the Integration

### Local Testing

1. Ensure your backend is running on port 8000:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Ensure your frontend is running on port 3000:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:3000/login`

4. Click "Continue with Google"

5. Sign in with your Google account

6. You should be redirected to the dashboard after successful authentication

### Production Testing

1. Update `GOOGLE_REDIRECT_URI` in production environment
2. Add the production redirect URI to your Google OAuth client ID configuration
3. Test the login flow from your production domain

## Features

### User Account Creation

- **New Users**: Google OAuth creates a new user account automatically
- **Existing Users**: If a user with the same email already exists, Google OAuth links the Google account to the existing account

### Account Linking

Users can link a Google account to an existing manual account, or vice versa. This allows:
- Signing in with either method after linking
- Seamless transition between authentication methods

### Unlinking Google Account

Users can unlink their Google account from settings (requires a password set):
1. Set a password for the account
2. Call `DELETE /api/v1/auth/google/unlink`
3. Account reverts to manual authentication

### User Profile

Google OAuth provides:
- Email address
- First name
- Last name
- Profile picture (avatar_url)

## Security Considerations

### Redirect URI Validation

Google only redirects to URIs you've explicitly authorized in the OAuth client configuration. This prevents:
- Open redirect attacks
- CSRF attacks

### State Parameter

The implementation uses a state parameter to prevent CSRF attacks:
- Random state token generated before redirect
- State validated on callback
- Request rejected if state doesn't match

### Token Storage

- JWT tokens are stored in localStorage and as HTTP-only cookies
- Tokens expire after 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Tokens include the `provider` claim to track authentication method

## Troubleshooting

### Error: "Google OAuth is not configured"

**Cause**: Missing or incomplete environment variables

**Solution**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
2. Restart the backend server
3. Check backend logs for configuration warnings

### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI doesn't match what's configured in Google Cloud Console

**Solution**:
1. Check the exact redirect URI in the error message
2. Add that URI to your Google OAuth client configuration
3. Ensure `GOOGLE_REDIRECT_URI` in `.env` matches exactly

### Error: "Failed to authenticate with Google"

**Cause**: Various issues (invalid credentials, network, etc.)

**Solution**:
1. Check backend logs for detailed error messages
2. Verify Google OAuth consent screen is configured correctly
3. Ensure required scopes are approved

### Users not being created

**Cause**: Database migration not run

**Solution**:
```bash
cd backend
alembic upgrade head
```

### Avatar not displaying

**Cause**: User profile picture not set

**Solution**:
- Check that `avatar_url` is populated in the database
- Ensure the frontend displays the avatar from the user object
- Google OAuth should provide the avatar_url automatically

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|-----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 Client ID | `123456789-abc...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | Yes | Redirect URI for OAuth callback | `http://localhost:3000/auth/callback/google` |

## API Endpoints

### Backend Endpoints

- `GET /api/v1/auth/google/login` - Get Google OAuth authorization URL
- `GET /api/v1/auth/google/callback` - Handle Google OAuth callback
- `DELETE /api/v1/auth/google/unlink` - Unlink Google account

### Frontend Routes

- `/auth/callback/google` - OAuth callback page (handles token exchange and redirect)

## Support

For issues or questions:
1. Check the [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
2. Review backend logs for detailed error messages
3. Verify environment variables are set correctly
4. Ensure database migration has been run
