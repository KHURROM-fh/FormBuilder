'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formsApi, FormDefinition, FormSubmission } from '@/lib/formStorage';
import { copyToClipboard } from '@/lib/clipboard';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import DashboardNav from '@/components/DashboardNav';
import CreateFormMenu from '@/components/CreateFormMenu';
import {
  FileText,
  CheckCircle2,
  TrendingUp,
  Plus,
  ExternalLink,
  Code2,
  Edit,
  Eye,
  Trash2,
  Copy,
  MessageSquare,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [mounted, setMounted] = useState(false);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [stats, setStats] = useState<{ total_forms: number; published_forms: number; total_submissions: number; avg_submissions_per_form: number }>({
    total_forms: 0,
    published_forms: 0,
    total_submissions: 0,
    avg_submissions_per_form: 0,
  });

  const loadData = async () => {
    try {
      const [allForms, dashboardStats] = await Promise.all([
        formsApi.getForms(),
        formsApi.getDashboardStats(),
      ]);
      setForms(allForms);
      setSubmissions(dashboardStats.recent_submissions);
      setStats({
        total_forms: dashboardStats.total_forms,
        published_forms: dashboardStats.published_forms,
        total_submissions: dashboardStats.total_submissions,
        avg_submissions_per_form: dashboardStats.avg_submissions_per_form,
      });
    } catch (err: unknown) {
      console.error('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    setMounted(true);
    loadData();
  }, [user]);

  const totalForms = stats.total_forms;
  const publishedForms = stats.published_forms;
  const totalSubmissions = stats.total_submissions;
  const recentForms = forms.slice(0, 5);
  const recentSubmissions = submissions.slice(0, 6);

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await formsApi.duplicateForm(id);
      if (dup) {
        showToast('Form duplicated as draft', 'success');
        await loadData();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not duplicate form', 'error');
    }
  };

  const handleTogglePublish = async (form: FormDefinition) => {
    try {
      if (form.status === 'published') {
        await formsApi.unpublishForm(form.id);
        showToast('Form unpublished (moved to draft)', 'info');
      } else {
        await formsApi.publishForm(form.id);
        showToast('Form published successfully!', 'success');
      }
      await loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to change status', 'error');
    }
  };

  const handleCopyLink = async (publicId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/forms/${publicId}`;
    const success = await copyToClipboard(url);
    if (success) {
      showToast('Public form link copied to clipboard!', 'success');
    } else {
      showToast('Could not copy link automatically', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const ok = await formsApi.deleteForm(deleteTargetId);
      if (ok) {
        showToast('Form deleted', 'info');
        await loadData();
      }
    } catch {
      showToast('Failed to delete form', 'error');
    }
    setDeleteTargetId(null);
  };

  if (!mounted) {
    return (
      <div className="bg-white min-h-[calc(100vh-4rem)]">
        <DashboardNav />
        <div className="mx-auto max-w-6xl p-8 text-center text-xs text-slate-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[calc(100vh-4rem)]">
      <DashboardNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Welcome Headline */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Overview & Statistics
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Welcome back{user?.name ? `, ${user.name}` : ''}! Track your interactive forms, submissions, and active chatbots.
            </p>
          </div>

          <CreateFormMenu className="self-start sm:self-auto" />
        </div>

        {/* 4 Metric Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Total Forms</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{totalForms}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <span className="mt-2 text-[11px] text-slate-400 block">Created in your account</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Published Forms</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{publishedForms}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <span className="mt-2 text-[11px] text-slate-400 block">Accepting public responses</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Total Submissions</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{totalSubmissions}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <span className="mt-2 text-[11px] text-slate-400 block">Stored in local store</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Avg Submissions / Form</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">
                {totalForms > 0 ? (totalSubmissions / totalForms).toFixed(1) : '0'}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <span className="mt-2 text-[11px] text-slate-400 block">Response engagement rate</span>
          </div>
        </div>

        {/* Two Column Grid: Recent Forms & Recent Submissions */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Recent Forms Table */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Recent Forms</h2>
              <Link
                href="/dashboard/forms"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all ({totalForms}) <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              {recentForms.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentForms.map((form) => {
                    const formSubCount = form.total_submissions ?? submissions.filter((s) => s.formId === form.id).length;
                    return (
                      <div
                        key={form.id}
                        className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/forms/${form.id}/edit`}
                              className="text-xs font-bold text-slate-900 hover:text-blue-600 transition"
                            >
                              {form.title}
                            </Link>
                            <button
                              onClick={() => handleTogglePublish(form)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition ${
                                form.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                              title="Click to toggle status"
                            >
                              {form.status === 'published' ? '● Published' : '○ Draft'}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{form.description || 'No description'}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span>{form.question_count ?? form.questions?.length ?? 0} questions</span>
                            <span>•</span>
                            <Link
                              href={`/dashboard/forms/${form.id}/responses`}
                              className="font-medium text-slate-600 hover:text-blue-600"
                            >
                              {formSubCount} submissions
                            </Link>
                            <span>•</span>
                            <span>Updated {new Date(form.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                          <Link
                            href={`/dashboard/forms/${form.id}/edit`}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Form"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/dashboard/forms/${form.id}/preview`}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Preview Form"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/dashboard/forms/${form.id}/share`}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Share & Embed"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                          </Link>
                          {form.status === 'published' && (
                            <button
                              onClick={() => handleCopyLink(form.publicId)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Copy Public Link"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicate(form.id)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Duplicate Form"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(form.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Form"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="mx-auto h-7 w-7 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">No forms created yet</p>
                  <Link
                    href="/dashboard/forms/new"
                    className="mt-3 inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Form
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recent Submissions Feed */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Recent Submissions</h2>
              <span className="text-xs text-slate-400">{totalSubmissions} total</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              {recentSubmissions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentSubmissions.map((sub) => {
                    const form = forms.find((f) => f.id === sub.formId);
                    const firstAnswer = Object.values(sub.answers)[0] || 'No answer recorded';
                    const answerKeys = Object.keys(sub.answers);

                    return (
                      <div key={sub.id} className="p-3.5 hover:bg-slate-50/70 transition space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <Link
                            href={`/dashboard/forms/${sub.formId}/responses`}
                            className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                          >
                            {form ? form.title : 'Form'}
                          </Link>
                          <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">
                          <span className="font-medium text-slate-500">Preview:</span> {firstAnswer}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>{answerKeys.length} answers provided</span>
                          <Link
                            href={`/dashboard/forms/${sub.formId}/responses`}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            View &rarr;
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle2 className="mx-auto h-7 w-7 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">No submissions yet</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Publish your form and share the public link or chatbot embed to collect responses.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for deletion */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Form"
        message="Are you sure you want to delete this form? All associated submissions will also be deleted. This cannot be undone."
        confirmLabel="Delete Form"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
