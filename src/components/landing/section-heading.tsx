import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  description?: string;
  align?: "left" | "center";
  eyebrow?: string;
};

export function SectionHeading({
  title,
  description,
  align = "center",
  eyebrow,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl space-y-3",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
