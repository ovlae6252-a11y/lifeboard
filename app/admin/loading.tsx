export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-1">
        <div className="bg-muted h-7 w-32 rounded" />
        <div className="bg-muted h-4 w-56 rounded" />
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border-border h-24 rounded-lg border"
          />
        ))}
      </div>

      {/* 2열 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border-border h-40 rounded-lg border" />
        <div className="bg-card border-border h-40 rounded-lg border" />
      </div>

      {/* 차트 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border-border h-64 rounded-lg border" />
        <div className="bg-card border-border h-64 rounded-lg border" />
      </div>

      {/* 활동 로그 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border-border h-48 rounded-lg border" />
        <div className="bg-card border-border h-48 rounded-lg border" />
      </div>
    </div>
  );
}
