"use client";
import { useEffect, useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { Shield, CheckCircle, Users, Zap } from "lucide-react";
import Logo from "@/components/branding/Logo";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Sign in to Rivor</h1>
        <p className="text-gray-600 text-center mb-8">Secure SSO via Google or Microsoft</p>
        
        <div className="space-y-4">
          <button
            onClick={() => signIn('google', { callbackUrl: '/app' })}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Continue with Google
          </button>
          
          <button
            onClick={() => signIn('azure-ad', { callbackUrl: '/app' })}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Continue with Microsoft
          </button>
        </div>
      </div>
    </div>
  );
}
