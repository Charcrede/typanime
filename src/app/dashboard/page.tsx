"use client";
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';

type Profile = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  provider: string;
  createdAt: string;
  averageWpm: number;
  bestWpm: number;
  gamesPlayed: number;
  lastPlayedAt: string | null;
  citations: { gamesPlayed: number; averageWpm: number; averageAccuracy: number };
  synopsis: { gamesPlayed: number; averageWpm: number; averageAccuracy: number };
  challengesPlayed: number;
  bestChallengeWpm: number;
  avgChallengeWpm: number;
  rank: number;
  averageAccuracy: number;
};

export default function DashboardPage() {
  const { user, setUser, logout } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);

  const getUser = async () => {
    const userData = await fetch('/api/me').then(r => r.json());
    if (userData.error) {
      window.location.href = '/auth/login';
    } else {
      setUser(userData);
      setProfile(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem('user');
    
      getUser();
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm tracking-widest uppercase">Chargement</p>
        </div>
      </div>
    );
  }

  const accuracy = Math.round(profile.averageAccuracy);
  const memberSince = new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          transition: border-color 0.2s, background 0.2s;
        }
        .card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
        }
        .stat-value {
          font-family: 'DM Mono', monospace;
          font-size: 2.25rem;
          font-weight: 500;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .badge {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.4);
        }
        .rank-glow {
          text-shadow: 0 0 40px rgba(250, 204, 21, 0.4);
        }
        .progress-bar {
          height: 3px;
          background: rgba(255,255,255,0.07);
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.7));
          transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
      `}</style>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-6">

        {/* Header */}
        <div className="card p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-medium overflow-hidden">
                {profile.avatar
                  ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : profile.username[0].toUpperCase()
                }
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0f]" />
            </div>
            <div>
              <h1 className="font-semibold text-base">{profile.username}</h1>
              <p className="text-xs text-zinc-500 mt-0.5">via {profile.provider} · membre depuis {memberSince}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge">#{profile.rank}</span>
            <button
              onClick={logout}
              className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors duration-200 tracking-wide"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-5">
            <p className="text-xs text-zinc-500 mb-3 tracking-wide uppercase">WPM moyen</p>
            <p className="stat-value">{profile.averageWpm}</p>
            <p className="text-xs text-zinc-600 mt-2">mots / minute</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-zinc-500 mb-3 tracking-wide uppercase">Meilleur WPM</p>
            <p className="stat-value text-yellow-400 rank-glow">{profile.bestWpm}</p>
            <p className="text-xs text-zinc-600 mt-2">record personnel</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-zinc-500 mb-3 tracking-wide uppercase">Précision</p>
            <p className="stat-value">{accuracy}<span className="text-lg text-zinc-500">%</span></p>
            <div className="progress-bar mt-3">
              <div className="progress-fill" style={{ width: `${accuracy}%` }} />
            </div>
          </div>
        </div>

        {/* Citations + Synopsis */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 tracking-wide uppercase">Citations</p>
              <div className="dot bg-blue-400/60" />
            </div>
            <div className="divider" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-zinc-600 mb-1">Parties</p>
                <p className="font-mono text-lg font-medium">{profile.citations.gamesPlayed}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600 mb-1">WPM moy.</p>
                <p className="font-mono text-lg font-medium">{profile.citations.averageWpm}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600 mb-1">Précision</p>
                <p className="font-mono text-lg font-medium">{Math.round(profile.citations.averageAccuracy)}<span className="text-xs text-zinc-500">%</span></p>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 tracking-wide uppercase">Synopsis</p>
              <div className="dot bg-purple-400/60" />
            </div>
            <div className="divider" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-zinc-600 mb-1">Parties</p>
                <p className="font-mono text-lg font-medium">{profile.synopsis.gamesPlayed}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600 mb-1">WPM moy.</p>
                <p className="font-mono text-lg font-medium">{profile.synopsis.averageWpm}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600 mb-1">Précision</p>
                <p className="font-mono text-lg font-medium">{Math.round(profile.synopsis.averageAccuracy)}<span className="text-xs text-zinc-500">%</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Challenges + Activité */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-5 col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-500 tracking-wide uppercase">Challenges</p>
              <div className="dot bg-orange-400/60" />
            </div>
            <div className="divider mb-4" />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-zinc-600 mb-1">Joués</p>
                <p className="stat-value text-2xl">{profile.challengesPlayed}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600 mb-1">Meilleur WPM</p>
                <p className="stat-value text-2xl">{profile.bestChallengeWpm}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600 mb-1">WPM moyen</p>
                <p className="stat-value text-2xl">{profile.avgChallengeWpm}</p>
              </div>
            </div>
          </div>

          <div className="card p-5 flex flex-col justify-between">
            <p className="text-xs text-zinc-500 tracking-wide uppercase">Activité</p>
            <div>
              <p className="stat-value text-2xl">{profile.gamesPlayed}</p>
              <p className="text-xs text-zinc-600 mt-1">parties jouées</p>
            </div>
            <p className="text-xs text-zinc-700">
              {profile.lastPlayedAt
                ? `Dernière le ${new Date(profile.lastPlayedAt).toLocaleDateString('fr-FR')}`
                : 'Aucune partie encore'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors duration-200">
            Jouer
          </button>
          <button className="px-5 py-2.5 card text-sm text-zinc-400 hover:text-white rounded-xl transition-colors duration-200">
            Voir les challenges
          </button>
        </div>

      </main>
    </div>
  );
}