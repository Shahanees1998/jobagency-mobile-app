# API Endpoints Summary

All APIs are now available! Here's the complete list:

## ✅ Authentication APIs (`/api/auth/*`)
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

## ✅ User Management APIs (`/api/users/*`)
- `GET /api/users` - Get current user profile
- `PUT /api/users/edit-profile` - Update profile
- `POST /api/users/change-password` - Change password
- `POST /api/users/profile-image` - Upload profile image

## ✅ Public Jobs APIs (`/api/jobs/*`) - **NEW**
- `GET /api/jobs` - Get all approved jobs (public)
- `GET /api/jobs/:id` - Get job details by ID (public)

## ✅ Employer APIs (`/api/employers/*`) - **NEW**
- `GET /api/employers/profile` - Get employer profile
- `PUT /api/employers/profile` - Update employer profile
- `POST /api/employers/jobs` - Post new job
- `GET /api/employers/jobs` - Get employer's jobs
- `GET /api/employers/jobs/:jobId/applications` - Get job applications
- `PUT /api/employers/jobs/:jobId/applications/:applicationId` - Update application status

## ✅ Candidate APIs (`/api/candidates/*`) - **NEW**
- `GET /api/candidates/profile` - Get candidate profile
- `PUT /api/candidates/profile` - Update candidate profile
- `POST /api/candidates/cv` - Upload CV
- `POST /api/candidates/jobs/:jobId/apply` - Apply to job
- `GET /api/candidates/applications` - Get candidate's applications

## ✅ Chat APIs (`/api/chats/*`) - **NEW**
- `GET /api/chats` - Get user's chats
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats/:chatId/messages` - Send message

## ✅ Notifications APIs (`/api/notifications/*`)
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

## ✅ Support APIs (`/api/support`)
- `POST /api/support` - Create support request

## Response Format

All APIs return responses in this format:

```json
{
  "success": true,
  "data": {...},
  "message": "Optional message"
}
```

Or on error:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication

Most endpoints require authentication via:
- **Header**: `Authorization: Bearer <access_token>`
- **Cookie**: `access_token` (for web)

## Notes

1. **Jobs API** - Only shows approved jobs to public
2. **Chat** - Only unlocked after employer approves application
3. **File Uploads** - Uses Cloudinary for storage
4. **Role-based** - Some endpoints are role-specific (EMPLOYER, CANDIDATE)

All APIs are ready to use with the mobile app! 🚀


