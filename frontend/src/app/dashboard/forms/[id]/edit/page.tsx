'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import FormBuilder from '@/components/FormBuilder';

export default function EditFormPage() {
  const params = useParams();
  const formId = params?.id as string | undefined;

  if (!formId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Loading form editor...</span>
        </div>
      </div>
    );
  }

  return <FormBuilder initialFormId={formId} />;
}
