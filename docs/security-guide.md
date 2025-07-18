# 🔐 Security Guide

This guide covers the security features implemented in your Greatest Gig band management app.

## 🚀 **Authentication System Overview**

The app uses a secure session-based authentication system with the following features:

### **🔑 Password Security**
- **Strong Hashing**: Passwords are hashed using PBKDF2 with 10,000 iterations
- **Salt Protection**: Each password uses a unique random salt
- **No Plain Text**: Passwords are never stored in plain text
- **Session Tokens**: Cryptographically secure 32-byte session tokens

### **🍪 Session Management**
- **HTTP-Only Cookies**: Session tokens stored in secure, HTTP-only cookies
- **24-Hour Expiry**: Sessions automatically expire after 24 hours
- **Automatic Cleanup**: Expired sessions are removed from storage
- **HTTPS in Production**: Secure cookies enforced in production environment

## 🛡️ **Security Features**

### **First-Time Setup**
- **Initial Access**: First visitor creates the admin password
- **Password Requirements**: Minimum 6 characters for setup
- **Account Creation**: Only one admin account can be created
- **Secure Setup**: No default passwords or backdoors

### **Route Protection**
- **Public Routes**: Home, Songs, Set Builder, Gigs, Performance
- **Protected Routes**: Admin Panel, AI Assistant
- **Auto-Redirect**: Unauthorized users redirected to login
- **Return URLs**: Users redirected to intended page after login

### **API Security**
- **Session Verification**: All protected APIs verify authentication
- **401 Responses**: Proper HTTP status codes for unauthorized access
- **Error Handling**: Secure error messages without information leakage
- **Rate Limiting**: Built-in protection through session management

## 🎯 **Protected Areas**

### **Admin Panel (`/admin`)**
- **Duration Updates**: Bulk song data modifications
- **Spotify Integration**: OAuth credentials and API access
- **Database Management**: Direct data manipulation
- **Analytics**: Sensitive performance metrics

### **AI Assistant (`/ai-setlist`)**
- **OpenAI Integration**: API key protection
- **Advanced Features**: Premium functionality
- **Resource Usage**: Costly API operations

### **API Endpoints**
- `/api/admin/*` - Admin statistics and management
- `/api/ai-setlist` - AI-powered setlist generation
- `/api/spotify/*` - Spotify integration (where applicable)

## 🔧 **Technical Implementation**

### **Authentication Flow**
1. **Check Session**: Every request verifies session validity
2. **Redirect Logic**: Unauthenticated users sent to login
3. **Token Validation**: Session tokens verified against Redis storage
4. **Expiry Handling**: Expired sessions automatically cleaned up

### **Password Storage**
```javascript
// Password hashing process
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
```

### **Session Creation**
```javascript
// Secure session token generation
const sessionToken = crypto.randomBytes(32).toString('hex');
```

### **Cookie Security**
```javascript
response.cookies.set('session', sessionToken, {
  httpOnly: true,           // Prevents XSS access
  secure: isProduction,     // HTTPS only in production
  sameSite: 'lax',         // CSRF protection
  maxAge: 24 * 60 * 60     // 24 hour expiry
});
```

## ⚠️ **Security Best Practices**

### **For Users**
1. **Strong Passwords**: Use a password you can remember but others can't guess
2. **Secure Storage**: Store your password in a password manager
3. **Regular Logout**: Sign out when finished, especially on shared computers
4. **HTTPS Access**: Always access via `https://band-setlist-app.vercel.app`

### **For Deployment**
1. **Environment Variables**: Keep credentials in Vercel environment variables
2. **HTTPS Enforcement**: Vercel automatically provides HTTPS
3. **Domain Security**: Use your actual domain, not development URLs
4. **Regular Updates**: Keep dependencies updated

## 🔍 **Security Monitoring**

### **Login Tracking**
- **Last Login**: Tracked and displayed in admin panel
- **Session Creation**: Timestamps recorded for audit
- **Failed Attempts**: Logged for security monitoring

### **Access Logs**
- **Protected Routes**: Monitor unauthorized access attempts
- **API Calls**: Track authentication failures
- **Session Expiry**: Monitor session cleanup

## 🚨 **Incident Response**

### **If Password is Compromised**
1. **No Reset Feature**: Currently no password reset (by design for security)
2. **Data Backup**: Export important data if needed
3. **Environment Reset**: Clear Redis auth data if necessary
4. **New Setup**: Fresh deployment will require new password setup

### **Session Security**
1. **Logout All**: Password change invalidates all sessions
2. **Token Refresh**: New login creates new session token
3. **Cleanup**: Old sessions automatically expire

## 🔐 **Privacy & Data**

### **Data Storage**
- **Local Storage**: All data stored in your Upstash Redis instance
- **No Third-Party**: No external analytics or tracking
- **Band Data**: Song lists, setlists, and gigs remain private
- **Spotify Integration**: Only stores tokens, not personal playlists

### **Data Access**
- **Admin Only**: Only authenticated admin can access sensitive features
- **Public Data**: Song lists and setlists accessible to authenticated users
- **No Sharing**: No built-in sharing or export to third parties

## 🛠️ **Advanced Security**

### **Future Enhancements**
- **Multi-User Support**: Multiple band member accounts
- **Role-Based Access**: Different permission levels
- **Two-Factor Auth**: SMS or authenticator app support
- **Password Reset**: Secure email-based reset flow
- **Audit Logging**: Detailed activity tracking

### **Current Limitations**
- **Single User**: One admin account only
- **No Password Reset**: Must be handled manually
- **Session Sharing**: Same device sessions are shared
- **Browser Dependency**: Logout affects all tabs

## 📝 **Security Checklist**

### **Initial Setup**
- ✅ Create strong admin password (6+ characters)
- ✅ Verify HTTPS access to live site
- ✅ Confirm login/logout functionality
- ✅ Test protected route access

### **Regular Maintenance**
- ✅ Regular logout when finished
- ✅ Monitor for unauthorized access attempts
- ✅ Keep browser updated for security patches
- ✅ Verify Vercel environment variables are secure

### **Data Protection**
- ✅ Regular data exports as backup
- ✅ Monitor Redis storage usage
- ✅ Verify Spotify tokens are current
- ✅ Check session expiry behavior

The security system provides enterprise-level protection for your band's sensitive data while maintaining ease of use for daily operations. All authentication is handled securely without compromising functionality. 