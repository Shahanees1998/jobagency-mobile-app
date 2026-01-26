# Job Portal Mobile App

React Native Expo mobile application for the Job Portal platform. Supports both Candidate and Employer roles with full authentication and job management features.

## Features

### Authentication & Roles
- ✅ Login/Register with email and password
- ✅ JWT token-based authentication
- ✅ Role-based access control (CANDIDATE, EMPLOYER, ADMIN)
- ✅ Secure token storage with AsyncStorage
- ✅ Auto token refresh
- ✅ Forgot/Reset password flow

### Candidate Features
- ✅ Browse and search jobs
- ✅ View job details
- ✅ Apply to jobs with optional cover letter
- ✅ View application status
- ✅ Upload CV/Resume
- ✅ Profile management
- ✅ Chat with employers (after application approval)
- ✅ View notifications

### Employer Features
- ✅ Dashboard with statistics
- ✅ Post new jobs
- ✅ Manage job listings
- ✅ View and manage applications
- ✅ Approve/Reject candidates
- ✅ Chat with candidates (after approval)
- ✅ Profile and company information management

### Additional Features
- ✅ In-app messaging system
- ✅ Notifications support
- ✅ Support request system
- ✅ Profile image upload
- ✅ Change password
- ✅ Dark/Light theme support

## Project Structure

```
app/
├── (auth)/              # Authentication screens
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── (tabs)/              # Main app screens (role-based)
│   ├── index.tsx        # Jobs list (Candidate) / Dashboard (Employer)
│   ├── applications.tsx # Applications management
│   ├── chats.tsx        # Chat list
│   ├── jobs.tsx         # My Jobs (Employer only)
│   └── profile.tsx      # User profile
├── job-details/[id].tsx # Job details screen
├── post-job.tsx         # Post new job (Employer)
├── chat/[id].tsx        # Chat detail screen
├── edit-profile.tsx     # Edit user profile
├── upload-cv.tsx        # Upload CV (Candidate)
├── change-password.tsx  # Change password
└── support.tsx          # Support request

lib/
├── api.ts               # API client
└── storage.ts           # AsyncStorage utilities

contexts/
└── AuthContext.tsx      # Authentication context
```

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator or physical device

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Configure API base URL in `lib/api.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Change to your backend URL
  : 'https://your-production-url.com';
```

3. Start the development server:
```bash
npm start
# or
expo start
```

### Backend APIs

✅ **All required APIs are now available!** See `API_ENDPOINTS.md` for complete list.

The mobile app uses the following API endpoints:

#### Authentication (`/api/auth/*`) ✅
- All authentication endpoints are available

#### User Management (`/api/users/*`) ✅
- All user management endpoints are available

#### Jobs (`/api/jobs/*`) ✅ **NEW**
- `GET /api/jobs` - Get all approved jobs (public)
- `GET /api/jobs/:id` - Get job by ID

#### Employer APIs (`/api/employers/*`) ✅ **NEW**
- `GET /api/employers/profile` - Get employer profile
- `PUT /api/employers/profile` - Update employer profile
- `POST /api/employers/jobs` - Post new job
- `GET /api/employers/jobs` - Get employer's jobs
- `GET /api/employers/jobs/:jobId/applications` - Get job applications
- `PUT /api/employers/jobs/:jobId/applications/:applicationId` - Update application status

#### Candidate APIs (`/api/candidates/*`) ✅ **NEW**
- `GET /api/candidates/profile` - Get candidate profile
- `PUT /api/candidates/profile` - Update candidate profile
- `POST /api/candidates/cv` - Upload CV
- `POST /api/candidates/jobs/:jobId/apply` - Apply to job
- `GET /api/candidates/applications` - Get candidate's applications

#### Chat APIs (`/api/chats/*`) ✅ **NEW**
- `GET /api/chats` - Get user's chats
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats/:chatId/messages` - Send message

#### Notifications (`/api/notifications/*`) ✅
- All notification endpoints are available

#### Support (`/api/support`) ✅
- Support request endpoint is available

## Environment Variables

Create a `.env` file (optional, currently using hardcoded URLs):

```env
API_BASE_URL=http://localhost:3000
```

## Key Implementation Details

### Authentication Flow
1. User logs in → receives accessToken and refreshToken
2. Tokens stored in AsyncStorage
3. Access token included in all API requests
4. On token expiry, refresh token used to get new access token
5. Auto-logout on refresh failure

### Role-Based Navigation
- **CANDIDATE**: Jobs → Applications → Messages → Profile
- **EMPLOYER**: Dashboard → My Jobs → Applications → Messages → Profile
- **ADMIN**: Redirected to web panel (mobile app shows message)

### Chat System
- Chat is only unlocked after employer approves candidate's application
- All communication happens within the app
- No external contact information shared until approval

### Job Application Flow
1. Candidate browses approved jobs
2. Candidate applies to job (with optional cover letter)
3. Application status: APPLIED → REVIEWING → APPROVED/REJECTED
4. On approval, chat is unlocked
5. Interview can be scheduled within the platform

### File Uploads
- Profile images: JPEG/PNG via `expo-image-picker`
- CV/Resume: PDF via `expo-document-picker`
- Files uploaded to backend (should use Cloudinary or similar)

## Development Notes

### Adding New Screens
1. Create screen component in `app/` directory
2. Add navigation route in appropriate layout file
3. Update API client if new endpoints needed
4. Add to role-based navigation if needed

### API Client
All API calls go through the centralized `apiClient` in `lib/api.ts`. This ensures:
- Consistent error handling
- Automatic token injection
- Centralized base URL configuration

### State Management
- Authentication state: `AuthContext`
- Local state: React hooks (useState, useEffect)
- For complex state, consider adding Redux or Zustand

## Testing

Currently, the app is ready for integration testing. To test:

1. Ensure backend APIs are running
2. Update API_BASE_URL in `lib/api.ts`
3. Run the app and test authentication flow
4. Test role-specific features

## Future Enhancements

- [ ] Push notifications (OneSignal/Expo Notifications)
- [ ] Real-time chat updates (WebSocket/Pusher)
- [ ] Offline support
- [ ] Image caching
- [ ] Biometric authentication
- [ ] Social login (Google, Apple)
- [ ] Job favorites/bookmarks
- [ ] Application tracking timeline
- [ ] Interview scheduling calendar

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check API_BASE_URL is correct
   - Ensure backend is running
   - Check network permissions on device

2. **Token Refresh Issues**
   - Verify refresh token endpoint works
   - Check token expiry times
   - Clear AsyncStorage and re-login

3. **File Upload Fails**
   - Check file size limits
   - Verify MIME types
   - Check backend upload endpoint

## License

Private project - All rights reserved
# jobagency-mobile-app
