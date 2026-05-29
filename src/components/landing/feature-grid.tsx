import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Expo Intelligence",
    description:
      "Find Expo-native alternatives for React Native packages.",
  },
  {
    title: "Package Health",
    description: "Analyze maintenance status, release activity, and project health.",
  },
  {
    title: "New Architecture Readiness",
    description: "Check compatibility with Fabric and TurboModules.",
  },
  {
    title: "Bundle Impact",
    description: "Estimate package size impact on your application.",
  },
  {
    title: "Risk Detection",
    description: "Identify deprecated, archived, or unmaintained packages.",
  },
  {
    title: "Recommendations",
    description: "Receive actionable package replacement suggestions.",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl py-10 sm:py-16">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription className="text-sm leading-6 text-muted-foreground">
                {feature.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
