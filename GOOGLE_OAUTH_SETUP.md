# Google OAuth Setup Guide

## HTTP Origins (Authorized JavaScript Origins)

These are the domains where your web application is hosted. Used to verify requests come from your application.

### Rules
- ✅ **Must include protocol** (http:// or https://)
- ✅ **Must include port if not default** (e.g., :3000, :8080)
- ❌ **Cannot contain wildcards** (*.example.com not allowed)
- ❌ **Cannot contain paths** (/some/path not allowed)
- ❌ **Cannot be public IP addresses**

### For Mokshya Foods

| Purpose | HTTP Origin |
|---------|-------------|
| Development | `http://localhost:3000` |
| Production | `https://mokshyafoods.com.np` |
| Production (www) | `https://www.mokshyafoods.com.np` |

## Authorized Redirect URIs

After users authenticate with Google, they are redirected to this path with an authorization code.

### Rules
- ✅ **Must have a protocol** (http:// or https://)
- ✅ **Must include port if not default** (e.g., :3000)
- ❌ **Cannot contain URL fragments** (#section)
- ❌ **Cannot contain relative paths** (../other/path)
- ❌ **Cannot contain wildcards** (*.example.com)
- ❌ **Cannot be a public IP address**

### For Mokshya Foods

| Purpose | Authorized Redirect URI |
|---------|-------------------------|
| Development | `http://localhost:3000/` |
| Production | `https://mokshyafoods.com.np/` |
| Production (www) | `https://www.mokshyafoods.com.np/` |

> **Note:** Both HTTP Origins and Redirect URIs can be the same or different. Google Identity Services (GIS) handles the callback automatically, so you don't need a separate endpoint.

## Step-by-Step Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Web Application credential
5. Under **Authorized JavaScript Origins**, add:
   - `http://localhost:3000`
   - `https://mokshyafoods.com.np`
   - `https://www.mokshyafoods.com.np`
6. Under **Authorized Redirect URIs**, add:
   - `http://localhost:3000/`
   - `https://mokshyafoods.com.np/`
   - `https://www.mokshyafoods.com.np/`
7. Click **Save**
8. Copy your **Client ID** and add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your_client_id>
   ```

## Important Notes

- **Exact Matching:** URIs must match exactly (including protocol, domain, port, and trailing slash)
- **Google Identity Services:** GIS library handles authentication & redirect automatically
- **No Callback Page Needed:** You don't create a separate /callback endpoint; GIS posts credential to your page
- **Frontend Only:** Client ID is exposed in frontend code (NEXT_PUBLIC_* variable); this is intentional
- **Backend Token Verification:** Backend verifies the credential using google-auth-library
- **Port Numbers Matter:** Development on port 3000 requires explicit inclusion
