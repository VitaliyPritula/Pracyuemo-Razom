// app/communicator/page.tsx
"use client";

import React from "react";
import { Communicator } from "@/app/communicator/page"; // твій компонент

export default function CommunicatorPage() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Communicator />
    </div>
  );
}
