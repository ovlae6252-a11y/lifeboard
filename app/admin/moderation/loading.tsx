export default function AdminModerationLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </div>
      <div className="animate-pulse space-y-4">
        <div className="bg-muted h-10 w-56 rounded-lg" />
        <div className="bg-card border-border h-96 rounded-lg border" />
      </div>
    </div>
  );
}
