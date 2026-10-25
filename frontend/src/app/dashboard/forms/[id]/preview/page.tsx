'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formsApi, FormDefinition } from '@/lib/formStorage';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronLeft,
  Laptop,
  MessageSquare,
  RotateCcw,
  Send,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export default function FormPreviewPage() {
  const params = useParams();
  const formId = params?.id as string;

  const [form, setForm] = useState<FormDefinition | null>(null);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [layoutMode, setLayoutMode] = useState<'standard' | 'chatbot'>('standard');

  // Standard form preview state
  const [standardAnswers, setStandardAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Chatbot preview state
  const [chatStep, setChatStep] = useState(0);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'bot' | 'user'; text: string; options?: string[] }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatFinished, setChatFinished] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchForm = async () => {
      if (formId) {
        const found = await formsApi.getFormById(formId);
        if (found && isMounted) {
          setForm(found);
          if (found.settings?.defaultLayout === 'chatbot') {
            setLayoutMode('chatbot');
          }
          initChatbot(found);
        }
      }
    };
    fetchForm();
    return () => {
      isMounted = false;
    };
  }, [formId]);

  const initChatbot = (f: FormDefinition) => {
    setChatStep(0);
    setChatFinished(false);
    setChatInput('');
    const firstQ = f.questions[0];
    const initialMessages: Array<{ sender: 'bot' | 'user'; text: string; options?: string[] }> = [
      { sender: 'bot', text: f.settings.welcomeMessage || 'Welcome!' },
    ];
    if (firstQ) {
      initialMessages.push({
        sender: 'bot',
        text: firstQ.label,
        options: firstQ.options,
      });
    }
    setChatHistory(initialMessages);
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const newErrors: Record<string, string> = {};
    form.questions.forEach((q) => {
      if (q.required && !standardAnswers[q.id]?.trim()) {
        newErrors[q.id] = 'This field is required.';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitted(true);
  };

  const handleChatAnswer = (answer: string) => {
    if (!form || !answer.trim() || chatFinished) return;

    const currentQ = form.questions[chatStep];
    const nextStep = chatStep + 1;

    const updatedHistory = [...chatHistory, { sender: 'user' as const, text: answer.trim() }];
    setChatHistory(updatedHistory);
    setChatInput('');

    if (nextStep < form.questions.length) {
      setChatStep(nextStep);
      const nextQ = form.questions[nextStep];
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          { sender: 'bot', text: nextQ.label, options: nextQ.options },
        ]);
      }, 400);
    } else {
      setChatFinished(true);
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          { sender: 'bot', text: form.settings.completionMessage || 'Thank you! Your response has been submitted.' },
        ]);
      }, 400);
    }
  };

  const handleChatPrev = () => {
    if (!form || chatStep <= 0) return;
    const prevStep = chatStep - 1;
    setChatStep(prevStep);
    const prevQ = form.questions[prevStep];
    setChatHistory((prev) => [
      ...prev,
      { sender: 'bot', text: `(Back) ${prevQ.label}`, options: prevQ.options },
    ]);
  };

  if (!form) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-xs text-slate-500">
        Loading preview...
      </div>
    );
  }

  const primaryColor = form.settings.primaryColor || '#2563eb';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Preview Control Bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/forms/${form.id}/edit`}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Editor</span>
          </Link>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-xs font-bold text-slate-900">{form.title}</span>
        </div>

        {/* View Mode Switchers */}
        <div className="flex items-center gap-3">
          {/* Layout Mode (Standard vs Chatbot) */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => {
                setLayoutMode('standard');
                setIsSubmitted(false);
              }}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                layoutMode === 'standard' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Standard Form
            </button>
            <button
              onClick={() => {
                setLayoutMode('chatbot');
                initChatbot(form);
              }}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                layoutMode === 'chatbot' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Chatbot Widget
            </button>
          </div>

          {/* Device Mode (Desktop vs Mobile) */}
          <div className="hidden sm:flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                deviceMode === 'desktop' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'
              }`}
              title="Desktop View"
            >
              <Laptop className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                deviceMode === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'
              }`}
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hidden md:inline">
            Preview Mode
          </span>
        </div>
      </div>

      {/* Preview Content Stage */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div
          className={`transition-all duration-300 w-full ${
            deviceMode === 'mobile'
              ? 'max-w-[380px] rounded-[36px] border-[10px] border-slate-800 shadow-2xl bg-white min-h-[640px] overflow-hidden'
              : 'max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-md p-6 sm:p-8'
          }`}
        >
          {/* Mobile Notch Bar if mobile view */}
          {deviceMode === 'mobile' && (
            <div className="bg-slate-800 h-6 flex items-center justify-center">
              <div className="h-3.5 w-24 bg-slate-900 rounded-full" />
            </div>
          )}

          <div className={deviceMode === 'mobile' ? 'p-5 overflow-y-auto max-h-[580px]' : ''}>
            {/* 1. STANDARD FORM PREVIEW */}
            {layoutMode === 'standard' && (
              <div>
                {!isSubmitted ? (
                  <form onSubmit={handleStandardSubmit} className="space-y-6">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{form.title}</h1>
                      {form.description && (
                        <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">{form.description}</p>
                      )}
                      {form.settings.welcomeMessage && (
                        <div className="mt-3 rounded-lg bg-blue-50/70 p-3 text-xs text-blue-800 border border-blue-100">
                          {form.settings.welcomeMessage}
                        </div>
                      )}
                    </div>

                    <div className="space-y-5 border-t border-slate-100 pt-5">
                      {form.questions.map((q, idx) => (
                        <div key={q.id} className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-800">
                            <span>{idx + 1}. {q.label}</span>
                            {q.required && <span className="text-red-500 ml-1">*</span>}
                          </label>

                          {q.type === 'text' && (
                            <input
                              type="text"
                              value={standardAnswers[q.id] || ''}
                              onChange={(e) =>
                                setStandardAnswers({ ...standardAnswers, [q.id]: e.target.value })
                              }
                              placeholder={q.placeholder || 'Your answer'}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                          )}

                          {q.type === 'email' && (
                            <input
                              type="email"
                              value={standardAnswers[q.id] || ''}
                              onChange={(e) =>
                                setStandardAnswers({ ...standardAnswers, [q.id]: e.target.value })
                              }
                              placeholder={q.placeholder || 'email@example.com'}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                          )}

                          {q.type === 'multiple_choice' && (
                            <div className="space-y-1.5 pt-0.5">
                              {q.options?.map((opt, oIdx) => (
                                <label
                                  key={oIdx}
                                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition cursor-pointer ${
                                    standardAnswers[q.id] === opt
                                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-medium'
                                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`q_${q.id}`}
                                    value={opt}
                                    checked={standardAnswers[q.id] === opt}
                                    onChange={() =>
                                      setStandardAnswers({ ...standardAnswers, [q.id]: opt })
                                    }
                                    className="text-blue-600"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {q.type === 'yes_no' && (
                            <div className="flex gap-2 pt-0.5">
                              {q.options?.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() =>
                                    setStandardAnswers({ ...standardAnswers, [q.id]: opt })
                                  }
                                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition cursor-pointer ${
                                    standardAnswers[q.id] === opt
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}

                          {errors[q.id] && (
                            <span className="text-[11px] text-red-600 block">{errors[q.id]}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="submit"
                        style={{ backgroundColor: primaryColor }}
                        className="rounded-lg px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition cursor-pointer"
                      >
                        {form.settings.submitLabel || 'Submit Form'}
                      </button>
                      <span className="text-[10px] text-slate-400">Preview Mode — No real submission</span>
                    </div>
                  </form>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Form Submitted (Simulation)</h2>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      {form.settings.completionMessage || 'Thank you! Your response has been submitted.'}
                    </p>
                    <button
                      onClick={() => {
                        setStandardAnswers({});
                        setIsSubmitted(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restart Preview
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. CHATBOT WIDGET PREVIEW */}
            {layoutMode === 'chatbot' && (
              <div className="flex flex-col h-[480px]">
                {/* Chat Widget Header */}
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="rounded-t-xl px-4 py-3 flex items-center justify-between text-white shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-xs font-bold">{form.title}</span>
                  </div>
                  <button
                    onClick={() => initChatbot(form)}
                    className="text-white/80 hover:text-white transition cursor-pointer"
                    title="Restart chat"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Question progress bar */}
                <div className="bg-slate-100 px-4 py-1.5 text-[10px] text-slate-500 flex items-center justify-between border-b border-slate-200 shrink-0">
                  <span>
                    Question {Math.min(chatStep + 1, form.questions.length)} of {form.questions.length}
                  </span>
                  {chatStep > 0 && !chatFinished && (
                    <button
                      onClick={handleChatPrev}
                      className="text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                    >
                      <ChevronLeft className="h-3 w-3" /> Back
                    </button>
                  )}
                </div>

                {/* Chat Message Stream */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/40">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-2xs'
                        }`}
                        style={{
                          backgroundColor: msg.sender === 'user' ? primaryColor : undefined,
                        }}
                      >
                        {msg.text}
                      </div>

                      {/* Interactive Buttons for Options */}
                      {msg.options && !chatFinished && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {msg.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => handleChatAnswer(opt)}
                              className="rounded border border-blue-200 bg-white px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chat Input Field (active if text/email or finished) */}
                <div className="p-2.5 border-t border-slate-200 bg-white shrink-0">
                  {!chatFinished ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleChatAnswer(chatInput);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        style={{ backgroundColor: primaryColor }}
                        className="h-8 w-8 flex items-center justify-center rounded-md text-white hover:opacity-90 transition cursor-pointer shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-1">
                      <button
                        onClick={() => initChatbot(form)}
                        className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Start Conversation Over
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
