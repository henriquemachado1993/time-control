"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Clock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (status === "loading") return;
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (isRegister) {
      // Chamar uma rota/api para registrar usuário
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao registrar");
        setLoading(false);
        return;
      }
    }
    // Login com next-auth
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);

    if (result?.error && result?.status === 401) {
      console.warn("result error", result.error);
      setError('Email ou senha inválidos');
      return;
    }

    if (result?.error) {
      console.warn("result error", result.error);
      setError('Erro ao fazer login');
      return;
    }

    router.push("/dashboard");
  };

  // Não renderizar se ainda estiver carregando a sessão
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Não renderizar se já estiver logado (vai redirecionar)
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header com toggle de tema */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Controle de Horas</h1>
          </div>
          <ThemeToggle />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isRegister ? "Criar conta" : "Bem-vindo de volta"}
            </CardTitle>
            <CardDescription className="text-center">
              {isRegister ? "Crie sua conta para começar" : "Entre na sua conta para continuar"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  isRegister ? "Criar conta" : "Entrar"
                )}
              </Button>
            </form>

            <Separator />

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setIsRegister((v) => !v)}
                className="text-sm"
              >
                {isRegister
                  ? "Já tem conta? Entrar"
                  : "Não tem conta? Criar conta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 