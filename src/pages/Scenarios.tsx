import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Star, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getCompletedScenarioIds } from "@/lib/scenarioCompletion";

const scenarios = [
  { title: "Salary Negotiation", category: "Career Growth", difficulty: "Intermediate", time: "15 min", rating: 4.8 },
  { title: "Giving Difficult Feedback", category: "Leadership", difficulty: "Advanced", time: "20 min", rating: 4.9 },
  { title: "Client Objection Handling", category: "Sales", difficulty: "Intermediate", time: "12 min", rating: 4.7 },
  { title: "Team Conflict Resolution", category: "Management", difficulty: "Advanced", time: "25 min", rating: 4.6 },
  { title: "Job Interview Prep", category: "Career Growth", difficulty: "Beginner", time: "18 min", rating: 4.9 },
  { title: "Executive Summary Writing", category: "Communication", difficulty: "Intermediate", time: "10 min", rating: 4.5 },
];

/** Unique route per scenario card (explicit paths for Salary + Executive Summary per product spec). */
const START_ROUTE_BY_TITLE: Record<string, string> = {
  "Salary Negotiation": "/simulation/salary",
  "Giving Difficult Feedback": "/simulate/giving-difficult-feedback",
  "Client Objection Handling": "/scenario-placeholder/client-objection",
  "Team Conflict Resolution": "/simulate/team-conflict-resolution",
  "Job Interview Prep": "/simulate/job-interview-prep",
  "Executive Summary Writing": "/email-polisher",
};

/** Slug used by completion badges (matches SimulationPlayer ids + localStorage). */
function completionSlugForTitle(title: string): string | null {
  const route = START_ROUTE_BY_TITLE[title];
  if (!route) return null;
  if (route === "/simulation/salary") return "salary-negotiation";
  if (route.startsWith("/simulate/")) return route.replace("/simulate/", "");
  return null;
}

const difficultyColor = (d: string) => {
  if (d === "Beginner") return "bg-success/10 text-success border-success/20";
  if (d === "Advanced") return "bg-warning/10 text-warning border-warning/20";
  return "bg-primary/10 text-primary border-primary/20";
};

const Scenarios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completedIds, setCompletedIds] = useState<string[]>(() => getCompletedScenarioIds());

  const refreshCompleted = useCallback(() => {
    setCompletedIds(getCompletedScenarioIds());
  }, []);

  useEffect(() => {
    refreshCompleted();
    window.addEventListener("scenario-completion-changed", refreshCompleted);
    window.addEventListener("storage", refreshCompleted);
    return () => {
      window.removeEventListener("scenario-completion-changed", refreshCompleted);
      window.removeEventListener("storage", refreshCompleted);
    };
  }, [refreshCompleted]);

  /** Explicit per-card navigation (unique behavior per Start button). */
  const startByTitle = useMemo(() => {
    const go = (path: string) => () => navigate(path);
    return {
      "Salary Negotiation": go("/simulation/salary"),
      "Giving Difficult Feedback": go("/simulate/giving-difficult-feedback"),
      "Client Objection Handling": go("/scenario-placeholder/client-objection"),
      "Team Conflict Resolution": go("/simulate/team-conflict-resolution"),
      "Job Interview Prep": go("/simulate/job-interview-prep"),
      "Executive Summary Writing": go("/email-polisher"),
    } as const satisfies Record<string, () => void>;
  }, [navigate]);

  const startScenario = (title: string) => {
    const handler = startByTitle[title as keyof typeof startByTitle];
    if (!handler) {
      toast({
        title: "Coming soon",
        description: "This scenario isn’t wired up yet. Try one of the featured simulations.",
      });
      return;
    }
    handler();
  };

  return (
  <DashboardLayout title="My Scenarios" subtitle="Practice real-world workplace situations">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((s, i) => {
          const slug = completionSlugForTitle(s.title);
          const isCompleted = slug ? completedIds.includes(slug) : false;

          return (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
        >
            <Card
              className="glass-card hover:shadow-md transition-all group cursor-pointer"
              onClick={() => startScenario(s.title)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") startScenario(s.title);
              }}
            >
            <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={difficultyColor(s.difficulty)}>
                  {s.difficulty}
                </Badge>
                    {isCompleted && (
                      <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20">
                        Completed
                      </Badge>
                    )}
                  </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {s.rating}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.category}</p>
              </div>
                <div className="flex items-center justify-between pt-1 gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {s.time}
                </div>
                  {isCompleted ? (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-success text-success-foreground hover:bg-success/90 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startScenario(s.title);
                      }}
                    >
                      <ClipboardList className="h-3 w-3" /> Review Results
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        startScenario(s.title);
                      }}
                    >
                  <Play className="h-3 w-3" /> Start
                </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
          );
        })}
    </div>
  </DashboardLayout>
);
};

export default Scenarios;
