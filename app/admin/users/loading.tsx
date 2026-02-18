export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-36 animate-pulse rounded" />
        <div className="bg-muted h-4 w-56 animate-pulse rounded" />
      </div>
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-card border-border h-24 rounded-lg border"
            />
          ))}
        </div>
        <div className="bg-muted h-10 rounded" />
        <div className="bg-card border-border h-80 rounded-lg border" />
      </div>
    </div>
  );
}
