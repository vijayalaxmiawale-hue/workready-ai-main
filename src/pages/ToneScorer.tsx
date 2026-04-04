import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Emotion =
  | "Confident"
  | "Apologetic"
  | "Demanding"
  | "Frustrated"
  | "Collaborative"
  | "Uncertain"
  | "Friendly";

type Analysis = {
  professionalism: number; // 0-100
  emotions: Emotion[];
  suggestion: string;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function analyzeTone(inputRaw: string): Analysis {
  const input = inputRaw.trim();
  if (!input) {
    return {
      professionalism: 0,
      emotions: [],
      suggestion: "",
    };
  }

  const lower = input.toLowerCase();

  let score = 75;
  const emotions: Emotion[] = [];

  // Signals (very lightweight heuristic)
  const hasGreeting = /\b(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(input);
  const hasThanks = /\b(thanks|thank you|appreciate)\b/i.test(input);
  const hasApology = /\b(sorry|apologize|apologies)\b/i.test(input);
  const hasUncertainty = /\b(i think|maybe|kind of|sort of|not sure|i guess)\b/i.test(input);
  const hasAllCaps = /\b[A-Z]{4,}\b/.test(inputRaw);
  const hasExcessivePunct = /[!?]{2,}/.test(inputRaw);
  const hasAggressive = /\b(asap|immediately|this is unacceptable|ridiculous)\b/i.test(input);
  const hasDemanding = /\b(you need to|you must|do this|send it now|by end of day)\b/i.test(input);
  const hasCollaborative = /\b(please|could we|can we|let's|happy to|would you)\b/i.test(input);
  const hasConfident = /\b(i will|i can|i'll|i have|here's|i'm able to)\b/i.test(input);

  if (hasThanks || hasGreeting) score += 4;
  if (hasCollaborative) score += 6;
  if (hasConfident) emotions.push("Confident");
  if (hasThanks || hasGreeting) emotions.push("Friendly");

  if (hasApology) {
    emotions.push("Apologetic");
    score -= 3;
  }
  if (hasUncertainty) {
    emotions.push("Uncertain");
    score -= 6;
  }
  if (hasAllCaps) {
    emotions.push("Frustrated");
    score -= 12;
  }
  if (hasExcessivePunct) {
    emotions.push("Frustrated");
    score -= 8;
  }
  if (hasAggressive) {
    emotions.push("Frustrated");
    score -= 14;
  }
  if (hasDemanding) {
    emotions.push("Demanding");
    score -= 10;
  }
  if (hasCollaborative) emotions.push("Collaborative");

  score = clamp(score, 0, 100);

  // Suggestion rewrite (simple “professionalize” pass)
  let rewritten = input;

  // Normalize greeting/closing a bit
  if (!hasGreeting) rewritten = `Hi team,\n\n${rewritten}`;
  if (!/\b(thanks|thank you|appreciate)\b/i.test(rewritten)) rewritten = `${rewritten}\n\nThanks,`;

  // Replace aggressive/demanding phrases
  rewritten = rewritten
    .replace(/\bASAP\b/gi, "as soon as you reasonably can")
    .replace(/\bimmediately\b/gi, "at your earliest convenience")
    .replace(/\byou need to\b/gi, "could you please")
    .replace(/\byou must\b/gi, "could you")
    .replace(/\bsend it now\b/gi, "send it when you have a moment")
    .replace(/\bthis is unacceptable\b/gi, "I’m concerned about the impact");

  // Remove excessive punctuation
  rewritten = rewritten.replace(/[!?]{2,}/g, "!");

  return {
    professionalism: score,
    emotions: unique(emotions),
    suggestion: rewritten,
  };
}

export default function ToneScorer() {
  const [draft, setDraft] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const gaugeLabel = useMemo(() => {
    const p = analysis?.professionalism ?? null;
    if (p === null) return "";
    if (p >= 90) return "Excellent";
    if (p >= 75) return "Strong";
    if (p >= 60) return "Mixed";
    if (p >= 40) return "Needs polish";
    return "High risk";
  }, [analysis?.professionalism]);

  return (
    <DashboardLayout title="Tone Scorer" subtitle="Draft, analyze, and rewrite for professionalism">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Draft your email or message here...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Draft your email or message here..."
              className="min-h-[220px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setAnalysis(analyzeTone(draft))}
                disabled={!draft.trim()}
              >
                Analyze Tone
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDraft("");
                  setAnalysis(null);
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {analysis && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Professionalism Gauge</p>
                  <p className="text-xs text-muted-foreground">
                    {analysis.professionalism}% · {gaugeLabel}
                  </p>
                </div>
                <Progress value={analysis.professionalism} className="h-2" />
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-semibold">Detected emotions</p>
                {analysis.emotions.length ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.emotions.map((e) => (
                      <Badge key={e} variant="secondary">
                        {e}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No strong emotional signals detected.</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-semibold">AI Suggestion</p>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                    {analysis.suggestion}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

