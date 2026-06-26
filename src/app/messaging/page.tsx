import { Suspense } from "react";
import Messaging from "./Messaging";

export default function MessagingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Завантаження...</p>
        </div>
      }
    >
      <Messaging />
    </Suspense>
  );
}
