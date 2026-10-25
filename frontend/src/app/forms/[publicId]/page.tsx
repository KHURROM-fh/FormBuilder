'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formsApi, FormDefinition, FormQuestion } from '@/lib/formStorage';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  MessageSquare,
  Minus,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

export default function PublicFormPage() {
  const params = useParams();
  const publicId = params?.publicId as string;

  const [form, setForm] = useState<FormDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'standard' | 'chatbot'>('standard');

  // Standard Form State
  const [standardAnswers, setStandardAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSubmissionId, setSubmittedSubmissionId] = useState<string | null>(null);

  // Chatbot State
  const [chatStep, setChatStep] = useState(0);
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: 'bot' | 'user'; text: string; options?: string[] }>
  >([]);
  const [chatAnswers, setChatAnswers] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatFinished, setChatFinished] = useState(false);
  const [chatSubmissionId, setChatSubmissionId] = useState<string | null>(null);

  // Floating Chatbot Widget State
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [floatingMinimized, setFloatingMinimized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPublicForm = async () => {
      if (publicId) {
        try {
          const found = await formsApi.getPublicForm(publicId);
          if (found && isMounted) {
            setForm(found);
            if (found.settings?.defaultLayout === 'chatbot' && (found.settings?.enableLiveChat ?? true)) {
              setViewMode('chatbot');
            }
            initChat(found);
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };
    fetchPublicForm();
    return () => {
      isMounted = false;
    };
  }, [publicId]);

  const initChat = (formDef: FormDefinition) => {
    setChatStep(0);
    setChatAnswers({});
    setChatFinished(false);
    setChatSubmissionId(null);
    setChatError(null);

    const firstQ = formDef.questions[0];
    const initialMessages: Array<{ sender: 'bot' | 'user'; text: string; options?: string[] }> = [];

    if (formDef.settings.welcomeMessage) {
      initialMessages.push({
        sender: 'bot',
        text: formDef.settings.welcomeMessage,
      });
    }

    if (firstQ) {
      initialMessages.push({
        sender: 'bot',
        text: `Question 1: ${firstQ.label}${firstQ.required ? ' *' : ''}`,
        options: firstQ.options,
      });
    }

    setChatHistory(initialMessages);
  };

  // Standard Form Validation
  const validateStandardForm = (): boolean => {
    if (!form) return false;
    const newErrors: Record<string, string> = {};

    form.questions.forEach((q) => {
      const val = (standardAnswers[q.id] || '').trim();

      if (q.required && !val) {
        newErrors[q.id] = 'This field is required.';
        return;
      }

      if (q.type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          newErrors[q.id] = 'Please enter a valid email address.';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || isSubmitting) return;

    if (!validateStandardForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const sub = await formsApi.createSubmission(form.public_id || form.id, standardAnswers);
      setSubmittedSubmissionId(sub.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chatbot Question Progression
  const handleChatAnswer = async (answerText: string) => {
    if (!form || chatFinished) return;
    setChatError(null);

    const currentQ = form.questions[chatStep];
    if (!currentQ) return;

    const trimmed = answerText.trim();

    // Validation
    if (currentQ.required && !trimmed) {
      setChatError('This answer is required to proceed.');
      return;
    }

    if (currentQ.type === 'email' && trimmed) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        setChatError('Please enter a valid email address.');
        return;
      }
    }

    // Save answer
    const newAnswers = { ...chatAnswers, [currentQ.id]: trimmed };
    setChatAnswers(newAnswers);
    setChatInput('');

    // Append user bubble
    const nextHistory = [...chatHistory, { sender: 'user' as const, text: trimmed }];

    const nextStep = chatStep + 1;
    if (nextStep < form.questions.length) {
      const nextQ = form.questions[nextStep];
      nextHistory.push({
        sender: 'bot' as const,
        text: `Question ${nextStep + 1}: ${nextQ.label}${nextQ.required ? ' *' : ''}`,
        options: nextQ.options,
      });
      setChatStep(nextStep);
      setChatHistory(nextHistory);
    } else {
      // Completed!
      try {
        const sub = await formsApi.createSubmission(form.public_id || form.id, newAnswers);
        setChatSubmissionId(sub.id);
        nextHistory.push({
          sender: 'bot' as const,
          text: form.settings.completionMessage || 'Thank you! Your submission has been recorded.',
        });
        setChatFinished(true);
        setChatHistory(nextHistory);
      } catch (err: unknown) {
        setChatError(err instanceof Error ? err.message : 'Error saving submission.');
      }
    }
  };

  const handleChatPrev = () => {
    if (chatStep <= 0 || !form) return;
    const prevStep = chatStep - 1;
    setChatStep(prevStep);
    setChatError(null);

    const prevQ = form.questions[prevStep];
    const prevAnswer = chatAnswers[prevQ.id] || '';
    setChatInput(prevAnswer);

    // Roll back messages to the previous question
    const updatedHistory = [...chatHistory];
    // Remove last 2 items (bot's question and user's previous answer)
    if (updatedHistory.length >= 2) {
      updatedHistory.pop();
      updatedHistory.pop();
    }
    setChatHistory(updatedHistory);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-xs text-slate-500">
        Loading form...
      </div>
    );
  }

  // Unavailable State (Not found or Unpublished draft)
  if (!form || form.status !== 'published') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">Form Unavailable</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            {form
              ? 'This form is currently unpublished (Draft mode) and is not accepting responses from the public.'
              : 'The requested form could not be found. It may have been deleted or the link is invalid.'}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Return Home
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryColor = form.settings.primaryColor || '#2563eb';

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Header / Mode Switcher */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
              F
            </div>
            <span className="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
              {form.title}
            </span>
          </div>

          {/* Mode Switcher (Visible only when Live Chat feature is enabled) */}
          {(form.settings.enableLiveChat ?? true) && (
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
              <button
                onClick={() => setViewMode('standard')}
                className={`rounded-md px-3 py-1 transition cursor-pointer ${
                  viewMode === 'standard'
                    ? 'bg-white font-bold text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard Form
              </button>
              <button
                onClick={() => setViewMode('chatbot')}
                className={`rounded-md px-3 py-1 transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'chatbot'
                    ? 'bg-white font-bold text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                Chatbot Mode
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* ================= STANDARD FORM MODE ================= */}
        {viewMode === 'standard' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
            {submittedSubmissionId ? (
              /* Success Completion Screen */
              <div className="py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900">Submission Received</h2>
                <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                  {form.settings.completionMessage ||
                    'Thank you for your response! Your answers have been recorded.'}
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-mono text-slate-600">
                  Ref ID: {submittedSubmissionId}
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => {
                      setSubmittedSubmissionId(null);
                      setStandardAnswers({});
                      setErrors({});
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Submit Another Response
                  </button>
                </div>
              </div>
            ) : (
              /* Form Questions Input */
              <form onSubmit={handleStandardSubmit} noValidate>
                {/* Form Title & Description */}
                <div className="border-b border-slate-200 pb-6 mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {form.title}
                  </h1>
                  {form.description && (
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {form.description}
                    </p>
                  )}
                  {form.settings.welcomeMessage && (
                    <div className="mt-4 rounded-lg bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-800">
                      {form.settings.welcomeMessage}
                    </div>
                  )}
                </div>

                {/* Question List */}
                <div className="space-y-6">
                  {form.questions.map((q, idx) => {
                    const currentVal = standardAnswers[q.id] || '';
                    const hasError = !!errors[q.id];

                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border p-5 transition ${
                          hasError
                            ? 'border-red-300 bg-red-50/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <label className="text-xs font-bold text-slate-900 leading-snug">
                            {idx + 1}. {q.label}{' '}
                            {q.required && <span className="text-red-500 font-bold">*</span>}
                          </label>
                          {q.required && (
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                              Required
                            </span>
                          )}
                        </div>

                        {/* Question Input by Type */}
                        {q.type === 'text' && (
                          <input
                            type="text"
                            placeholder={q.placeholder || 'Type your answer here...'}
                            value={currentVal}
                            onChange={(e) =>
                              setStandardAnswers({ ...standardAnswers, [q.id]: e.target.value })
                            }
                            className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-1 ${
                              hasError
                                ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                          />
                        )}

                        {q.type === 'email' && (
                          <input
                            type="email"
                            placeholder={q.placeholder || 'name@example.com'}
                            value={currentVal}
                            onChange={(e) =>
                              setStandardAnswers({ ...standardAnswers, [q.id]: e.target.value })
                            }
                            className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-1 ${
                              hasError
                                ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                          />
                        )}

                        {q.type === 'multiple_choice' && (
                          <div className="space-y-2 mt-2">
                            {(q.options && q.options.length > 0
                              ? q.options
                              : ['Option 1', 'Option 2']
                            ).map((opt) => (
                              <label
                                key={opt}
                                className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-xs transition cursor-pointer ${
                                  currentVal === opt
                                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${q.id}`}
                                  value={opt}
                                  checked={currentVal === opt}
                                  onChange={() =>
                                    setStandardAnswers({ ...standardAnswers, [q.id]: opt })
                                  }
                                  className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {q.type === 'yes_no' && (
                          <div className="flex items-center gap-3 mt-2">
                            {['Yes', 'No'].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setStandardAnswers({ ...standardAnswers, [q.id]: opt })
                                }
                                className={`flex-1 rounded-lg border py-2.5 text-xs font-semibold transition cursor-pointer ${
                                  currentVal === opt
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Inline Error Message */}
                        {hasError && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            {errors[q.id]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit Button */}
                <div className="mt-8 border-t border-slate-200 pt-6 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    * Required fields must be completed
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ backgroundColor: primaryColor }}
                    className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : form.settings.submitLabel || 'Submit Form'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= CHATBOT CONVERSATIONAL MODE ================= */}
        {viewMode === 'chatbot' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col min-h-[500px]">
            {/* Chatbot Top Bar */}
            <div
              className="px-5 py-3.5 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-bold leading-none">{form.title}</h2>
                  <p className="text-[10px] text-white/80 mt-0.5">Interactive Assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-white/90">
                  {chatFinished
                    ? 'Completed'
                    : `Question ${chatStep + 1} of ${form.questions.length}`}
                </span>
                <button
                  onClick={() => initChat(form)}
                  title="Restart"
                  className="rounded p-1 text-white/80 hover:bg-white/20 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[460px] bg-slate-50/40">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}

              {/* Multiple Choice & Yes/No Quick Option Buttons for Current Step */}
              {!chatFinished && form.questions[chatStep] && (
                <div className="pt-2">
                  {form.questions[chatStep].type === 'multiple_choice' && (
                    <div className="flex flex-wrap gap-2">
                      {(form.questions[chatStep].options || ['Option 1', 'Option 2']).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChatAnswer(opt)}
                          className="rounded-full border border-blue-600 bg-white px-3.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {form.questions[chatStep].type === 'yes_no' && (
                    <div className="flex gap-2">
                      {['Yes', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChatAnswer(opt)}
                          className="rounded-full border border-blue-600 bg-white px-4 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Error Notice */}
              {chatError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}

              {/* Success Footer on Chat Finish */}
              {chatFinished && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-blue-600" />
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    Response Saved to Local Storage
                  </p>
                  {chatSubmissionId && (
                    <p className="mt-0.5 text-[10px] font-mono text-slate-500">
                      ID: {chatSubmissionId}
                    </p>
                  )}
                  <button
                    onClick={() => initChat(form)}
                    className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restart Conversation
                  </button>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            {!chatFinished && (
              <div className="border-t border-slate-200 bg-white p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleChatAnswer(chatInput);
                  }}
                  className="flex items-center gap-2"
                >
                  {chatStep > 0 && (
                    <button
                      type="button"
                      onClick={handleChatPrev}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition"
                      title="Previous Question"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}

                  <input
                    type="text"
                    placeholder={
                      form.questions[chatStep]?.placeholder || 'Type your answer and press Enter...'
                    }
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    style={{ backgroundColor: primaryColor }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:opacity-90 transition cursor-pointer shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= FLOATING CHATBOT WIDGET LAUNCHER ================= */}
      {viewMode === 'standard' && (form.settings.enableLiveChat ?? true) && (
        <div className="fixed bottom-5 right-5 z-40">
          {!floatingOpen ? (
            <button
              onClick={() => setFloatingOpen(true)}
              style={{ backgroundColor: primaryColor }}
              className="flex items-center gap-2 rounded-full px-4 py-3 text-xs font-bold text-white shadow-lg hover:scale-105 transition cursor-pointer"
            >
              <Bot className="h-4 w-4" />
              <span>Chat Form Widget</span>
            </button>
          ) : (
            <div className="w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
              {/* Floating Header */}
              <div
                className="px-4 py-3 text-white flex items-center justify-between"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span className="text-xs font-bold truncate max-w-[160px]">{form.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFloatingMinimized(!floatingMinimized)}
                    className="rounded p-1 text-white/80 hover:bg-white/20 transition cursor-pointer"
                    title={floatingMinimized ? 'Expand' : 'Minimize'}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setFloatingOpen(false)}
                    className="rounded p-1 text-white/80 hover:bg-white/20 transition cursor-pointer"
                    title="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Floating Body */}
              {!floatingMinimized && (
                <div className="flex flex-col h-96">
                  <div className="flex-1 p-3 space-y-2 overflow-y-auto bg-slate-50/50 text-xs">
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${
                            msg.sender === 'user'
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {!chatFinished && form.questions[chatStep] && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {form.questions[chatStep].type === 'multiple_choice' &&
                          (form.questions[chatStep].options || ['Option 1', 'Option 2']).map(
                            (opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleChatAnswer(opt)}
                                className="rounded-full border border-blue-600 bg-white px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                              >
                                {opt}
                              </button>
                            )
                          )}
                        {form.questions[chatStep].type === 'yes_no' &&
                          ['Yes', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleChatAnswer(opt)}
                              className="rounded-full border border-blue-600 bg-white px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                            >
                              {opt}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {!chatFinished && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleChatAnswer(chatInput);
                      }}
                      className="border-t border-slate-200 p-2 flex items-center gap-1.5 bg-white"
                    >
                      <input
                        type="text"
                        placeholder="Type answer..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 bg-transparent px-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
