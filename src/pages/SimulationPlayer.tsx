import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Info, Sparkles } from "lucide-react";
import { markScenarioComplete } from "@/lib/scenarioCompletion";
import { setLastActiveSimulationPath } from "@/lib/lastActiveSimulation";

type ScenarioId =
  | "salary-negotiation"
  | "team-conflict-resolution"
  | "giving-difficult-feedback"
  | "job-interview-prep";

type Role = "Manager" | "Colleague" | "Interviewer";

type ScenarioChoice = {
  id: string;
  label: string;
  userSays: string;
  aiInsight: string;
  insightTag?: string;
};

type Scenario = {
  id: ScenarioId;
  title: string;
  category: string;
  role: Role;
  openingLine: string;
  choices: ScenarioChoice[];
};

type ChatMessage =
  | { from: "npc"; role: Role; text: string }
  | { from: "user"; text: string; choiceId: string };

const scenariosById: Record<ScenarioId, Scenario> = {
  "salary-negotiation": {
    id: "salary-negotiation",
    title: "Salary Negotiation",
    category: "Career Growth",
    role: "Manager",
    openingLine: "You’ve done great work, but we don't have the budget for a raise right now.",
    choices: [
      {
        id: "future-review-date",
        label: "Ask for a future review date",
        userSays:
          "Thanks for the transparency. Could we set a specific date to revisit compensation—say in 3 months—based on clear performance goals?",
        insightTag: "Diplomatic",
        aiInsight:
          "This is professional because it stays calm, acknowledges constraints, and converts a vague “not now” into a concrete plan. Adding measurable goals and a calendar date signals maturity and protects your long-term leverage.",
      },
      {
        id: "non-monetary-benefits",
        label: "Ask for non-monetary benefits",
        userSays:
          "Understood. If a raise isn’t possible right now, could we discuss non-monetary options like a title adjustment, extra PTO, or a learning budget?",
        insightTag: "Pragmatic",
        aiInsight:
          "This is a strong alternative because it keeps the conversation constructive and explores other forms of value. To improve it, anchor to business impact (what you delivered) so the request feels earned, not transactional.",
      },
      {
        id: "accept-immediately",
        label: "Accept it immediately",
        userSays: "Okay, no problem. I understand.",
        insightTag: "Passive",
        aiInsight:
          "This avoids conflict, but it can weaken your negotiating position and create ambiguity about your growth path. A better approach is to accept the constraint while still asking for a timeline and criteria for a future revisit.",
      },
    ],
  },
  "team-conflict-resolution": {
    id: "team-conflict-resolution",
    title: "Team Conflict Resolution",
    category: "Management",
    role: "Colleague",
    openingLine:
      "I’m juggling a lot right now. I know I’ve missed a couple deadlines, but it’s not that big of a deal.",
    choices: [
      {
        id: "email-boss",
        label: "Email the boss directly",
        userSays:
          "I’m going to loop in our manager since the missed deadlines are impacting delivery.",
        insightTag: "Escalation",
        aiInsight:
          "Escalating can be appropriate, but going straight to the boss often damages trust and can look political. A more professional sequence is: 1:1 first, then document impacts, then escalate only if the pattern continues.",
      },
      {
        id: "one-on-one",
        label: "Have a 1-on-1 private chat",
        userSays:
          "Can we do a quick 10 minutes today? I want to align on timelines and see what’s blocking you so we can protect the project.",
        insightTag: "Best practice",
        aiInsight:
          "This is typically the most professional choice. It’s direct without public pressure, invites context, and focuses on outcomes. To strengthen it, bring one example and propose a concrete next step (re-plan, ownership, check-ins).",
      },
      {
        id: "call-out-slack",
        label: "Call them out in the group Slack",
        userSays:
          "We’re blocked because your tasks aren’t done. Please finish them today.",
        insightTag: "Risky",
        aiInsight:
          "Public call-outs can create defensiveness and harm team dynamics, even if you’re right about the impact. A more professional approach is private first; if you need visibility, keep group messages factual and action-oriented without blame.",
      },
    ],
  },
  "giving-difficult-feedback": {
    id: "giving-difficult-feedback",
    title: "Giving Difficult Feedback",
    category: "Leadership",
    role: "Colleague",
    openingLine:
      "I’m proud of my work. I’ve been late to a few meetings, but I always deliver—so I don’t think it matters much.",
    choices: [
      {
        id: "direct-impact",
        label: "State the impact clearly and set expectations",
        userSays:
          "Your work quality is strong, and I value it. At the same time, being late disrupts decisions and signals to others that meetings aren’t important. Going forward, I need you on time—or to message ahead when something comes up.",
        insightTag: "Balanced",
        aiInsight:
          "This is professional because it balances recognition with specific behavioral feedback and clear expectations. It focuses on impact, not character. A small improvement is to ask for their perspective and agree on a support plan.",
      },
      {
        id: "soften-too-much",
        label: "Soften it a lot to avoid discomfort",
        userSays:
          "No worries—just try to be on time when you can.",
        insightTag: "Too vague",
        aiInsight:
          "This feels kind, but it’s not actionable. The employee may not change because the expectation is unclear. Professional feedback works best when it’s specific (what), contextual (impact), and measurable (what success looks like).",
      },
      {
        id: "harsh",
        label: "Be harsh to force change",
        userSays:
          "Being late is unacceptable. If it happens again, it will reflect in your performance rating.",
        insightTag: "Overly punitive",
        aiInsight:
          "Consequences matter, but leading with threat can reduce psychological safety and motivation—especially for a talented employee. A more professional approach is to set expectations, confirm understanding, and escalate only if the behavior persists.",
      },
    ],
  },
  "job-interview-prep": {
    id: "job-interview-prep",
    title: "Job Interview Prep",
    category: "Career Growth",
    role: "Interviewer",
    openingLine: "Tell me about a time you failed.",
    choices: [
      {
        id: "star-structured",
        label: "Use a clear, reflective story (STAR + learning)",
        userSays:
          "In a prior role, I underestimated the effort for a launch and we slipped by a week. I owned it, communicated early, and rebuilt the plan with checkpoints. I learned to validate estimates and surface risks sooner.",
        insightTag: "Strong",
        aiInsight:
          "This is professional because it shows accountability, reflection, and a concrete process change. Interviewers look for learning loops—what you changed so the failure is less likely to repeat.",
      },
      {
        id: "blame-external",
        label: "Blame others or circumstances",
        userSays:
          "We failed because other teams didn’t deliver what they promised, so there wasn’t much I could do.",
        insightTag: "Weak signal",
        aiInsight:
          "This can hurt your credibility because it avoids ownership. A more professional answer acknowledges constraints but highlights what you controlled—communication, risk management, escalation, and how you improved your approach.",
      },
      {
        id: "too-honest-no-learning",
        label: "Admit failure without a learning takeaway",
        userSays:
          "I failed a few times early on and it was pretty rough, but I got through it.",
        insightTag: "Incomplete",
        aiInsight:
          "Honesty is good, but this is too vague. Professional interview answers need specifics: what happened, your role, what you learned, and what you do differently now. Add one example and a clear behavioral change.",
      },
    ],
  },
};

function isScenarioId(id: string): id is ScenarioId {
  return id in scenariosById;
}

const hintByScenarioId: Record<ScenarioId, { title: string; tip: string }> = {
  "salary-negotiation": {
    title: "Etiquette hint",
    tip: "Avoid debating “budget” in the moment. Acknowledge constraints, then ask for a timeline + clear criteria for a future review (and document the agreement).",
  },
  "team-conflict-resolution": {
    title: "Etiquette hint",
    tip: "Default to private first. Lead with impact and curiosity (“What’s blocking you?”) before escalating. Public call-outs usually create defensiveness and harm trust.",
  },
  "giving-difficult-feedback": {
    title: "Etiquette hint",
    tip: "Praise the strength, then give behavioral feedback with impact and an expectation. Keep it specific, invite their perspective, and agree on a concrete next step.",
  },
  "job-interview-prep": {
    title: "Etiquette hint",
    tip: "Use a concise story: what happened, your role, what you learned, and what changed in your process. Show ownership without over-explaining or blaming others.",
  },
};

function resolveScenarioIdFromRoute(scenarioIdParam: string, pathname: string): string {
  if (scenarioIdParam && isScenarioId(scenarioIdParam)) return scenarioIdParam;
  if (pathname === "/simulation/salary") return "salary-negotiation";
  return "";
}

export default function SimulationPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const scenarioIdParam = params.scenarioId || "";

  const resolvedScenarioId = useMemo(
    () => resolveScenarioIdFromRoute(scenarioIdParam, location.pathname),
    [scenarioIdParam, location.pathname]
  );

  const scenario = useMemo(() => {
    if (!isScenarioId(resolvedScenarioId)) return null;
    return scenariosById[resolvedScenarioId];
  }, [resolvedScenarioId]);

  useEffect(() => {
    if (!scenario) return;
    setLastActiveSimulationPath(location.pathname);
  }, [scenario, location.pathname]);

  const [messages, setMessages] = useState<ChatMessage[]>(
    scenario
      ? [{ from: "npc", role: scenario.role, text: scenario.openingLine }]
      : []
  );
  const [insightOpen, setInsightOpen] = useState(false);
  const [activeInsight, setActiveInsight] = useState<ScenarioChoice | null>(null);

  if (!scenario) {
    return (
      <DashboardLayout title="Simulation" subtitle="Scenario not found">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">This scenario doesn’t exist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Go back to “My Scenarios” and start a scenario from the list.
              </p>
              <Button onClick={() => navigate("/scenarios")}>Back to My Scenarios</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const chosenIds = new Set(
    messages.filter((m) => m.from === "user").map((m) => m.choiceId)
  );

  const onChoose = (choice: ScenarioChoice) => {
    setMessages((prev) => [...prev, { from: "user", text: choice.userSays, choiceId: choice.id }]);
    setActiveInsight(choice);
    setInsightOpen(true);
    markScenarioComplete(scenario.id);
  };

  return (
    <DashboardLayout title={scenario.title} subtitle={scenario.category}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/scenarios")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Hint">
                      <Info className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Hint</TooltipContent>
              </Tooltip>
              <PopoverContent align="end" className="w-80">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">{hintByScenarioId[scenario.id].title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {hintByScenarioId[scenario.id].tip}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
            <Badge variant="secondary">{scenario.role}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Chat */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {messages.map((m, idx) => (
                <div key={idx} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.from === "user"
                        ? "max-w-[90%] rounded-2xl rounded-tr-md border bg-primary text-primary-foreground px-4 py-3 text-sm"
                        : "max-w-[90%] rounded-2xl rounded-tl-md border bg-card/80 px-4 py-3 text-sm"
                    }
                  >
                    {m.from === "npc" && (
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {m.role}
                      </div>
                    )}
                    <p className="leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Choices */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose a response. After you pick, you’ll see an AI Insight panel.
              </p>
              <Separator />
              <div className="space-y-2">
                {scenario.choices.map((c) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    className="w-full justify-start h-auto whitespace-normal py-3"
                    onClick={() => onChoose(c)}
                    disabled={chosenIds.has(c.id)}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={insightOpen} onOpenChange={setInsightOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> AI Insight
            </SheetTitle>
            <SheetDescription>
              Why this choice reads as professional (or how to improve it).
            </SheetDescription>
          </SheetHeader>

          {activeInsight && (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Your selection</p>
                  {activeInsight.insightTag && <Badge variant="secondary">{activeInsight.insightTag}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{activeInsight.userSays}</p>
              </div>
              <div className="rounded-lg border bg-card/80 p-4">
                <p className="text-sm leading-relaxed">{activeInsight.aiInsight}</p>
              </div>
              <Button className="w-full" onClick={() => setInsightOpen(false)}>
                Continue
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

