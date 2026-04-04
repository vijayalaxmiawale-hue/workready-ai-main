import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Bold, Italic, List, ListOrdered, Sparkles } from "lucide-react";

type Emotion =
  | "Confident"
  | "Apologetic"
  | "Demanding"
  | "Frustrated"
  | "Collaborative"
  | "Uncertain"
  | "Friendly";

type ToneResult = {
  professionalism: number; // 0-100
  emotions: Emotion[];
};

type TransformKind = "formal" | "concise" | "cta";

type ToneIntent = "Requesting a Favor" | "Admitting a Mistake" | "Follow-up on Task";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function htmlToText(html: string) {
  // Very small HTML→text converter for our internal analysis/transformations.
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\u00a0/g, " ").trim();
}

function textToBasicHtml(text: string) {
  // Convert plain text to simple HTML paragraphs.
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const lines = escaped.split(/\n{2,}/g).map((p) => p.trim());
  return lines
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function analyzeToneText(inputRaw: string): ToneResult {
  const input = inputRaw.trim();
  if (!input) return { professionalism: 0, emotions: [] };

  let score = 75;
  const emotions: Emotion[] = [];

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

  return { professionalism: clamp(score, 0, 100), emotions: unique(emotions) };
}

function transformText(kind: TransformKind, text: string, intent: ToneIntent) {
  const base = text.trim();
  if (!base) return { updated: "", why: [] as string[] };

  if (kind === "formal") {
    let updated = base;
    updated = updated
      .replace(/\bhey\b/gi, "Hello")
      .replace(/\bhi\b/gi, "Hello")
      .replace(/\bASAP\b/g, "at your earliest convenience")
      .replace(/\bthx\b/gi, "thank you")
      .replace(/\bthanks\b/gi, "Thank you");

    if (!/^(hello|dear)\b/i.test(updated)) updated = `Hello,\n\n${updated}`;
    if (!/\b(thank you|thanks)\b/i.test(updated)) updated = `${updated}\n\nThank you,`;

    return {
      updated,
      why: [
        "Replaced informal phrasing with more professional wording.",
        "Added a neutral greeting and closing to fit workplace email norms.",
        "Softened urgency language to reduce pressure while keeping intent clear.",
      ],
    };
  }

  if (kind === "concise") {
    const lines = base.split("\n").map((l) => l.trim());
    const nonEmpty = lines.filter(Boolean);
    // Remove filler lines and collapse whitespace.
    let updated = nonEmpty
      .map((l) => l.replace(/\b(just|really|basically|actually|kind of|sort of)\b/gi, "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n");

    // If it is long, keep first ~3 lines as a simple compression.
    const parts = updated.split("\n");
    if (parts.length > 6) updated = [...parts.slice(0, 3), "...", ...parts.slice(-2)].join("\n");

    return {
      updated,
      why: [
        "Removed filler words and redundant phrasing.",
        "Collapsed whitespace and tightened sentences to improve scanability.",
        "Prioritized key points so the request is faster to understand.",
      ],
    };
  }

  // kind === "cta"
  const hasQuestion = /\?\s*$|(\?\s*\n)/m.test(base);
  const hasCta = /\b(next step|please confirm|can you|could you|let me know|reply with)\b/i.test(base);
  let updated = base;
  if (!hasCta) {
    if (intent === "Requesting a Favor") {
      updated = `${updated}\n\nNext step: Would you be able to help with this? If yes, please confirm timing—and if not, a quick alternative suggestion would be appreciated.`;
    } else if (intent === "Admitting a Mistake") {
      updated = `${updated}\n\nNext step: I’ll take ownership of the fix. Please confirm the priority and your preferred timeline, and I’ll share an ETA plus a checkpoint.`;
    } else {
      updated = `${updated}\n\nNext step: Could you please confirm whether you can complete this by EOD? If not, share an ETA and any blockers.`;
    }
  } else if (!hasQuestion && !/next step/i.test(base)) {
    updated = `${updated}\n\nNext step: Please confirm timing and any blockers.`;
  }

  return {
    updated,
    why: [
      "Added a clear call-to-action so the recipient knows exactly what to do next.",
      "Made the request measurable (timing + blockers) to reduce back-and-forth.",
      "Improved accountability by prompting an ETA if the original timing won’t work.",
    ],
  };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightChanged(oldText: string, newText: string) {
  // Simple line-level highlight: show new text with changed lines highlighted.
  const oldLines = oldText.split("\n").map((l) => l.trimEnd());
  const newLines = newText.split("\n").map((l) => l.trimEnd());

  const oldSet = new Set(oldLines.filter(Boolean));
  const highlighted = newLines
    .map((line) => {
      const safe = escapeHtml(line);
      if (!line.trim()) return `<div class="h-3"></div>`;
      const isNewOrChanged = !oldSet.has(line);
      return isNewOrChanged
        ? `<mark class="rounded px-1 py-0.5 bg-primary/15 text-foreground">${safe}</mark>`
        : `<span>${safe}</span>`;
    })
    .join("<br />");

  return highlighted;
}

export default function EmailPolisher() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  const initialHtml =
    "<p>Hey Priya,</p><p>I need the updated numbers ASAP. This is taking too long!!</p><p>Thanks</p>";

  const [toneIntent, setToneIntent] = useState<ToneIntent>("Requesting a Favor");
  const [analysis, setAnalysis] = useState<{
    intent: ToneIntent;
    tone: ToneResult;
    analyzedText: string;
  } | null>(null);
  const [lastTransform, setLastTransform] = useState<{
    kind: TransformKind;
    oldText: string;
    newText: string;
    why: string[];
  } | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (initializedRef.current) return;
    editorRef.current.innerHTML = initialHtml;
    initializedRef.current = true;
  }, [initialHtml]);

  const getCurrentText = () => {
    const html = editorRef.current?.innerHTML || "";
    return htmlToText(html);
  };

  const professionalismLabel = useMemo(() => {
    const p = analysis?.tone.professionalism ?? 0;
    if (p >= 90) return "Excellent";
    if (p >= 75) return "Strong";
    if (p >= 60) return "Mixed";
    if (p >= 40) return "Needs polish";
    return "High risk";
  }, [analysis?.tone.professionalism]);

  const runCommand = (command: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command);
  };

  const applyTransform = (kind: TransformKind) => {
    const oldText = getCurrentText();
    const { updated, why } = transformText(kind, oldText, toneIntent);
    const newHtml = textToBasicHtml(updated);
    if (editorRef.current) {
      editorRef.current.innerHTML = newHtml || "<p></p>";
      editorRef.current.focus();
    }
    setLastTransform({ kind, oldText, newText: updated, why });
    setAnalysis(null);
  };

  const analyze = () => {
    const text = getCurrentText();
    setAnalysis({
      intent: toneIntent,
      tone: analyzeToneText(text),
      analyzedText: text,
    });
  };

  return (
    <DashboardLayout title="Email Polisher" subtitle="Write, analyze tone, and apply transformations">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Rich-text editor */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Draft</CardTitle>
              <p className="text-sm text-muted-foreground">Type your email on the left. Use formatting if helpful.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => runCommand("bold")} className="gap-2">
                  <Bold className="h-4 w-4" /> Bold
                </Button>
                <Button size="sm" variant="outline" onClick={() => runCommand("italic")} className="gap-2">
                  <Italic className="h-4 w-4" /> Italic
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runCommand("insertUnorderedList")}
                  className="gap-2"
                >
                  <List className="h-4 w-4" /> Bullets
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runCommand("insertOrderedList")}
                  className="gap-2"
                >
                  <ListOrdered className="h-4 w-4" /> Numbered
                </Button>
                <div className="flex-1" />
                <div className="min-w-[240px]">
                  <Select value={toneIntent} onValueChange={(v) => setToneIntent(v as ToneIntent)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tone Selector" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="Requesting a Favor">Requesting a Favor</SelectItem>
                      <SelectItem value="Admitting a Mistake">Admitting a Mistake</SelectItem>
                      <SelectItem value="Follow-up on Task">Follow-up on Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className={cn(
                  "min-h-[360px] rounded-lg border bg-background p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                )}
                aria-label="Draft your email or message here..."
              />
              <p className="text-xs text-muted-foreground">
                Tip: transformations update the draft and show highlights on the right.
              </p>
            </CardContent>
          </Card>

          {/* Right: tone analysis + transforms */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tone Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Professionalism</p>
                    <p className="text-xs text-muted-foreground">
                      {analysis ? professionalismLabel : "Click Analyze to score your draft"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {analysis && (
                      <p className="text-2xl font-bold tabular-nums">{analysis.tone.professionalism}%</p>
                    )}
                    <Button onClick={analyze} className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Analyze
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Detected emotions</p>
                  {analysis?.tone.emotions?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {analysis.tone.emotions.map((e) => (
                        <Badge key={e} variant="secondary">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {analysis ? "No strong emotional signals detected." : "No analysis yet."}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-semibold">AI Transformations</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button variant="outline" className="justify-start gap-2" onClick={() => applyTransform("formal")}>
                      <Sparkles className="h-4 w-4" />
                      Make it more formal
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => applyTransform("concise")}
                    >
                      <Sparkles className="h-4 w-4" />
                      Make it more concise
                    </Button>
                    <Button variant="outline" className="justify-start gap-2" onClick={() => applyTransform("cta")}>
                      <Sparkles className="h-4 w-4" />
                      Add a call-to-action
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After clicking, the updated draft is applied and changes are highlighted below.
                  </p>
                </div>
              </CardContent>
            </Card>

            {lastTransform && (
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Updated version (with highlights)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Highlighted text indicates what changed compared to your prior draft.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightChanged(lastTransform.oldText, lastTransform.newText),
                    }}
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Why these changes</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {lastTransform.why.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

