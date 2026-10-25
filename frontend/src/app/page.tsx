'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  FileText,
  Globe,
  Layers,
  MessageSquare,
  Send,
  Sliders,
} from 'lucide-react';

export default function HomePage() {
  // Live interactive chatbot demo state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; options?: string[] }>>([
    {
      sender: 'bot',
      text: 'Hello! Welcome to FormBuilder. What kind of feedback or data are you looking to collect?',
      options: ['Customer Feedback', 'Lead Generation', 'Event RSVP', 'Other'],
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [step, setStep] = useState(1);

  const handleSendChat = (text: string) => {
    if (!text.trim()) return;

    const userText = text.trim();
    setInputVal('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);

    // Simulated structural response
    setTimeout(() => {
      if (step === 1) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `Great choice! How would you prefer to display this form to your audience?`,
            options: ['Embed as Chatbot Widget', 'Share Public URL Link'],
          },
        ]);
        setStep(2);
      } else if (step === 2) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `Perfect. Would you like to collect email addresses for notifications on new submissions?`,
            options: ['Yes, definitely', 'No, keep it anonymous'],
          },
        ]);
        setStep(3);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'Thank you! Your responses have been recorded in the dashboard. Try creating your own form below!',
          },
        ]);
        setStep(4);
      }
    }, 500);
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="border-b border-slate-200 py-20 sm:py-24 bg-slate-50/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          {/* <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-6">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            Interactive Form & Chatbot Platform
          </span> */}

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-tight">
            Build Interactive Forms & Embed Chatbot Widgets
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Create multi-question forms in minutes, embed responsive chatbot widgets on any website with a single JavaScript snippet, and manage submissions in a clean dashboard.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {/* Live Interactive Chatbot Widget Demo Container */}
        <div className="mt-14 mx-auto max-w-lg px-4 sm:px-0">
          <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
            {/* Widget Top Header */}
            <div className="bg-blue-600 px-4 py-3.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold leading-none">Form Assistant Widget</h3>
                  <span className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online Preview
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-medium bg-blue-700/60 px-2 py-0.5 rounded border border-blue-500/30">
                Live Demo
              </span>
            </div>

            {/* Chat Conversation History */}
            <div className="p-4 h-72 overflow-y-auto space-y-3 bg-slate-50/50">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                  >
                    {msg.text}
                  </div>

                  {/* Interactive Option Buttons if present */}
                  {msg.options && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => handleSendChat(opt)}
                          className="rounded-md border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat(inputVal);
              }}
              className="border-t border-slate-200 p-2.5 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shrink-0"
                title="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
          <p className="mt-2.5 text-center text-xs text-slate-500">
            Click any button above or type to test the conversational chatbot widget interface.
          </p>
        </div>
      </section>

      {/* Structural Overview Grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Core Capabilities
            </h2>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Clean, structural tools for your data collection
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1 */}
            <div className="rounded-xl border border-slate-200 p-6 hover:border-blue-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Form Builder</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Add text, email, multiple-choice, and yes/no questions. Easily reorder, edit required constraints, and preview live.
              </p>
            </div>

            {/* Column 2 */}
            <div className="rounded-xl border border-slate-200 p-6 hover:border-blue-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Chatbot Widget</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Embed a conversational floating widget with one JavaScript snippet. Works smoothly across both desktop and mobile.
              </p>
            </div>

            {/* Column 3 */}
            <div className="rounded-xl border border-slate-200 p-6 hover:border-blue-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
                <Sliders className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Responses Dashboard</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Inspect submission logs, timestamps, and answer breakdowns. Publish or unpublish forms whenever needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span>FormBuilder</span>
          </div>

          <p className="text-xs text-slate-500">
            &copy; 2026 FormBuilder. Interactive Forms & Chatbot Widget Platform.
          </p>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <Link href="/how-it-works" className="hover:text-blue-600 transition">How It Works</Link>
            <Link href="/features" className="hover:text-blue-600 transition">Features</Link>
            <Link href="/dashboard" className="hover:text-blue-600 transition">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
