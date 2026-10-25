type AccountBadgeProps = {
  name: string;
  color?: string | null;
};

export function AccountBadge({ name, color }: AccountBadgeProps) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
      <span
        className="size-2 shrink-0 rounded-full bg-muted-foreground"
        style={color ? { backgroundColor: color } : undefined}
        aria-hidden="true"
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
