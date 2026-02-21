"use client";
import { FcGoogle } from 'react-icons/fc';
import Image from "next/image";
import { FaGithub } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function LoginPage() {
  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const loginWithGithub = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Connexion</h1>
          <p className="text-gray-400 mt-2">
            Connecte-toi pour accéder à la plateforme
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          {/* Google */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition"
          >
            <FcGoogle size={24} />
            Continuer avec Google
          </button>

          {/* GitHub */}
          <button
            onClick={loginWithGithub}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition"
          >
            <FaGithub size={24} />
            Continuer avec GitHub
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-8">
          En continuant, tu acceptes nos conditions d’utilisation.
        </p>
      </div>
    </div>
  );
}