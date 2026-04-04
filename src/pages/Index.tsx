import { DashboardLayout } from "@/components/DashboardLayout";
import {
  ArrowRight,
  Check,
  Gauge,
  Handshake,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { getLastActiveSimulationPath } from "@/lib/lastActiveSimulation";

const stats = [
  { label: "Diplomacy Score", value: "82", icon: Handshake, change: "+4 this week" },
  { label: "Decision Speed", value: "7.6/10", icon: Gauge, change: "Steady" },
  { label: "Reliability", value: "91%", icon: ShieldCheck, change: "On track" },
];

const lastMission = {
  title: "A senior manager asks for a report that isn't ready yet",
  progress: 55,
  eta: "~8 min remaining",
};

const Index = () => {
  const navigate = useNavigate();
  const [tipRead, setTipRead] = useState(false);
  const [tipModalOpen, setTipModalOpen] = useState(false);

  const tipOfTheDay = useMemo(
    () => ({
      title: "Professional Tip of the Day",
      body: "When you're behind, lead with the status and the next concrete step—then offer options. It signals ownership without overpromising.",
    }),
    []
  );

  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome back, Jordan">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="glass-card overflow-hidden">
            <div className="relative p-6 bg-gradient-to-br from-primary/8 via-transparent to-transparent">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Continue Last Mission</CardTitle>
                <p className="text-sm text-muted-foreground">{lastMission.title}</p>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="rounded-lg border bg-card/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Progress</p>
                    <p className="text-xs text-muted-foreground">{lastMission.eta}</p>
                  </div>
                  <div className="mt-3">
                    <Progress value={lastMission.progress} className="h-2" />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">In progress</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {lastMission.progress}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => navigate(getLastActiveSimulationPath())}
                    className="gap-2"
                  >
                    Resume Mission <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/scenarios")}>
                    Choose Different Scenario
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <Card className="glass-card hover:shadow-md transition-shadow cursor-default select-none">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.change}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Daily Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          <Card className="glass-card">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Handshake className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold">{tipOfTheDay.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tipOfTheDay.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="default" className="gap-2" onClick={() => setTipModalOpen(true)}>
                    Open tip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={tipModalOpen} onOpenChange={setTipModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tipOfTheDay.title}</DialogTitle>
            <DialogDescription className="text-left text-foreground/90 leading-relaxed">
              {tipOfTheDay.body}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              variant={tipRead ? "secondary" : "default"}
              className="gap-2"
              onClick={() => {
                setTipRead(true);
              }}
              disabled={tipRead}
            >
              <Check className="h-4 w-4" />
              {tipRead ? "Marked as Read" : "Mark as Read"}
            </Button>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button variant="outline" onClick={() => setTipModalOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setTipModalOpen(false);
                  navigate("/scenarios");
                }}
              >
                Try a Scenario
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Index;
