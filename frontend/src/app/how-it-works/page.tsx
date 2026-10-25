'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Globe,
  Layers,
  MessageSquare,
  Sliders,
} from 'lucide-react';

import { copyToClipboard } from '@/lib/clipboard';

export default function HowItWorksPage() {
  const [copied, setCopied] = useState(false);

  const sampleSnippet = `<script
  src="https://formbuilder.app/widget.js"
  data-form-id="form_8f93a102"
  defer>
</script>`;

  const handleCopy = async () => {
    const success = await copyToClipboard(sampleSnippet);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = [
    {
      number: '01',
      title: 'Create Your Form & Questions',
      description: 'Add and configure any combination of question types in seconds: short text, email, multiple-choice options, and yes/no switches.',
      icon: Layers,
      details: [
        'Select required fields to ensure complete submissions',
        'Reorder questions easily with intuitive controls',
        'Customize welcome and completion messages',
      ],
    },
    {
      number: '02',
      title: 'Choose Chatbot or Direct Form Mode',
      description: 'Deliver questions either as a conventional clean web form or as a step-by-step conversational chatbot widget.',
      icon: MessageSquare,
      details: [
        'Chatbot presents one question at a time to reduce cognitive load',
        'Interactive answer buttons for quick mobile replies',
        'Customizable brand colors to match your existing website theme',
      ],
    },
    {
      number: '03',
      title: 'Embed or Share Publicly',
      description: 'Every form comes with a unique public URL and a lightweight embed snippet ready for any external website.',
      icon: Code2,
      details: [
        'Works with WordPress, Webflow, Shopify, React, and plain HTML',
        'Responsive floating widget sits quietly in the bottom-right corner',
        'Instant updates: changes in your dashboard reflect on your live widget',
      ],
    },
    {
      number: '04',
      title: 'Manage Submissions in Dashboard',
      description: 'Submissions are stored securely in a PostgreSQL database with timestamps and individual response breakdowns.',
      icon: Sliders,
      details: [
        'Monitor total forms and submission volume at a glance',
        'Publish or unpublish forms whenever you want with 1 click',
        'Inspect full submission records and answer histories',
      ],
    },
  ];

  return (
    <div className="bg-white">
      {/* Page Header */}
      <section className="border-b border-slate-200 py-16 sm:py-20 bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          {/* <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 mb-4">
            Workflow Guide
          </span> */}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How FormBuilder Works
          </h1>
          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From drafting questions to embedding an interactive chatbot on your website, our structural platform makes form creation straightforward and reliable.
          </p>
        </div>
      </section>

      {/* Steps List */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start rounded-2xl border border-slate-200 p-6 sm:p-8 hover:border-blue-200 transition"
              >
                {/* Left Number & Icon */}
                <div className="md:col-span-4 flex items-center md:items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-xs">
                    {step.number}
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Step {idx + 1}</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{step.title}</h2>
                  </div>
                </div>

                {/* Right Details */}
                <div className="md:col-span-8 space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="space-y-2 pt-2 border-t border-slate-100">
                    {step.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-center gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Embed Code Example Section */}
      <section className="border-t border-slate-200 py-16 bg-slate-50/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              One-Line Embed Snippet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Copy and paste this snippet right before the closing <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag on any website.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-blue-400" />
                HTML Embed Code
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-blue-200 overflow-x-auto leading-relaxed">
              {sampleSnippet}
            </pre>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-slate-200 py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Start Building Your Forms Today
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Create an account in 30 seconds. No complicated setups or credit card required.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
