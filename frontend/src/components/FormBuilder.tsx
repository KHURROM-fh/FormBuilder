'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  formsApi,
  FormDefinition,
  FormQuestion,
  QuestionType,
} from '@/lib/formStorage';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  Mail,
  ListFilter,
  ToggleLeft,
  Trash2,
  Plus,
  Save,
  Globe,
  Settings,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface FormBuilderProps {
  initialFormId?: string;
}

export default function FormBuilder({ initialFormId }: FormBuilderProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormDefinition | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved'>('saved');
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'question' | 'form'>('question');
  const [mobilePanel, setMobilePanel] = useState<'canvas' | 'types' | 'settings'>('canvas');

  // Load form from backend API
  useEffect(() => {
    let isMounted = true;
    if (!initialFormId) return;

    const loadForm = async () => {
      try {
        const existing = await formsApi.getFormById(initialFormId);
        if (existing && isMounted) {
          setForm(existing);
          if (existing.questions && existing.questions.length > 0) {
            setSelectedQuestionId(existing.questions[0].id);
          }
        } else if (isMounted) {
          showToast('Form not found', 'error');
          router.push('/dashboard/forms');
        }
      } catch (err: unknown) {
        if (isMounted) {
          showToast(err instanceof Error ? err.message : 'Error loading form', 'error');
        }
      }
    };

    loadForm();
    return () => {
      isMounted = false;
    };
  }, [initialFormId, router, showToast]);

  // Auto-save form changes to backend API
  const handleUpdateForm = async (updates: Partial<FormDefinition>) => {
    if (!form) return;
    const updated = { ...form, ...updates, updatedAt: new Date().toISOString() };
    setForm(updated);
    setSaveStatus('unsaved');

    try {
      await formsApi.updateForm(form.id, updates);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    }
  };

  // Add a new question of specified type
  const handleAddQuestion = (type: QuestionType) => {
    if (!form) return;

    const newId = `q_${Date.now()}_${form.questions.length + 1}`;
    let defaultLabel = 'Question label';
    let defaultPlaceholder = 'Your answer here';
    let defaultOptions: string[] | undefined = undefined;

    if (type === 'text') {
      defaultLabel = 'What is your answer?';
      defaultPlaceholder = 'Enter text here';
    } else if (type === 'email') {
      defaultLabel = 'What is your email address?';
      defaultPlaceholder = 'name@example.com';
    } else if (type === 'multiple_choice') {
      defaultLabel = 'Please select one option:';
      defaultOptions = ['Option 1', 'Option 2', 'Option 3'];
    } else if (type === 'yes_no') {
      defaultLabel = 'Do you agree?';
      defaultOptions = ['Yes', 'No'];
    }

    const newQuestion: FormQuestion = {
      id: newId,
      type,
      label: defaultLabel,
      placeholder: defaultPlaceholder,
      required: true,
      options: defaultOptions,
      order: form.questions.length + 1,
    };

    const newQuestions = [...form.questions, newQuestion];
    handleUpdateForm({ questions: newQuestions });
    setSelectedQuestionId(newId);
    setActiveTab('question');
    setMobilePanel('canvas');
    showToast(`Added ${type.replace('_', ' ')} question`, 'info');
  };

  // Update specific question field
  const handleUpdateQuestion = (qId: string, updates: Partial<FormQuestion>) => {
    if (!form) return;
    const newQuestions = form.questions.map((q) => (q.id === qId ? { ...q, ...updates } : q));
    handleUpdateForm({ questions: newQuestions });
  };

  // Reorder question up or down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!form) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= form.questions.length) return;

    const newQuestions = [...form.questions];
    const [moved] = newQuestions.splice(index, 1);
    newQuestions.splice(targetIndex, 0, moved);

    // Reassign order indices
    const reordered = newQuestions.map((q, idx) => ({ ...q, order: idx + 1 }));
    handleUpdateForm({ questions: reordered });
  };

  // Duplicate question
  const handleDuplicateQuestion = (qId: string) => {
    if (!form) return;
    const index = form.questions.findIndex((q) => q.id === qId);
    if (index === -1) return;

    const source = form.questions[index];
    const copyId = `q_${Date.now()}`;
    const duplicated: FormQuestion = {
      ...source,
      id: copyId,
      label: `${source.label} (Copy)`,
      options: source.options ? [...source.options] : undefined,
      order: index + 2,
    };

    const newQuestions = [...form.questions];
    newQuestions.splice(index + 1, 0, duplicated);
    const reordered = newQuestions.map((q, idx) => ({ ...q, order: idx + 1 }));

    handleUpdateForm({ questions: reordered });
    setSelectedQuestionId(copyId);
    showToast('Question duplicated', 'success');
  };

  // Confirm delete question
  const confirmDeleteQuestion = () => {
    if (!form || !deleteQuestionId) return;

    const newQuestions = form.questions.filter((q) => q.id !== deleteQuestionId);
    const reordered = newQuestions.map((q, idx) => ({ ...q, order: idx + 1 }));
    handleUpdateForm({ questions: reordered });

    if (selectedQuestionId === deleteQuestionId) {
      setSelectedQuestionId(reordered.length > 0 ? reordered[0].id : null);
    }
    setDeleteQuestionId(null);
    showToast('Question removed', 'info');
  };

  // Publish form
  const handlePublish = async () => {
    if (!form) return;
    try {
      const published = await formsApi.publishForm(form.id);
      if (published) {
        setForm(published);
        showToast('Form published successfully!', 'success');
        router.push(`/dashboard/forms/${form.id}/share`);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not publish form', 'error');
    }
  };

  if (!form) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-xs text-slate-500">
        Loading Form Builder...
      </div>
    );
  }

  const selectedQuestion = form.questions.find((q) => q.id === selectedQuestionId) || null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-white">
      {/* Top Builder Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4 bg-white z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/forms"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Forms</span>
          </Link>

          <span className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Form Title & Saved Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[200px] sm:max-w-xs">
              {form.title || 'Untitled Form'}
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                saveStatus === 'saved'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {saveStatus === 'saved' ? 'Saved' : 'Saving...'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Panel Switcher */}
          <div className="flex md:hidden rounded-md border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
            <button
              onClick={() => setMobilePanel('types')}
              className={`px-2 py-1 rounded ${mobilePanel === 'types' ? 'bg-white font-bold text-blue-600' : 'text-slate-600'}`}
            >
              Add
            </button>
            <button
              onClick={() => setMobilePanel('canvas')}
              className={`px-2 py-1 rounded ${mobilePanel === 'canvas' ? 'bg-white font-bold text-blue-600' : 'text-slate-600'}`}
            >
              Canvas
            </button>
            <button
              onClick={() => setMobilePanel('settings')}
              className={`px-2 py-1 rounded ${mobilePanel === 'settings' ? 'bg-white font-bold text-blue-600' : 'text-slate-600'}`}
            >
              Settings
            </button>
          </div>

          <Link
            href={`/dashboard/forms/${form.id}/preview`}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Link>

          <button
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{form.status === 'published' ? 'Published' : 'Publish Form'}</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Question Types (Desktop always, Mobile conditional) */}
        <div
          className={`${
            mobilePanel === 'types' ? 'block' : 'hidden'
          } md:block w-full md:w-64 border-r border-slate-200 bg-slate-50/50 p-4 overflow-y-auto shrink-0`}
        >
          <div className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add Questions</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Click to add a question to your form</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleAddQuestion('text')}
              className="w-full flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:shadow-2xs transition cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Short Text</h3>
                <p className="text-[10px] text-slate-500">Names, thoughts, open text</p>
              </div>
            </button>

            <button
              onClick={() => handleAddQuestion('email')}
              className="w-full flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:shadow-2xs transition cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Email Address</h3>
                <p className="text-[10px] text-slate-500">Validated email contact</p>
              </div>
            </button>

            <button
              onClick={() => handleAddQuestion('multiple_choice')}
              className="w-full flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:shadow-2xs transition cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <ListFilter className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Multiple Choice</h3>
                <p className="text-[10px] text-slate-500">Selectable answer options</p>
              </div>
            </button>

            <button
              onClick={() => handleAddQuestion('yes_no')}
              className="w-full flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:shadow-2xs transition cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <ToggleLeft className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Yes / No</h3>
                <p className="text-[10px] text-slate-500">Binary decision boolean</p>
              </div>
            </button>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4">
            <span className="text-[11px] font-semibold text-slate-500">Summary</span>
            <div className="mt-2 text-[11px] text-slate-600 space-y-1">
              <div>Total Questions: <strong>{form.questions.length}</strong></div>
              <div>Required: <strong>{form.questions.filter((q) => q.required).length}</strong></div>
              <div>Status: <strong className="capitalize">{form.status}</strong></div>
            </div>
          </div>
        </div>

        {/* Center Panel: Live Form Canvas Editor */}
        <div
          className={`${
            mobilePanel === 'canvas' ? 'block' : 'hidden'
          } md:block flex-1 bg-white p-6 md:p-8 overflow-y-auto`}
        >
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Form Title & Description Inline Editor */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleUpdateForm({ title: e.target.value })}
                placeholder="Form Title..."
                className="w-full text-xl font-extrabold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none pb-1 transition"
              />
              <textarea
                value={form.description}
                onChange={(e) => handleUpdateForm({ description: e.target.value })}
                placeholder="Add a form description or instructions for respondents..."
                rows={2}
                className="w-full text-xs text-slate-600 resize-none border border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none p-1 rounded transition"
              />
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {form.questions.map((question, index) => {
                const isSelected = selectedQuestionId === question.id;

                return (
                  <div
                    key={question.id}
                    onClick={() => {
                      setSelectedQuestionId(question.id);
                      setActiveTab('question');
                    }}
                    className={`rounded-xl border p-5 transition cursor-pointer relative bg-white ${
                      isSelected
                        ? 'border-blue-600 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Question Header & Order Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                          {index + 1}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                          {question.type.replace('_', ' ')}
                        </span>
                        {question.required ? (
                          <span className="text-[10px] text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded">
                            * Required
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Optional</span>
                        )}
                      </div>

                      {/* Question Actions */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleMoveQuestion(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(index, 'down')}
                          disabled={index === form.questions.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateQuestion(question.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteQuestionId(question.id)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Content Inline Preview */}
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={question.label}
                        onChange={(e) => handleUpdateQuestion(question.id, { label: e.target.value })}
                        placeholder="Type question text..."
                        className="w-full text-xs font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none pb-1"
                      />

                      {/* Render based on Question Type */}
                      {question.type === 'text' && (
                        <input
                          type="text"
                          disabled
                          placeholder={question.placeholder || 'Text answer placeholder'}
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400"
                        />
                      )}

                      {question.type === 'email' && (
                        <input
                          type="email"
                          disabled
                          placeholder={question.placeholder || 'Email placeholder'}
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400"
                        />
                      )}

                      {question.type === 'multiple_choice' && (
                        <div className="space-y-1.5 pt-1">
                          {question.options?.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="h-3 w-3 rounded-full border border-slate-300 shrink-0" />
                              <span className="text-slate-800">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === 'yes_no' && (
                        <div className="flex gap-2 pt-1">
                          {question.options?.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Button at bottom of questions */}
            <div className="text-center pt-2">
              <button
                onClick={() => handleAddQuestion('text')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-blue-500 hover:text-blue-600 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Question & Form Settings */}
        <div
          className={`${
            mobilePanel === 'settings' ? 'block' : 'hidden'
          } md:block w-full md:w-80 border-l border-slate-200 bg-white p-5 overflow-y-auto shrink-0`}
        >
          {/* Tab Buttons: Question Settings vs Form Settings */}
          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs mb-5">
            <button
              onClick={() => setActiveTab('question')}
              className={`flex-1 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'question'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Question Settings
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form Settings
            </button>
          </div>

          {/* Tab 1: Question Settings */}
          {activeTab === 'question' && (
            <div className="space-y-4">
              {selectedQuestion ? (
                <>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Selected: {selectedQuestion.type.replace('_', ' ')}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                      Edit Question
                    </h2>
                  </div>

                  {/* Question Label */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="q-label">
                      Question Prompt *
                    </label>
                    <input
                      id="q-label"
                      type="text"
                      value={selectedQuestion.label}
                      onChange={(e) => handleUpdateQuestion(selectedQuestion.id, { label: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Placeholder for Text/Email */}
                  {(selectedQuestion.type === 'text' || selectedQuestion.type === 'email') && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="q-placeholder">
                        Input Placeholder
                      </label>
                      <input
                        id="q-placeholder"
                        type="text"
                        value={selectedQuestion.placeholder || ''}
                        onChange={(e) => handleUpdateQuestion(selectedQuestion.id, { placeholder: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}

                  {/* Required Switch */}
                  <div className="flex items-center justify-between border-t border-b border-slate-100 py-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-800">Required Question</span>
                      <p className="text-[10px] text-slate-400">Must be answered before submitting</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuestion(selectedQuestion.id, { required: !selectedQuestion.required })}
                      className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                        selectedQuestion.required ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform transform mt-0.5 ml-0.5 ${
                          selectedQuestion.required ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Multiple Choice Options Configuration */}
                  {selectedQuestion.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Answer Options
                      </label>
                      <div className="space-y-1.5">
                        {selectedQuestion.options?.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(selectedQuestion.options || [])];
                                newOpts[oIdx] = e.target.value;
                                handleUpdateQuestion(selectedQuestion.id, { options: newOpts });
                              }}
                              className="flex-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                            />
                            <button
                              onClick={() => {
                                const newOpts = (selectedQuestion.options || []).filter((_, idx) => idx !== oIdx);
                                handleUpdateQuestion(selectedQuestion.id, { options: newOpts });
                              }}
                              disabled={(selectedQuestion.options || []).length <= 2}
                              className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-20 cursor-pointer"
                              title="Delete option"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = [
                            ...(selectedQuestion.options || []),
                            `Option ${(selectedQuestion.options || []).length + 1}`,
                          ];
                          handleUpdateQuestion(selectedQuestion.id, { options: newOpts });
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Option
                      </button>
                    </div>
                  )}

                  {/* Yes / No Choices Configuration */}
                  {selectedQuestion.type === 'yes_no' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Button Choices
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Yes Label</span>
                          <input
                            type="text"
                            value={selectedQuestion.options?.[0] || 'Yes'}
                            onChange={(e) => {
                              const newOpts = [e.target.value, selectedQuestion.options?.[1] || 'No'];
                              handleUpdateQuestion(selectedQuestion.id, { options: newOpts });
                            }}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">No Label</span>
                          <input
                            type="text"
                            value={selectedQuestion.options?.[1] || 'No'}
                            onChange={(e) => {
                              const newOpts = [selectedQuestion.options?.[0] || 'Yes', e.target.value];
                              handleUpdateQuestion(selectedQuestion.id, { options: newOpts });
                            }}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">
                  Select a question in the canvas to edit its settings.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Form Settings */}
          {activeTab === 'form' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Form & Widget Settings
              </h2>

              {/* Welcome Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="welcome-msg">
                  Welcome Message
                </label>
                <textarea
                  id="welcome-msg"
                  value={form.settings.welcomeMessage}
                  onChange={(e) =>
                    handleUpdateForm({
                      settings: { ...form.settings, welcomeMessage: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Completion Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="comp-msg">
                  Completion Message
                </label>
                <textarea
                  id="comp-msg"
                  value={form.settings.completionMessage}
                  onChange={(e) =>
                    handleUpdateForm({
                      settings: { ...form.settings, completionMessage: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Submit Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="submit-lbl">
                  Submit Button Label
                </label>
                <input
                  id="submit-lbl"
                  type="text"
                  value={form.settings.submitLabel}
                  onChange={(e) =>
                    handleUpdateForm({
                      settings: { ...form.settings, submitLabel: e.target.value },
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Primary Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {['#2563eb', '#0284c7', '#059669', '#7c3aed', '#ea580c'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        handleUpdateForm({
                          settings: { ...form.settings, primaryColor: color },
                        })
                      }
                      style={{ backgroundColor: color }}
                      className={`h-6 w-6 rounded-full transition-transform cursor-pointer ${
                        form.settings.primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.settings.primaryColor}
                    onChange={(e) =>
                      handleUpdateForm({
                        settings: { ...form.settings, primaryColor: e.target.value },
                      })
                    }
                    className="h-6 w-7 rounded cursor-pointer border border-slate-300 p-0"
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Live Chat Feature Control */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="live-chat-toggle" className="text-xs font-bold text-slate-900 block cursor-pointer">
                      Live Chatbot Feature
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enable conversational chat widget for visitors
                    </p>
                  </div>
                  <input
                    id="live-chat-toggle"
                    type="checkbox"
                    checked={form.settings.enableLiveChat ?? true}
                    onChange={(e) =>
                      handleUpdateForm({
                        settings: { ...form.settings, enableLiveChat: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {(form.settings.enableLiveChat ?? true) && (
                  <div className="pt-2.5 border-t border-slate-200 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-700 block">
                      Default Presentation Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateForm({
                            settings: { ...form.settings, defaultLayout: 'standard' },
                          })
                        }
                        className={`py-1.5 px-2 rounded border text-center font-medium transition cursor-pointer ${
                          (form.settings.defaultLayout || 'standard') === 'standard'
                            ? 'border-blue-600 bg-white text-blue-700 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Standard Form
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateForm({
                            settings: { ...form.settings, defaultLayout: 'chatbot' },
                          })
                        }
                        className={`py-1.5 px-2 rounded border text-center font-medium transition cursor-pointer ${
                          form.settings.defaultLayout === 'chatbot'
                            ? 'border-blue-600 bg-white text-blue-700 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Live Chatbot
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Question Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteQuestionId)}
        title="Delete Question"
        message="Are you sure you want to delete this question? Any configured options will be lost."
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setDeleteQuestionId(null)}
      />
    </div>
  );
}
