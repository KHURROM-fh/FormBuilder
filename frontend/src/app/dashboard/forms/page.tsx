'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formsApi, FormDefinition, FormSubmission } from '@/lib/formStorage';
import { copyToClipboard } from '@/lib/clipboard';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import DashboardNav from '@/components/DashboardNav';
import CreateFormMenu from '@/components/CreateFormMenu';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Code2,
  Edit,
  Eye,
  Trash2,
  Copy,
  SlidersHorizontal,
  Inbox,
} from 'lucide-react';

export default function AllFormsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const allForms = await formsApi.getForms();
      setForms(allForms);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await formsApi.duplicateForm(id);
      if (dup) {
        showToast('Form duplicated as draft', 'success');
        await loadData();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not duplicate', 'error');
    }
  };

  const handleTogglePublish = async (form: FormDefinition) => {
    try {
      if (form.status === 'published') {
        await formsApi.unpublishForm(form.id);
        showToast('Form moved to draft', 'info');
      } else {
        await formsApi.publishForm(form.id);
        showToast('Form published successfully!', 'success');
      }
      await loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  };

  const handleCopyLink = async (publicId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/forms/${publicId}`;
    const success = await copyToClipboard(url);
    if (success) {
      showToast('Public URL copied to clipboard!', 'success');
    } else {
      showToast('Could not copy link', 'error');
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

  // Filter and sort
  const filteredForms = forms
    .filter((form) => {
      const matchSearch =
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'all' || form.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'created') return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  return (
    <div className="bg-white min-h-[calc(100vh-4rem)]">
      <DashboardNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header & Create CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              All Forms
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Create, configure questions, publish, and track responses for your forms.
            </p>
          </div>

          <CreateFormMenu className="self-start sm:self-auto" />
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms by title or description..."
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({forms.length})
              </button>
              <button
                onClick={() => setFilterStatus('published')}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  filterStatus === 'published'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  filterStatus === 'draft'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Draft
              </button>
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'title')}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Recently Created</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Forms Table List */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {filteredForms.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredForms.map((form) => {
                const subCount = form.total_submissions ?? submissions.filter((s) => s.formId === form.id).length;

                return (
                  <div
                    key={form.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    {/* Information */}
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/dashboard/forms/${form.id}/edit`}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 transition"
                        >
                          {form.title}
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(form)}
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition ${
                            form.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle publish status"
                        >
                          {form.status === 'published' ? '● Published' : '○ Draft'}
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        {form.description || 'No description added yet.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span>{form.question_count ?? form.questions?.length ?? 0} questions configured</span>
                        <span>•</span>
                        <Link
                          href={`/dashboard/forms/${form.id}/responses`}
                          className="font-medium text-slate-700 hover:text-blue-600"
                        >
                          {subCount} submissions
                        </Link>
                        <span>•</span>
                        <span>Updated {new Date(form.updatedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">/{form.publicId}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/forms/${form.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>

                      <Link
                        href={`/dashboard/forms/${form.id}/preview`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </Link>

                      <Link
                        href={`/dashboard/forms/${form.id}/responses`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                      >
                        <Inbox className="h-3.5 w-3.5" />
                        <span>Responses ({subCount})</span>
                      </Link>

                      <Link
                        href={`/dashboard/forms/${form.id}/share`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        <span>Share & Embed</span>
                      </Link>

                      {form.status === 'published' && (
                        <button
                          onClick={() => handleCopyLink(form.publicId)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                          title="Copy public link"
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
            <div className="p-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No forms match your criteria</h3>
              <p className="mt-1 text-xs text-slate-500">
                {searchQuery ? 'Try clearing your search query or status filter.' : 'Get started by creating your first form.'}
              </p>
              <Link
                href="/dashboard/forms/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Form
              </Link>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Form"
        message="Are you sure you want to delete this form? All recorded responses will also be removed. This cannot be undone."
        confirmLabel="Delete Form"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
