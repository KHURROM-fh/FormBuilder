'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Database,
  Eye,
  FileText,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  Smartphone,
} from 'lucide-react';

export default function FeaturesPage() {
  const featureGroups = [
    {
      category: '1. Form Builder Engine',
      items: [
        {
          title: 'Multiple Question Types',
          description: 'Build forms with Text, Email, Multiple Choice (radio/checkboxes), and Yes/No boolean questions.',
          icon: Layers,
        },
        {
          title: 'Required Question Validation',
          description: 'Mark specific questions as mandatory with built-in client and server-side validation checks.',
          icon: CheckCircle2,
        },
        {
          title: 'Question Reordering & Editing',
          description: 'Move questions up and down, edit prompt text, update options, or delete unwanted questions anytime.',
          icon: FileText,
        },
        {
          title: 'Real-Time Form Preview',
          description: 'Preview exactly how your form or chatbot widget will look and behave before publishing live.',
          icon: Eye,
        },
      ],
    },
    {
      category: '2. Conversational Chatbot Widget',
      items: [
        {
          title: 'One-Question-at-a-Time Interface',
          description: 'Present questions sequentially in a friendly chat interface that keeps respondents focused and engaged.',
          icon: MessageSquare,
        },
        {
          title: 'Interactive Answer Buttons',
          description: 'Multiple choice and Yes/No questions render as tap-friendly buttons for lightning-fast mobile replies.',
          icon: Bot,
        },
        {
          title: 'Brand Theme Customization',
          description: 'Customize header colors, welcome message, and completion confirmation text to match your site.',
          icon: Globe,
        },
        {
          title: 'Responsive Desktop & Mobile Widget',
          description: 'Floats smoothly in the bottom corner on desktops and expands into an accessible drawer on mobile devices.',
          icon: Smartphone,
        },
      ],
    },
    {
      category: '3. Responses & Publishing',
      items: [
        {
          title: 'Unique Public URLs',
          description: 'Generate an instant standalone link for every form that can be shared via email, social media, or QR code.',
          icon: Globe,
        },
        {
          title: '1-Line JavaScript Embed Snippet',
          description: 'Embed your floating chatbot widget into any external HTML, Webflow, WordPress, or React website.',
          icon: Code2,
        },
        {
          title: 'Database-Backed Response Logs',
          description: 'Every submission is saved to a PostgreSQL database with submission timestamps and structured answers.',
          icon: Database,
        },
        {
          title: 'Publish / Unpublish Control',
          description: 'Toggle form availability on or off anytime with a single click right from your dashboard.',
          icon: Lock,
        },
      ],
    },
  ];

  return (
    <div className="bg-white">
      {/* Page Header */}
      <section className="border-b border-slate-200 py-16 sm:py-20 bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          {/* <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 mb-4">
            Capabilities
          </span> */}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Platform Features & Specifications
          </h1>
          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need to create interactive forms, embed chatbot widgets, and manage submissions with clean structural reliability.
          </p>
        </div>
      </section>

      {/* Feature Groups */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-16">
          {featureGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">
                {group.category}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-300 transition"
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-slate-200 py-16 bg-slate-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Ready to explore the dashboard?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign up now and create your first interactive form in under two minutes.
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
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
