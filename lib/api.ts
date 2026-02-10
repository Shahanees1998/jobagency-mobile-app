// API Client for Job Portal Mobile App
const API_BASE_URL = 'https://job-agency-1.vercel.app';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'EMPLOYER' | 'CANDIDATE';
    status: string;
  };
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.warn('[API] Non-JSON response:', response.status, text?.slice(0, 200));
        data = { message: text || 'Invalid response', error: text || 'Invalid response' };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'An error occurred',
          data: data,
        };
      }

      const resolvedData = data.data ?? data;

      return {
        success: true,
        data: resolvedData,
        message: data.message,
      };
    } catch (error: any) {
      const msg = error?.message || 'Network error occurred';
      console.warn('[API] Request failed:', url, msg);
      return {
        success: false,
        error: msg,
      };
    }
  }

  // Authentication APIs
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: 'CANDIDATE' | 'EMPLOYER';
  }): Promise<ApiResponse<LoginResponse>> {
    const endpoint = '/api/auth/register';
    const url = `${this.baseURL}${endpoint}`;
    const body = JSON.stringify(data);
    console.log('[Register] URL:', url);
    console.log('[Register] Payload:', { ...data, password: data.password ? '***' : '' });
    const result = await this.request<LoginResponse>(endpoint, {
      method: 'POST',
      body,
    });
    console.log('[Register] Response success:', result.success, result.error ? `error: ${result.error}` : '');
    return result;
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/api/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async sendOTP(email: string): Promise<ApiResponse> {
    return this.request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOTP(email: string, otp: string): Promise<ApiResponse> {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  // User APIs
  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.request('/api/auth/me');
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
  }): Promise<ApiResponse> {
    return this.request('/api/users/edit-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async uploadProfileImage(imageUri: string, mimeType: string = 'image/jpeg'): Promise<ApiResponse<{ profileImage: string }>> {
    try {
      // Import FileSystem
      const FileSystem = require('expo-file-system');
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      // Get file extension from mimeType
      const getExtension = (mime: string) => {
        if (mime.includes('png')) return 'png';
        if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
        if (mime.includes('gif')) return 'gif';
        if (mime.includes('webp')) return 'webp';
        return 'jpg';
      };
      
      const fileExtension = getExtension(mimeType);
      const fileName = `profile.${fileExtension}`;

      // React Native FormData format - this should work with React Native's fetch
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);

      const url = `${this.baseURL}/api/users/profile-image`;
      const headers: HeadersInit = {};
      
      // Don't set Content-Type - React Native will set it automatically with boundary
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Upload failed:', data);
        return {
          success: false,
          error: data.error || data.message || 'Upload failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  // Jobs APIs (Public)
  async getJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    employmentType?: string;
  }): Promise<ApiResponse<{ jobs: any[]; total: number; page: number; limit: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.employmentType) queryParams.append('employmentType', params.employmentType);

    const query = queryParams.toString();
    return this.request(`/api/jobs${query ? `?${query}` : ''}`);
  }

  async getJobById(jobId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/jobs/${jobId}`);
  }

  // Employer APIs
  async getEmployerProfile(): Promise<ApiResponse<any>> {
    return this.request('/api/employers/profile');
  }

  async getEmployerJobById(jobId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/employers/jobs/${jobId}`);
  }

  async updateEmployerProfile(data: {
    companyName?: string;
    companyDescription?: string;
    companyWebsite?: string;
    industry?: string;
    companySize?: string;
    address?: string;
    city?: string;
    country?: string;
  }): Promise<ApiResponse> {
    return this.request('/api/employers/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadEmployerLogo(imageUri: string, mimeType: string = 'image/jpeg'): Promise<ApiResponse<{ companyLogo: string }>> {
    const formData = new FormData();
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('gif') ? 'gif' : mimeType.includes('webp') ? 'webp' : 'jpg';
    formData.append('image', {
      uri: imageUri,
      type: mimeType,
      name: `logo.${ext}`,
    } as any);

    const url = `${this.baseURL}/api/employers/logo`;
    const headers: HeadersInit = {};
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;

    try {
      const response = await fetch(url, { method: 'POST', headers, body: formData });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || data.message || 'Upload failed' };
      }
      return { success: true, data: data.data || data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Upload failed' };
    }
  }

  async uploadEmployerBanner(imageUri: string, mimeType: string = 'image/jpeg'): Promise<ApiResponse<{ companyBanner: string }>> {
    const formData = new FormData();
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('gif') ? 'gif' : mimeType.includes('webp') ? 'webp' : 'jpg';
    formData.append('image', {
      uri: imageUri,
      type: mimeType,
      name: `banner.${ext}`,
    } as any);

    const url = `${this.baseURL}/api/employers/banner`;
    const headers: HeadersInit = {};
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;

    try {
      const response = await fetch(url, { method: 'POST', headers, body: formData });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || data.message || 'Upload failed' };
      }
      return { success: true, data: data.data || data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Upload failed' };
    }
  }

  async postJob(data: {
    title: string;
    description: string;
    requirements?: string;
    responsibilities?: string;
    location?: string;
    salaryRange?: string;
    employmentType: string;
    category?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/api/employers/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEmployerJobs(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/api/employers/jobs${query ? `?${query}` : ''}`);
  }

  async updateJob(
    jobId: string,
    data: {
      title?: string;
      description?: string;
      requirements?: string;
      responsibilities?: string;
      location?: string;
      salaryRange?: string;
      employmentType?: string;
      category?: string;
      status?: 'CLOSED';
    }
  ): Promise<ApiResponse<any>> {
    return this.request(`/api/employers/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getJobApplications(jobId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/employers/jobs/${jobId}/applications`);
  }

  async updateApplicationStatus(
    jobId: string,
    applicationId: string,
    status: string,
    notes?: string,
    interview?: {
      interviewDate?: string;
      interviewLocation?: string;
      interviewNotes?: string;
    }
  ): Promise<ApiResponse> {
    return this.request(`/api/employers/jobs/${jobId}/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        notes,
        ...(interview?.interviewDate !== undefined && { interviewDate: interview.interviewDate }),
        ...(interview?.interviewLocation !== undefined && { interviewLocation: interview.interviewLocation }),
        ...(interview?.interviewNotes !== undefined && { interviewNotes: interview.interviewNotes }),
      }),
    });
  }

  // Candidate APIs
  async getCandidateProfile(): Promise<ApiResponse<any>> {
    return this.request('/api/candidates/profile');
  }

  async updateCandidateProfile(data: {
    bio?: string;
    skills?: string[];
    experience?: string;  // JSON string of work experience array
    education?: string;   // JSON string of education array
    location?: string;
    availability?: string;
    expectedSalary?: string;
    languages?: string[];
    certifications?: string[];
  }): Promise<ApiResponse> {
    return this.request('/api/candidates/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadCV(cvUri: string): Promise<ApiResponse<{ cvUrl: string }>> {
    const formData = new FormData();
    formData.append('cv', {
      uri: cvUri,
      type: 'application/pdf',
      name: 'resume.pdf',
    } as any);

    const url = `${this.baseURL}/api/candidates/cv`;
    const headers: HeadersInit = {};
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Upload failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  async applyToJob(jobId: string, coverLetter?: string): Promise<ApiResponse<any>> {
    return this.request(`/api/candidates/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ coverLetter }),
    });
  }

  async withdrawApplication(jobId: string, applicationId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/candidates/jobs/${jobId}/applications/${applicationId}/withdraw`, {
      method: 'POST',
    });
  }

  async getMyApplications(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/api/candidates/applications${query ? `?${query}` : ''}`);
  }

  async getApplicationById(applicationId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/applications/${applicationId}`);
  }

  // Chat APIs
  async getChats(): Promise<ApiResponse<any[]>> {
    return this.request('/api/chats');
  }

  async getChatMessages(chatId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/api/chats/${chatId}/messages${query ? `?${query}` : ''}`);
  }

  async sendMessage(chatId: string, content: string, messageType: 'TEXT' | 'IMAGE' = 'TEXT'): Promise<ApiResponse<any>> {
    return this.request(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, messageType }),
    });
  }

  async uploadChatImage(imageUri: string, mimeType: string = 'image/jpeg'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('gif') ? 'gif' : mimeType.includes('webp') ? 'webp' : 'jpg';
    formData.append('image', {
      uri: imageUri,
      type: mimeType,
      name: `chat-image.${ext}`,
    } as any);

    const url = `${this.baseURL}/api/chats/upload-image`;
    const headers: HeadersInit = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Upload failed',
        };
      }
      const urlResult = data.data?.url ?? data.url;
      return {
        success: true,
        data: { url: urlResult },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  // Notifications APIs
  async getNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/api/notifications${query ? `?${query}` : ''}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request('/api/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  // Support APIs
  async createSupportRequest(data: {
    subject: string;
    message: string;
    priority?: string;
  }): Promise<ApiResponse> {
    return this.request('/api/support', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

