import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const radarData = [
  { skill: "Diplomacy", score: 82 },
  { skill: "Initiative", score: 64 },
  { skill: "Email Etiquette", score: 88 },
  { skill: "Conflict Resolution", score: 73 },
  { skill: "Time Management", score: 59 },
] as const;

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const recentFeedback = [
  {
    scenario: "Report delay with senior manager",
    summary: "Lead with status + ETA, then offer two options to protect trust and avoid overpromising.",
    tag: "Diplomacy",
  },
  {
    scenario: "Tense stakeholder email",
    summary: "Remove urgency language, ask one clear question, and propose a next step to reduce friction.",
    tag: "Email Etiquette",
  },
  {
    scenario: "Missed deadline follow-up",
    summary: "Acknowledge impact, own the miss, and commit to a concrete plan with a checkpoint.",
    tag: "Reliability",
  },
] as const;

const levelColor = (l: string) => {
  if (l === "Advanced") return "bg-success/10 text-success border-success/20";
  if (l === "Intermediate") return "bg-primary/10 text-primary border-primary/20";
  if (l === "Developing") return "bg-warning/10 text-warning border-warning/20";
  return "bg-muted text-muted-foreground border-border";
};

const SkillProgress = () => (
  <DashboardLayout title="Progress Dashboard" subtitle="A snapshot of your skill growth and recent coaching">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Radar chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Skill Radar</CardTitle>
              <p className="text-sm text-muted-foreground">
                Five core areas measured from your recent simulations.
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-square max-h-[360px] mx-auto">
                <RadarChart data={radarData}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tickLine={false} axisLine={false} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={6} />
                  <Radar
                    dataKey="score"
                    stroke="var(--color-score)"
                    fill="var(--color-score)"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Feedback</CardTitle>
              <p className="text-sm text-muted-foreground">
                Summaries from the last 3 simulations.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentFeedback.map((item) => (
                <div key={item.scenario} className="rounded-lg border bg-card/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.scenario}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                    <Badge variant="outline" className={levelColor("Intermediate")}>
                      {item.tag}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  </DashboardLayout>
);

export default SkillProgress;
