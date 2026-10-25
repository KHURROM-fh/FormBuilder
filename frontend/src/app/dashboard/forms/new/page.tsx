'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formsApi } from '@/lib/formStorage';
import { useToast } from '@/components/Toast';

export default function NewFormPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const hasCreated = useRef(false);

  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;

    async function createAndRedirect() {
      try {
        const newForm = await formsApi.createForm({
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
        });
        router.replace(`/dashboard/forms/${newForm.id}/edit`);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to create form', 'error');
        router.push('/dashboard/forms');
      }
    }

    createAndRedirect();
  }, [router, showToast]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span>Creating your form...</span>
      </div>
    </div>
  );
}
