"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArchitecturalWireframeBackground } from "@/components/architectural-wireframe-background";
import { LoginForm } from "@/components/auth/login-form";
import { useSupabaseAuthContext } from "@/lib/auth/supabase-auth-context";
import { useAppAuth } from "@/lib/auth/app-auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: supabaseLoading } = useSupabaseAuthContext();
  const { role, isLoading: appLoading } = useAppAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!supabaseLoading && !appLoading && user && role) {
      if (role === 'foreman') {
        router.push("/reno/construction-manager/kanban");
      } else if (role === 'admin') {
        router.push("/reno/construction-manager/kanban");
      }
    }
  }, [user, role, supabaseLoading, appLoading, router]);

  // Show loading state
  if (supabaseLoading || appLoading) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="relative">
          <ArchitecturalWireframeBackground />
        </div>
        <div className="relative flex min-h-screen flex-col items-center justify-center p-8 bg-card dark:bg-[var(--prophero-gray-900)]">
          <div className="text-center text-muted-foreground">
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left column: architectural illustration */}
      <div className="relative">
        <ArchitecturalWireframeBackground />
      </div>

      {/* Right column: login form */}
      <div className="relative flex min-h-screen flex-col items-center justify-center p-8 bg-card dark:bg-[var(--prophero-gray-900)]">
        <LoginForm />

        {/* Footer links */}
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <a className="pointer-events-auto hover:underline" href="#">Soporte</a>
          <a className="pointer-events-auto hover:underline" href="#">Privacidad</a>
          <a className="pointer-events-auto hover:underline" href="#">Términos</a>
        </div>
      </div>
    </div>
  );
}


