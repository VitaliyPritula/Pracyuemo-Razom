'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginUser, registerUser } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        await registerUser(email, password);
        toast.success("Реєстрація успішна! Тепер можете увійти.");
        setIsSignUp(false);
      } else {
        await loginUser(email, password);
        toast.success("Успішний вхід!");
        window.location.reload();
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object"
            ? JSON.stringify(error)
            : String(error);
      toast.error(message || "Невідома помилка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto w-full">
      <h2 className="text-2xl font-semibold text-foreground mb-4">
        {isSignUp ? "Реєстрація" : "Вхід"}
      </h2>

      <form onSubmit={handleAuth} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? "Завантаження..."
            : isSignUp
              ? "Зареєструватись"
              : "Увійти"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-primary hover:underline text-sm">
          {isSignUp ? "Вже є акаунт? Увійти" : "Немає акаунту? Зареєструватись"}
        </button>
      </div>
    </Card>
  );
};
