'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formsApi, FormDefinition } from '@/lib/formStorage';
import { useToast } from '@/components/Toast';
import {
  ChevronDown,
  FileText,
  MessageSquare,
  Plus,
} from 'lucide-react';

interface CreationOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  createData: () => Partial<FormDefinition>;
}

export default function CreateFormMenu({ className = '' }: { className?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Exactly two clear, simple creation options
  const options: CreationOption[] = [
    {
      id: 'standard',
      title: 'Standard Form',
      description: 'Traditional clean form layout displaying questions on a single page',
      icon: FileText,
      createData: () => ({
        title: 'Untitled Form',
        description: 'Please complete the questions below.',
        status: 'draft',
        questions: [
          {
            id: `q_${Date.now()}_1`,
            type: 'text',
            label: 'What is your full name?',
            placeholder: 'e.g. John Doe',
            required: true,
            order: 1,
          },
          {
            id: `q_${Date.now()}_2`,
            type: 'email',
            label: 'What is your email address?',
            placeholder: 'john@example.com',
            required: true,
            order: 2,
          },
        ],
        settings: {
          welcomeMessage: 'Welcome! Please answer the questions below.',
          completionMessage: 'Thank you! Your submission has been recorded.',
          primaryColor: '#2563eb',
          submitLabel: 'Submit Form',
          enableLiveChat: false,
          defaultLayout: 'standard',
        },
      }),
    },
    {
      id: 'live_chat',
      title: 'Interactive Live Chat Form',
      description: 'Conversational chatbot widget that guides visitors step-by-step',
      icon: MessageSquare,
      tag: 'Live Chat',
      createData: () => ({
        title: 'Conversational Chatbot Form',
        description: 'Interactive assistant collecting visitor information.',
        status: 'draft',
        questions: [
          {
            id: `q_${Date.now()}_1`,
            type: 'text',
            label: 'What is your full name?',
            placeholder: 'Type your name...',
            required: true,
            order: 1,
          },
          {
            id: `q_${Date.now()}_2`,
            type: 'email',
            label: 'What is your best email address?',
            placeholder: 'you@domain.com',
            required: true,
            order: 2,
          },
        ],
        settings: {
          welcomeMessage: 'Hello! I am your interactive assistant. Let us get started!',
          completionMessage: 'Awesome! Your response has been received.',
          primaryColor: '#2563eb',
          submitLabel: 'Complete Chat',
          enableLiveChat: true,
          defaultLayout: 'chatbot',
        },
      }),
    },
  ];

  const handleSelectOption = async (option: CreationOption) => {
    if (isCreating) return;
    setIsOpen(false);
    setIsCreating(true);
    try {
      const payload = option.createData();
      const newForm = await formsApi.createForm(payload);
      showToast(`Created "${newForm.title}"`, 'success');
      router.push(`/dashboard/forms/${newForm.id}/edit`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create form via backend API', 'error');
      setIsCreating(false);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Primary Action Button */}
      <div className="inline-flex rounded-lg shadow-xs">
        <button
          type="button"
          disabled={isCreating}
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>{isCreating ? 'Creating...' : 'Create Form'}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 2-Option Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 sm:w-80 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Choose Form Type
            </p>
          </div>

          <div className="space-y-1">
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt)}
                  className="w-full flex items-start gap-3 rounded-lg p-2.5 text-left hover:bg-blue-50/70 transition group cursor-pointer"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                        {opt.title}
                      </p>
                      {opt.tag && (
                        <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase">
                          {opt.tag}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
