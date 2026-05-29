import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const futureFeatures = [
  "GitHub repository analysis",
  "npm package intelligence",
  "CI/CD integration",
  "Pull request checks",
  "Team reports",
  "AI-powered recommendations",
  "Expo SDK upgrade assistant",
  "Dependency update planner",
];

export function FutureFeatures() {
  return (
    <section className="mx-auto max-w-6xl py-10 sm:py-16">
      <Card className="border-border/60 bg-gradient-to-br from-background via-background to-muted/40">
        <CardContent className="flex flex-col gap-6 p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
              Architecture Ready
            </Badge>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Built for the next wave of dependency intelligence
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {futureFeatures.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
