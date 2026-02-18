export default function AdminMonitoringLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-44 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </div>
      <div className="animate-pulse space-y-4">
        <div className="bg-muted h-10 w-72 rounded-lg" />
        <div className="bg-muted h-10 rounded" />
        <div className="bg-card border-border h-80 rounded-lg border" />
      </div>
    </div>
  );
}
