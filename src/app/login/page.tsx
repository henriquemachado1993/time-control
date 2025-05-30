"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

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
    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard");
    }
  };

  // Não renderizar se ainda estiver carregando a sessão
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  // Não renderizar se já estiver logado (vai redirecionar)
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isRegister ? "Criar conta" : "Bem-vindo de volta"}
            </h1>
            <p className="text-gray-600">
              {isRegister ? "Crie sua conta para começar" : "Entre na sua conta para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-slate-600 to-gray-700 text-white py-3 px-4 rounded-lg font-medium hover:from-slate-700 hover:to-gray-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Carregando...
                </div>
              ) : (
                isRegister ? "Criar conta" : "Entrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
              onClick={() => setIsRegister((v) => !v)}
            >
              {isRegister
                ? "Já tem conta? Entrar"
                : "Não tem conta? Criar conta"}
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Sistema de Controle de Horas
          </p>
        </div>
      </div>
    </div>
  );
} 