'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formsApi, FormDefinition, FormSubmission } from '@/lib/formStorage';
import { useToast } from '@/components/Toast';
import DashboardNav from '@/components/DashboardNav';
import {
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Inbox,
  Mail,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';

export default function FormResponsesPage() {
  const params = useParams();
  const formId = params?.id as string;
  const { showToast } = useToast();

  const [form, setForm] = useState<FormDefinition | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const loadData = async () => {
    if (!formId) return;
    try {
      const [foundForm, subs] = await Promise.all([
        formsApi.getFormById(formId),
        formsApi.getSubmissions(formId),
      ]);
      if (foundForm) setForm(foundForm);
      setSubmissions(subs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [formId]);

  // Filtered & sorted submissions
  const filteredSubmissions = useMemo(() => {
    let list = [...submissions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((sub) => {
        if (sub.id.toLowerCase().includes(q)) return true;
        // Search in answers
        return Object.values(sub.answers).some((val) =>
          val.toLowerCase().includes(q)
        );
      });
    }

    list.sort((a, b) => {
      const timeA = new Date(a.submittedAt).getTime();
      const timeB = new Date(b.submittedAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [submissions, searchQuery, sortOrder]);

  const handleExportCSV = async () => {
    if (!form) return;
    if (submissions.length === 0) {
      showToast('No submissions to export yet.', 'info');
      return;
    }
    const success = await formsApi.downloadCSV(form.id, form.title);
    if (success) {
      showToast('CSV downloaded successfully!', 'success');
    } else {
      showToast('Failed to export CSV.', 'error');
    }
  };

  if (!form) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardNav />
        <div className="flex h-96 items-center justify-center text-xs text-slate-500">
          Loading responses...
        </div>
      </div>
    );
  }

  const latestDate =
    submissions.length > 0
      ? new Date(submissions[0].submittedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No submissions yet';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <DashboardNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                href="/dashboard/forms"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Forms
              </Link>
              <span className="text-slate-300">/</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  form.status === 'published'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {form.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {form.title} — Submissions
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Manage and analyze form responses in real-time. Export clean CSV data for reporting.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/dashboard/forms/${form.id}/share`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Share2 className="h-3.5 w-3.5 text-slate-500" />
              Share & Embed
            </Link>

            <Link
              href={`/dashboard/forms/${form.id}/preview`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              Preview
            </Link>

            <button
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
                submissions.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Submissions</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{submissions.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              {form.status === 'published' ? 'Active and collecting' : 'Unpublished (Draft)'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Latest Submission</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900 truncate">{latestDate}</p>
            <p className="mt-1 text-[11px] text-slate-500">Stored locally in browser</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Questions in Form</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{form.questions.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              <Link href={`/dashboard/forms/${form.id}/edit`} className="text-blue-600 hover:underline">
                Edit questions in builder &rarr;
              </Link>
            </p>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by submission ID or answer content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Submissions Table / Empty State */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          {filteredSubmissions.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-semibold text-slate-800">No submissions found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'No responses match your search criteria. Try a different keyword.'
                  : 'This form has not collected any responses yet. Share the public link or test submission yourself.'}
              </p>
              {form.status === 'published' && (
                <div className="mt-5">
                  <Link
                    href={`/forms/${form.publicId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Open Public Form
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Ref ID</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Answers Preview</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSubmissions.map((sub) => {
                    const dateFormatted = new Date(sub.submittedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // Grab first 2 questions that have answers
                    const answeredKeys = Object.keys(sub.answers);
                    const previewQuestions = form.questions
                      .filter((q) => answeredKeys.includes(q.id))
                      .slice(0, 2);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {sub.id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-2 max-w-lg">
                            {previewQuestions.length > 0 ? (
                              previewQuestions.map((q) => (
                                <span
                                  key={q.id}
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 max-w-[200px] truncate"
                                  title={`${q.label}: ${sub.answers[q.id]}`}
                                >
                                  <strong className="font-semibold text-slate-900 truncate">
                                    {q.label.slice(0, 15)}...:
                                  </strong>{' '}
                                  <span className="truncate">{sub.answers[q.id]}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">No answers provided</span>
                            )}
                            {answeredKeys.length > 2 && (
                              <span className="text-[10px] text-slate-500 font-medium self-center">
                                +{answeredKeys.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Submission Details</h3>
                <p className="mt-0.5 text-xs text-slate-500 font-mono">
                  ID: {selectedSubmission.id} &bull;{' '}
                  {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: All Questions & Answers */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {form.questions.map((q, idx) => {
                const answer = selectedSubmission.answers[q.id];

                return (
                  <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-900">
                        {idx + 1}. {q.label}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-2 rounded-md bg-white border border-slate-200 px-3 py-2 text-xs text-slate-800">
                      {answer ? (
                        <span className="font-medium text-slate-900">{answer}</span>
                      ) : (
                        <span className="text-slate-400 italic">No answer provided</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-3.5 bg-slate-50">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
