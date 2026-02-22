// Storage utilities using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedJobSummary {
  id: string;
  title: string;
  companyName: string;
  location: string;
  benefits?: string[];
  companyLogoLetter?: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@jobportal:access_token',
  REFRESH_TOKEN: '@jobportal:refresh_token',
  USER: '@jobportal:user',
  SAVED_JOBS: '@jobportal:saved_jobs',
  SAVED_JOB_IDS_LEGACY: '@jobportal:saved_job_ids', // old key, migrated to SAVED_JOBS
  ONBOARDING_SEEN: '@jobportal:onboarding_seen',
  JOB_FILTERS: '@jobportal:job_filters',
  APPLIED_JOB_IDS: '@jobportal:applied_job_ids',
  RECENT_SEARCHES: '@jobportal:recent_searches',
};

export interface RecentSearch {
  job: string;
  location: string;
}

export interface JobFilters {
  datePosted: 'all' | '24h' | '3d' | '7d';
  remote: string[];
  jobType: string[];
  experienceLevel: 'all' | 'senior' | 'mid' | 'entry' | 'none';
  salary: 'all' | '70' | '90' | '110' | '120' | '140';
  education: 'all' | 'high_school' | 'bachelor' | 'master' | 'doctoral';
  sortBy: 'relevance' | 'date';
}

export const storage = {
  async setAccessToken(token: string | null): Promise<void> {
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
  },

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async setRefreshToken(token: string | null): Promise<void> {
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async setUser(user: any): Promise<void> {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  async getUser(): Promise<any | null> {
    const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.SAVED_JOBS,
      STORAGE_KEYS.SAVED_JOB_IDS_LEGACY,
      STORAGE_KEYS.ONBOARDING_SEEN,
      STORAGE_KEYS.JOB_FILTERS,
      STORAGE_KEYS.APPLIED_JOB_IDS,
      STORAGE_KEYS.RECENT_SEARCHES,
    ]);
  },

  async getJobFilters(): Promise<JobFilters | null> {
    const str = await AsyncStorage.getItem(STORAGE_KEYS.JOB_FILTERS);
    if (!str) return null;
    try {
      return JSON.parse(str) as JobFilters;
    } catch {
      return null;
    }
  },

  async setJobFilters(filters: JobFilters): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.JOB_FILTERS, JSON.stringify(filters));
  },

  async getAppliedJobIds(): Promise<string[]> {
    const str = await AsyncStorage.getItem(STORAGE_KEYS.APPLIED_JOB_IDS);
    if (!str) return [];
    try {
      const arr = JSON.parse(str);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  },

  async addAppliedJobId(jobId: string): Promise<void> {
    const ids = await this.getAppliedJobIds();
    if (ids.includes(jobId)) return;
    await AsyncStorage.setItem(STORAGE_KEYS.APPLIED_JOB_IDS, JSON.stringify([...ids, jobId]));
  },

  async removeAppliedJobId(jobId: string): Promise<void> {
    const ids = await this.getAppliedJobIds();
    if (!ids.includes(jobId)) return;
    await AsyncStorage.setItem(
      STORAGE_KEYS.APPLIED_JOB_IDS,
      JSON.stringify(ids.filter((id) => id !== jobId))
    );
  },

  async getOnboardingSeen(): Promise<boolean> {
    const v = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
    return v === 'true';
  },

  async setOnboardingSeen(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
  },

  /** Saved job summary for list/card display */
  async getSavedJobs(): Promise<SavedJobSummary[]> {
    let str = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
    if (!str) {
      const legacy = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_JOB_IDS_LEGACY);
      if (legacy) await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_JOB_IDS_LEGACY);
      return [];
    }
    try {
      const arr = JSON.parse(str);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  },

  async getSavedJobIds(): Promise<string[]> {
    const jobs = await this.getSavedJobs();
    return jobs.map((j) => j.id);
  },

  async addSavedJob(job: SavedJobSummary): Promise<void> {
    const jobs = await this.getSavedJobs();
    if (jobs.some((j) => j.id === job.id)) return;
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify([...jobs, job]));
  },

  async removeSavedJobId(jobId: string): Promise<void> {
    const jobs = (await this.getSavedJobs()).filter((j) => j.id !== jobId);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(jobs));
  },

  /** Recent search queries (job + location) for suggestions when field is empty */
  async getRecentSearches(): Promise<RecentSearch[]> {
    const str = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    if (!str) return [];
    try {
      const arr = JSON.parse(str);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  },

  async addRecentSearch(job: string, location: string): Promise<void> {
    const trimmed = { job: job.trim(), location: location.trim() };
    if (!trimmed.job && !trimmed.location) return;
    let list = await this.getRecentSearches();
    list = [trimmed, ...list.filter((s) => s.job !== trimmed.job || s.location !== trimmed.location)];
    list = list.slice(0, 10);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(list));
  },
};


