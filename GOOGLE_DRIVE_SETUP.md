# Google Drive Integration Setup Guide

## Overview
This guide explains how to complete the Google Drive integration for QuizForge, allowing users to access their Google Drive files directly from the application.

## 🎯 Current Status
- ✅ UI interface completed
- ✅ Frontend framework ready
- ✅ Google Drive service module created
- ⚠️ Requires Google Cloud Console setup
- ⚠️ Needs environment variables configuration

## 📋 Prerequisites
1. Google Cloud Console account
2. QuizForge application domain (for OAuth)
3. Basic understanding of OAuth2 flow

## 🔧 Setup Instructions

### Step 1: Google Cloud Console Setup

1. **Create/Select Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Note your project ID

2. **Enable Google Drive API**
   ```bash
   # Navigate to: APIs & Services > Library
   # Search for "Google Drive API"
   # Click "Enable"
   ```

3. **Create Credentials**
   - Go to: APIs & Services > Credentials
   - Click "+ CREATE CREDENTIALS"
   - Select "API Key" for general API access
   - Select "OAuth 2.0 Client ID" for user authentication

4. **Configure OAuth Consent Screen**
   - Go to: APIs & Services > OAuth consent screen
   - Choose "External" user type
   - Fill in application information:
     - App name: "QuizForge"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes: `../auth/drive.readonly`

5. **Configure OAuth 2.0 Client**
   - Application type: "Web application"
   - Authorized JavaScript origins:
     ```
     http://localhost:3002
     https://your-domain.com
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3002/auth/google/callback
     https://your-domain.com/auth/google/callback
     ```

### Step 2: Environment Configuration

1. **Create Environment File**
   ```bash
   # In quizforge/frontend/ directory
   cp .env.example .env.local
   ```

2. **Add Google Drive Credentials**
   ```env
   # .env.local
   NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=your_oauth_client_id_here
   NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your_api_key_here
   ```

### Step 3: Install Required Dependencies

```bash
# In quizforge/frontend/ directory
npm install googleapis
npm install @types/gapi
```

### Step 4: Update Component Integration

The Google Drive functionality is already integrated in the UI. Once you complete the setup above, update the component to use real authentication:

```typescript
// In QuizForgeApp.tsx, replace the alert with:
const handleGoogleSignIn = async () => {
  try {
    setLoading(true)
    const success = await googleDriveService.authenticate()
    if (success) {
      // Load user's files
      const files = await googleDriveService.listFiles()
      setGoogleDriveFiles(files)
    }
  } catch (error) {
    setError('Failed to authenticate with Google Drive')
  } finally {
    setLoading(false)
  }
}
```

## 🔒 Security Considerations

1. **API Key Restrictions**
   - Restrict API key to specific APIs (Google Drive API)
   - Add HTTP referrer restrictions
   - Monitor usage in Cloud Console

2. **OAuth Scope Limitations**
   - Use minimal scope: `drive.readonly`
   - Don't request write permissions unless needed

3. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use different credentials for development/production

## 🎛️ Feature Implementation

### Current Features (Ready)
- ✅ Google OAuth2 authentication flow
- ✅ File listing from Google Drive
- ✅ File type filtering (PDF, DOCX)
- ✅ File download functionality
- ✅ Integration with existing PDF processing pipeline

### Additional Features (Future)
- 📁 Folder navigation
- 🔍 File search functionality
- 📱 Mobile OAuth handling
- 💾 Token refresh automation
- 📊 Usage analytics

## 🚀 Testing the Integration

1. **Local Testing**
   ```bash
   npm run dev
   # Navigate to http://localhost:3002
   # Go to Google Drive tab
   # Click "Sign in with Google"
   ```

2. **Verify Functionality**
   - Check authentication flow
   - Verify file listing
   - Test file selection and processing
   - Ensure flashcard generation works

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid client" Error**
   - Check OAuth client ID in environment
   - Verify authorized domains in Google Console

2. **"Access denied" Error**
   - Check OAuth consent screen configuration
   - Verify scope permissions

3. **"API key invalid" Error**
   - Ensure API key is unrestricted or properly configured
   - Check API is enabled in Google Console

4. **CORS Issues**
   - Add your domain to authorized origins
   - Check browser developer console for specific errors

### Debug Mode
Enable debug logging by adding:
```typescript
// In googleDrive.ts
private debug = process.env.NODE_ENV === 'development'
```

## 📚 Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Google OAuth2 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🤝 Contributing

When the Google Drive integration is complete, users will be able to:
1. Authenticate with their Google account
2. Browse their Google Drive files
3. Select PDF/DOCX files directly from Drive
4. Generate summaries, quizzes, and flashcards from Drive files
5. Maintain session across browser refreshes

The integration provides a seamless workflow without requiring users to download and re-upload their documents. 