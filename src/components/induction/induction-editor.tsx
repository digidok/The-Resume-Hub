"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveInductionModule,
  addInductionQuestion,
  updateInductionQuestion,
  deleteInductionQuestion,
} from "@/lib/induction/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import type { InductionModule, InductionQuestion } from "@/types/database";

function QuestionForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: InductionQuestion;
  onCancel: () => void;
  onSave: (question: string, options: string[], correctIndex: number) => Promise<void>;
}) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correct_option_index ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!question.trim() || options.some((o) => !o.trim())) {
      setError("Fill in the question and all 4 options.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(question, options, correctIndex);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div>
        <Label htmlFor="question">Question</Label>
        <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Options (select the correct one)</Label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              className="h-4 w-4 text-brand-600"
            />
            <Input
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[i] = e.target.value;
                setOptions(next);
              }}
              placeholder={`Option ${i + 1}`}
            />
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save question"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

export function InductionEditor({
  module,
  questions,
}: {
  module: InductionModule | null;
  questions: InductionQuestion[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(module?.title ?? "Company Induction");
  const [content, setContent] = useState(module?.content ?? "");
  const [passThreshold, setPassThreshold] = useState(module?.pass_threshold ?? 80);
  const [isPending, startTransition] = useTransition();
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [moduleSaved, setModuleSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function saveModule() {
    setModuleError(null);
    setModuleSaved(false);
    startTransition(async () => {
      const res = await saveInductionModule({ title, content, passThreshold });
      if (res.error) {
        setModuleError(res.error);
        return;
      }
      setModuleSaved(true);
      router.refresh();
      setTimeout(() => setModuleSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold text-slate-900">Module content</h2>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="content">Study material</Label>
          <Textarea
            id="content"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Company policies, systems overview, safety guidelines, culture — whatever new hires need to know."
          />
        </div>
        <div className="max-w-xs">
          <Label htmlFor="pass_threshold">Pass threshold (%)</Label>
          <Input
            id="pass_threshold"
            type="number"
            min={1}
            max={100}
            value={passThreshold}
            onChange={(e) => setPassThreshold(Number(e.target.value))}
          />
        </div>
        {moduleError && <p className="text-sm text-red-600">{moduleError}</p>}
        {moduleSaved && <p className="text-sm text-emerald-600">Saved.</p>}
        <Button onClick={saveModule} disabled={isPending}>
          {isPending ? "Saving…" : module ? "Save changes" : "Create module"}
        </Button>
      </Card>

      {module && (
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Quiz questions ({questions.length})
            </h2>
            {!adding && (
              <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
                + Add question
              </Button>
            )}
          </div>

          {adding && (
            <QuestionForm
              onCancel={() => setAdding(false)}
              onSave={async (question, options, correctIndex) => {
                await addInductionQuestion({
                  moduleId: module.id,
                  question,
                  options,
                  correctOptionIndex: correctIndex,
                  position: questions.length,
                });
                setAdding(false);
                router.refresh();
              }}
            />
          )}

          {questions.length === 0 && !adding && (
            <p className="text-sm text-slate-500">
              No questions yet — candidates can&apos;t pass the induction until you add at least
              one.
            </p>
          )}

          <div className="space-y-3">
            {questions.map((q) =>
              editingId === q.id ? (
                <QuestionForm
                  key={q.id}
                  initial={q}
                  onCancel={() => setEditingId(null)}
                  onSave={async (question, options, correctIndex) => {
                    await updateInductionQuestion({
                      questionId: q.id,
                      question,
                      options,
                      correctOptionIndex: correctIndex,
                    });
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              ) : (
                <div key={q.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{q.question}</p>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(q.id)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await deleteInductionQuestion(q.id);
                          router.refresh();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {q.options.map((opt, i) => (
                      <li
                        key={i}
                        className={
                          i === q.correct_option_index
                            ? "font-medium text-emerald-700"
                            : "text-slate-500"
                        }
                      >
                        {i === q.correct_option_index ? "✓ " : "— "}
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
