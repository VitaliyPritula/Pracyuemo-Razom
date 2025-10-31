"use client";

import React from "react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { signInWithGoogle } from "@/utils/supabase/action";

const Auth = () => {
  return (
    <Card className="p-6 max-w-md mx-auto w-full">
      <h2 className="text-2xl font-semibold mb-4 text-center">Вхід</h2>

      {/* <form className="space-y-4">
        <Input type="email" placeholder="Email" required />
        <Input type="password" placeholder="Пароль" />
        <Button type="submit" className="w-full">
          Увійти
        </Button>
      </form> */}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">або</span>
        </div>
      </div>

      {/* окрема форма для Google Login */}
      <form action={signInWithGoogle}>
        <Button
          type="submit"
          className="w-full flex items-center justify-center gap-2"
        >
          <Image
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            width={20}
            height={20}
          />
          Продовжити з Google
        </Button>
      </form>
    </Card>
  );
};

export default Auth;



// import Image from "next/image";
// import { useState } from "react";
// import { supabase } from "@/hooks/client";
// import { toast } from "sonner";

// export const Auth = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleAuth = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       if (isSignUp) {
//         const { error } = await supabase.auth.signUp({ email, password });
//         if (error) throw error;
//         toast.success("Реєстрація успішна! Тепер можете увійти.");
//       } else {
//         const { error } = await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });
//         if (error) throw error;
//         toast.success("Успішний вхід!");
//       }
//     } catch (error: unknown) {
//       const message =
//         error instanceof Error ? error.message : "Невідома помилка";
//       toast.error(message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleGoogleSignIn = async () => {
//     setIsLoading(true);
//     try {
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: "google",
//         options: { redirectTo: window.location.origin },
//       });
//       if (error) throw error;
//     } catch (error: unknown) {
//       const message =
//         error instanceof Error ? error.message : "Невідома помилка";
//       toast.error(message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Card
//       className="p-6 max-w-md mx-auto ab
//     solute top-1/2 left-1/2 transform translate-x-1 -translate-y-1/2 w-full">
//       <h2 className="text-2xl font-semibold text-foreground mb-4">
//         {isSignUp ? "Реєстрація" : "Вхід"}
//       </h2>

//       <form onSubmit={handleAuth} className="space-y-4">
//         <Input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//         <Input
//           type="password"
//           placeholder="Пароль"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         <Button type="submit" className="w-full" disabled={isLoading}>
//           {isLoading
//             ? "Завантаження..."
//             : isSignUp
//             ? "Зареєструватись"
//             : "Увійти"}
//         </Button>
//       </form>

//       <div className="mt-4 text-center">
//         <button
//           onClick={() => setIsSignUp(!isSignUp)}
//           className="text-primary hover:underline text-sm">
//           {isSignUp ? "Вже є акаунт? Увійти" : "Немає акаунту? Зареєструватись"}
//         </button>
//       </div>

//       <div className="relative my-6">
//         <div className="absolute inset-0 flex items-center">
//           <span className="w-full border-t border-border" />
//         </div>
//         <div className="relative flex justify-center text-xs uppercase">
//           <span className="bg-background px-2 text-muted-foreground">або</span>
//         </div>
//       </div>

//     </Card>
//   );
// };
