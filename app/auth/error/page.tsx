import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

const MAX_ERROR_LENGTH = 200;

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value).slice(0, MAX_ERROR_LENGTH);
  } catch {
    return value.slice(0, MAX_ERROR_LENGTH);
  }
}

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-muted-foreground text-sm">
          오류 내용: {safeDecodeURIComponent(params.error)}
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          알 수 없는 오류가 발생했습니다.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">문제가 발생했습니다</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
