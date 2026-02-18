export default function AdminNewsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-1">
        <div className="bg-muted h-7 w-32 rounded" />
        <div className="bg-muted h-4 w-48 rounded" />
      </div>
      <div className="bg-muted h-10 w-72 rounded-lg" />
      <div className="bg-card border-border h-96 rounded-lg border" />
    </div>
  );
}
