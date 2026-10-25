export type QuestionType = 'text' | 'email' | 'multiple_choice' | 'yes_no';

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

export interface FormSettings {
  welcomeMessage: string;
  completionMessage: string;
  primaryColor: string;
  submitLabel: string;
  enableLiveChat: boolean;
  defaultLayout: 'standard' | 'chatbot';
}

export interface FormDefinition {
  id: string;
  public_id: string;
  publicId: string; // compatibility
  title: string;
  description: string;
  status: 'draft' | 'published';
  questions: FormQuestion[];
  settings: FormSettings;
  question_count?: number;
  total_submissions?: number;
  created_at: string;
  updated_at: string;
  createdAt: string; // compatibility
  updatedAt: string; // compatibility
}

export interface FormSubmission {
  id: string;
  form: string;
  formId: string; // compatibility
  form_title?: string;
  submitted_at: string;
  submittedAt: string; // compatibility
  answers: Record<string, string>;
}

export interface DashboardStats {
  total_forms: number;
  published_forms: number;
  total_submissions: number;
  avg_submissions_per_form: number;
  recent_forms: FormDefinition[];
  recent_submissions: FormSubmission[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://16.171.253.148:8000';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('fb_tokens');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.access) {
          headers['Authorization'] = `Bearer ${parsed.access}`;
        }
      }
    } catch {
      // ignore
    }
  }
  return headers;
}

function normalizeForm(f: any): FormDefinition {
  if (!f) return f;
  const pId = f.public_id || f.publicId || '';
  const cAt = f.created_at || f.createdAt || new Date().toISOString();
  const uAt = f.updated_at || f.updatedAt || new Date().toISOString();

  return {
    ...f,
    public_id: pId,
    publicId: pId,
    created_at: cAt,
    createdAt: cAt,
    updated_at: uAt,
    updatedAt: uAt,
    settings: {
      welcomeMessage: f.settings?.welcomeMessage ?? 'Welcome! Please answer the questions below.',
      completionMessage: f.settings?.completionMessage ?? 'Thank you! Your response has been submitted.',
      primaryColor: f.settings?.primaryColor || '#2563eb',
      submitLabel: f.settings?.submitLabel || 'Submit Form',
      enableLiveChat: f.settings?.enableLiveChat ?? true,
      defaultLayout: f.settings?.defaultLayout || 'standard',
    },
    questions: Array.isArray(f.questions) ? f.questions : [],
  };
}

function normalizeSubmission(s: any): FormSubmission {
  if (!s) return s;
  const fId = s.form || s.formId || '';
  const sAt = s.submitted_at || s.submittedAt || new Date().toISOString();

  return {
    ...s,
    form: fId,
    formId: fId,
    submitted_at: sAt,
    submittedAt: sAt,
    answers: s.answers || {},
  };
}

export const formsApi = {
  async getForms(params?: { status?: string; search?: string; sort?: string }): Promise<FormDefinition[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);

    const url = `${API_BASE_URL}/api/forms/${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch forms: ${res.statusText}`);
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : data.results || [];
    return list.map(normalizeForm);
  },

  async getFormById(id: string): Promise<FormDefinition | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forms/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeForm(data);
    } catch {
      return null;
    }
  },

  async getFormByPublicId(publicId: string): Promise<FormDefinition | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/forms/${publicId}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeForm(data);
    } catch {
      return null;
    }
  },

  async getPublicForm(publicId: string): Promise<FormDefinition | null> {
    return this.getFormByPublicId(publicId);
  },

  async createForm(payload: Partial<FormDefinition>): Promise<FormDefinition> {
    const res = await fetch(`${API_BASE_URL}/api/forms/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create form' }));
      throw new Error(err.detail || JSON.stringify(err));
    }

    const data = await res.json();
    return normalizeForm(data);
  },

  async updateForm(id: string, payload: Partial<FormDefinition>): Promise<FormDefinition | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forms/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) return null;
      const data = await res.json();
      return normalizeForm(data);
    } catch {
      return null;
    }
  },

  async deleteForm(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forms/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.ok || res.status === 204;
    } catch {
      return false;
    }
  },

  async duplicateForm(id: string): Promise<FormDefinition | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forms/${id}/duplicate/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeForm(data);
    } catch {
      return null;
    }
  },

  async publishForm(id: string): Promise<FormDefinition | null> {
    const res = await fetch(`${API_BASE_URL}/api/forms/${id}/publish/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to publish form' }));
      throw new Error(err.detail || 'Could not publish form');
    }

    const data = await res.json();
    return normalizeForm(data);
  },

  async unpublishForm(id: string): Promise<FormDefinition | null> {
    const res = await fetch(`${API_BASE_URL}/api/forms/${id}/unpublish/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to unpublish form' }));
      throw new Error(err.detail || 'Could not unpublish form');
    }

    const data = await res.json();
    return normalizeForm(data);
  },

  async getSubmissions(formId: string, search?: string, sort?: string): Promise<FormSubmission[]> {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (sort) query.set('sort', sort);

    const url = `${API_BASE_URL}/api/forms/${formId}/submissions/${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.results || [];
    return list.map(normalizeSubmission);
  },

  async createSubmission(publicId: string, answers: Record<string, string>): Promise<{ id: string; completion_message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/public/forms/${publicId}/submissions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Submission failed' }));
      const msg = typeof err === 'object' ? Object.values(err)[0] : 'Submission failed';
      throw new Error(Array.isArray(msg) ? msg[0] : String(msg));
    }

    return await res.json();
  },

  async deleteSubmission(formId: string, submissionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forms/${formId}/submissions/${submissionId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.ok || res.status === 204;
    } catch {
      return false;
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/stats/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return {
        total_forms: 0,
        published_forms: 0,
        total_submissions: 0,
        avg_submissions_per_form: 0,
        recent_forms: [],
        recent_submissions: [],
      };
    }

    const data = await res.json();
    return {
      total_forms: data.total_forms || 0,
      published_forms: data.published_forms || 0,
      total_submissions: data.total_submissions || 0,
      avg_submissions_per_form: data.avg_submissions_per_form || 0,
      recent_forms: (data.recent_forms || []).map(normalizeForm),
      recent_submissions: (data.recent_submissions || []).map(normalizeSubmission),
    };
  },

  async downloadCSV(formId: string, formTitle?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forms/${formId}/submissions/export/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!res.ok) return false;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeTitle = (formTitle || 'form').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      link.setAttribute('download', `${safeTitle}_submissions.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  },
};
