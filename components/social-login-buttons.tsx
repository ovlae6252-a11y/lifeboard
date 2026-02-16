"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";

export function SocialLoginButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const handleSocialLogin = async (provider: Provider) => {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("소셜 로그인 오류:", error.message);
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Google 로그인 */}
      <Button
        variant="outline"
        size="lg"
        onClick={() => handleSocialLogin("google")}
        disabled={loading !== null}
        className="w-full bg-white hover:bg-gray-50"
      >
        {loading === "google" ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 009.003 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0A8.997 8.997 0 00.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span className="text-gray-700">Google로 계속하기</span>
      </Button>

      {/* Kakao 로그인 */}
      <Button
        size="lg"
        onClick={() => handleSocialLogin("kakao")}
        disabled={loading !== null}
        className="w-full bg-[#FEE500] text-[#000000] hover:bg-[#FDD835]"
      >
        {loading === "kakao" ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 0C4.029 0 0 3.295 0 7.362c0 2.625 1.728 4.926 4.323 6.231l-.99 3.638c-.068.25.092.506.356.506.095 0 .195-.03.281-.096L8.515 14.4c.161.014.325.024.485.024 4.971 0 9-3.295 9-7.362S13.971 0 9 0z"
              fill="#000000"
            />
          </svg>
        )}
        Kakao로 계속하기
      </Button>

      {/* Apple 로그인 */}
      <Button
        size="lg"
        onClick={() => handleSocialLogin("apple")}
        disabled={loading !== null}
        className="w-full bg-black text-white hover:bg-gray-900"
      >
        {loading === "apple" ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.316 15.282c-.585.845-1.225 1.685-2.207 1.701-.97.017-1.284-.576-2.393-.576-1.109 0-1.456.559-2.376.593-.952.034-1.69-.918-2.281-1.76-1.208-1.72-2.131-4.86-0.892-6.982.616-1.056 1.717-1.725 2.912-1.743.91-.017 1.768.612 2.325.612.556 0 1.598-.756 2.693-.646.458.02 1.745.185 2.57 1.397-.066.042-1.534.896-1.517 2.672.017 2.12 1.86 2.826 1.877 2.832-.017.05-.293.999-.967 1.98M12.053 3.96c.49-.595.82-1.42.73-2.244-.706.029-1.56.47-2.067 1.062-.454.527-.852 1.367-.745 2.175.788.061 1.593-.4 2.082-0.993"
              fill="white"
            />
          </svg>
        )}
        Apple로 계속하기
      </Button>
    </div>
  );
}
