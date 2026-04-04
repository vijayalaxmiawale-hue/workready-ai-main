import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const titles: Record<string, string> = {
  "client-objection": "Client Objection Handling",
};

export default function ScenarioPlaceholder() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const title = (slug && titles[slug]) || "Scenario";

  return (
    <DashboardLayout title={title} subtitle="Coming soon">
      <div className="max-w-lg mx-auto">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This scenario is not available yet. You can go back to My Scenarios to pick another activity.
            </p>
            <Button className="gap-2" onClick={() => navigate("/scenarios")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Scenarios
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
