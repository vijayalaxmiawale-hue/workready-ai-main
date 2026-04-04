import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ResponseTone = "Professional" | "Passive" | "Aggressive" | "Casual";

type Feedback = {
  tone: ResponseTone;
  label: string;
  consequence: string;
  grade: "A" | "B" | "C" | "D" | "F";
};

const gradeStyles: Record<Feedback["grade"], string> = {
  A: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  B: "bg-green-500/15 text-green-700 dark:text-green-300",
  C: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  D: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  F: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export default function BranchingNarrative() {
  const feedbackOptions = useMemo<Feedback[]>(
    () => [
      {
        tone: "Professional",
        label: "Professional: acknowledge + propose next step",
        grade: "A",
        consequence:
          "You come across as accountable and solutions-oriented. You protect trust by being clear on status and offering a concrete plan, which strengthens your reliability and leadership signal.",
      },
      {
        tone: "Passive",
        label: "Passive: vague agreement without clarity",
        grade: "C",
        consequence:
          "You avoid immediate conflict, but you create uncertainty. This can quietly damage confidence because stakeholders can’t tell what will happen next or when they should expect an update.",
      },
      {
        tone: "Aggressive",
        label: "Aggressive: blame the request or push back sharply",
        grade: "D",
        consequence:
          "You may defend your workload, but you risk being perceived as difficult to work with. Even if the concern is valid, the tone can reduce willingness to collaborate and escalate tensions.",
      },
      {
        tone: "Casual",
        label: "Casual: overly informal reassurance",
        grade: "B",
        consequence:
          "You keep things friendly, but you can sound less dependable in high-stakes moments. A little more specificity (ETA, risks, options) would better protect your professional credibility.",
      },
    ],
    []
  );

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Feedback | null>(null);

  const prompt = {
    speaker: "Manager" as const,
    message:
      "I need the report for today's leadership meeting in 30 minutes. Can you send the final version now?",
  };

  return (
    <DashboardLayout
      title="Branching Narrative"
      subtitle="Choose a response and see the consequence"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left side: character + prompt */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Situation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-xl border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                  Portrait
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {prompt.speaker}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      Urgent request
                    </span>
                  </div>
                  <div className="mt-2 rounded-2xl rounded-tl-md border bg-card/80 p-4">
                    <p className="text-sm leading-relaxed">{prompt.message}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Pick a response style on the right. You’ll get immediate feedback
                  on how the choice impacts your professional reputation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right side: response buttons */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedbackOptions.map((opt) => (
                <Button
                  key={opt.tone}
                  variant="outline"
                  className="w-full justify-between h-auto py-3 px-4 whitespace-normal"
                  onClick={() => {
                    setSelected(opt);
                    setOpen(true);
                  }}
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold">{opt.tone}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {opt.label}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 ml-3 inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold",
                      gradeStyles[opt.grade]
                    )}
                    aria-label={`Grade ${opt.grade}`}
                  >
                    {opt.grade}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback</DialogTitle>
            <DialogDescription>
              {selected
                ? "Here’s what this choice signals in a professional setting."
                : "Select a response to see feedback."}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{selected.tone}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selected.label}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold",
                    gradeStyles[selected.grade]
                  )}
                >
                  Grade: {selected.grade}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{selected.consequence}</p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

