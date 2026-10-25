'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formsApi, FormDefinition } from '@/lib/formStorage';
import { copyToClipboard } from '@/lib/clipboard';
import { useToast } from '@/components/Toast';
import DashboardNav from '@/components/DashboardNav';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Code,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  MessageSquare,
  Lock,
  Send,
  Sparkles,
  Bot,
} from 'lucide-react';

export default function FormSharePage() {
  const params = useParams();
  const formId = params?.id as string;
  const { showToast } = useToast();

  const [form, setForm] = useState<FormDefinition | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [testChatInput, setTestChatInput] = useState('');
  const [testChatMessages, setTestChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([]);

  const loadData = async () => {
    if (!formId) return;
    try {
      const found = await formsApi.getFormById(formId);
      if (found) {
        setForm(found);
        setTestChatMessages([
          { sender: 'bot', text: found.settings.welcomeMessage || 'Hello! How can we help you today?' },
          ...(found.questions.length > 0
            ? [{ sender: 'bot' as const, text: `1. ${found.questions[0].label}` }]
            : []),
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [formId]);

  if (!form) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardNav />
        <div className="flex h-96 items-center justify-center text-xs text-slate-500">
          Loading share settings...
        </div>
      </div>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const publicUrl = `${origin}/forms/${form.publicId}`;
  const embedSnippet = `<script
  src="${origin}/widget.js"
  data-form-id="${form.publicId}"
  data-primary-color="${form.settings.primaryColor}"
  defer
></script>`;

  const handleTogglePublish = async () => {
    try {
      if (form.status === 'published') {
        const updated = await formsApi.unpublishForm(form.id);
        if (updated) {
          setForm(updated);
          showToast('Form is now unpublished (Draft mode)', 'info');
        }
      } else {
        const updated = await formsApi.publishForm(form.id);
        if (updated) {
          setForm(updated);
          showToast('Form is now live and accepting submissions!', 'success');
        }
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  };

  const handleToggleLiveChat = async () => {
    if (!form) return;
    const nextState = !form.settings.enableLiveChat;
    try {
      const updated = await formsApi.updateForm(form.id, {
        settings: {
          ...form.settings,
          enableLiveChat: nextState,
        },
      });
      if (updated) {
        setForm(updated);
        showToast(`Live Chat feature ${nextState ? 'enabled' : 'disabled'}`, 'info');
      }
    } catch {
      showToast('Failed to update live chat feature', 'error');
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(publicUrl);
    if (success) {
      setCopiedLink(true);
      showToast('Public link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      showToast('Unable to copy automatically.', 'error');
    }
  };

  const handleCopyEmbed = async () => {
    const success = await copyToClipboard(embedSnippet);
    if (success) {
      setCopiedEmbed(true);
      showToast('Embed script copied to clipboard!', 'success');
      setTimeout(() => setCopiedEmbed(false), 2000);
    } else {
      showToast('Unable to copy automatically.', 'error');
    }
  };

  const handleTestChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testChatInput.trim()) return;

    const userText = testChatInput.trim();
    setTestChatInput('');
    setTestChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText },
      { sender: 'bot', text: 'Thank you! This is a live preview test.' },
    ]);
  };

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
              Publish & Share — {form.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Distribute your form with a direct public link or embed it as an interactive chatbot widget on your website.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/dashboard/forms/${form.id}/preview`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              Preview Form
            </Link>

            <Link
              href={`/dashboard/forms/${form.id}/responses`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Responses
            </Link>
          </div>
        </div>

        {/* Publication Status Card */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${
                    form.status === 'published' ? 'bg-blue-600' : 'bg-slate-400'
                  }`}
                />
                <h2 className="text-sm font-bold text-slate-900">
                  Status:{' '}
                  {form.status === 'published'
                    ? 'Live & Accepting Submissions'
                    : 'Unpublished Draft'}
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 max-w-xl">
                {form.status === 'published'
                  ? 'Anyone with the link or visiting your website can submit responses. Submissions will appear in your Responses dashboard instantly.'
                  : 'This form is currently private. Public visitors will see an unavailable notice until published.'}
              </p>
            </div>

            <button
              onClick={handleTogglePublish}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer self-start sm:self-auto ${
                form.status === 'published'
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
              }`}
            >
              {form.status === 'published' ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  Unpublish Form
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  Publish Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Chat Feature Control Card */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${
                    (form.settings.enableLiveChat ?? true) ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <h2 className="text-sm font-bold text-slate-900">
                  Live Chatbot Feature:{' '}
                  {(form.settings.enableLiveChat ?? true) ? 'Enabled' : 'Disabled'}
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 max-w-xl">
                {(form.settings.enableLiveChat ?? true)
                  ? 'Visitors can use the interactive chatbot widget to complete this form conversationally.'
                  : 'Chatbot widget is disabled. Visitors will only see the standard form view.'}
              </p>
            </div>

            <button
              onClick={handleToggleLiveChat}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
            >
              <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
              {(form.settings.enableLiveChat ?? true) ? 'Disable Live Chat' : 'Enable Live Chat'}
            </button>
          </div>
        </div>

        {/* 2-Column Sharing Options */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Direct Public Link & Embed Snippet */}
          <div className="space-y-6">
            {/* Direct Link Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Direct Public Link</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Share this link directly in emails, messages, or social media.
              </p>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-800 outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <Link
                  href={`/forms/${form.publicId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                >
                  Open public form in new tab <ExternalLink className="h-3 w-3" />
                </Link>
                {form.status !== 'published' && (
                  <span className="text-[11px] text-amber-600 font-medium">
                    (Draft: visitors will see unavailable notice)
                  </span>
                )}
              </div>
            </div>

            {/* Chatbot Embed Snippet Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Embed Chatbot Widget</h3>
                </div>
                <button
                  onClick={handleCopyEmbed}
                  className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  {copiedEmbed ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      Copy Snippet
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Paste this snippet before the closing <code className="text-slate-800 font-mono">&lt;/body&gt;</code> tag of any HTML or React website.
              </p>

              <div className="mt-4 rounded-lg bg-slate-900 p-4 text-[11px] font-mono text-slate-100 overflow-x-auto">
                <pre>{embedSnippet}</pre>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Works with WordPress, Webflow, Shopify, Next.js, and static sites</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Configured with brand primary color: <span className="font-mono font-semibold text-slate-800">{form.settings.primaryColor}</span></span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Interactive Embed Preview */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Live Widget Demonstration</h3>
              </div>
              <span className="text-[10px] uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Interactive Preview
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              This demonstrates how the floating chatbot appears to visitors on external pages:
            </p>

            {/* Simulated Website Frame */}
            <div className="mt-4 flex-1 rounded-lg border border-slate-200 bg-slate-100 p-4 flex flex-col justify-between min-h-[360px] relative overflow-hidden">
              {/* Fake web page skeleton content */}
              <div className="space-y-2 opacity-50 pointer-events-none">
                <div className="h-4 w-32 bg-slate-300 rounded" />
                <div className="h-3 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
              </div>

              {/* Chatbot Window on bottom right */}
              <div className="self-end w-full max-w-xs rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden flex flex-col mt-4">
                {/* Chatbot Header */}
                <div
                  className="px-3.5 py-2.5 text-white flex items-center justify-between"
                  style={{ backgroundColor: form.settings.primaryColor || '#2563eb' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none">{form.title}</p>
                      <p className="text-[10px] text-white/80 leading-tight mt-0.5">Online assistant</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>

                {/* Chat Messages */}
                <div className="p-3 space-y-2.5 text-xs max-h-52 overflow-y-auto bg-slate-50/50">
                  {testChatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-1.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Chat Input */}
                <form
                  onSubmit={handleTestChatSend}
                  className="border-t border-slate-200 bg-white p-2 flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    placeholder="Type an answer..."
                    value={testChatInput}
                    onChange={(e) => setTestChatInput(e.target.value)}
                    className="flex-1 bg-transparent px-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
