import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Expo mapping",
    description:
      "Map React Native packages to Expo-native alternatives in seconds.",
  },
  {
    title: "Health scoring",
    description: "Track maintenance signals, release cadence, and ecosystem trust.",
  },
  {
    title: "Architecture readiness",
    description: "Check Fabric and TurboModules compatibility before upgrades.",
  },
  {
    title: "Bundle pressure",
    description: "Estimate package weight and surface heavy runtime dependencies.",
  },
  {
    title: "Dependency death checker",
    description: "Detect archived, unmaintained, and deprecated packages with a clear risk score.",
  },
  {
    title: "Upgrade guidance",
    description: "Get clear replacement and migration recommendations for your stack.",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl py-10 sm:py-16">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="ai-panel border-border/70 bg-card/85">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg tracking-tight">{feature.title}</CardTitle>
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
