'use client'
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import { Challenge } from '../types/challenge';
import GameModal from '@/Components/challengeGameModal';
import ChallengeCard from '@/Components/challengeCard';
import CreateChallengeModal from '@/Components/challengeCreate';

const isExpired = (expires_at: string) => new Date(expires_at).getTime() < Date.now()

function ChallengesContent() {
    const { user } = useUser()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [challenges, setChallenges]         = useState<Challenge[]>([])
    const [filtered, setFiltered]             = useState<Challenge[]>([])
    const [loading, setLoading]               = useState(true)
    const [search, setSearch]                 = useState(searchParams.get('q') ?? '')
    const [showCreate, setShowCreate]         = useState(false)
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null)
    const [showGuestAlert, setShowGuestAlert] = useState(false)

    const searchRef = useRef(search)

    useEffect(() => {
        fetchChallenges()
        const interval = setInterval(fetchChallenges, 15000)
        return () => clearInterval(interval)
    }, [])

    const fetchChallenges = async () => {
        try {
            const res = await fetch('/api/challenges')
            const data: Challenge[] = await res.json()
            setChallenges(data)
            applyFilter(data, searchRef.current)
        } finally {
            setLoading(false)
        }
    }

    // Filtre : si query vide → tout afficher, sinon filtre par nom
    const applyFilter = (all: Challenge[], q: string) => {
        const trimmed = q.trim().toLowerCase()
        if (!trimmed) {
            setFiltered(all)
        } else {
            const match = all.filter(c => c.title.toLowerCase().includes(trimmed))
            setFiltered(match.length > 0 ? match : all)
        }
    }

    const handleSearch = (value: string) => {
        setSearch(value)
        searchRef.current = value
        applyFilter(challenges, value)

        // Mettre à jour l'URL sans recharger la page
        const params = new URLSearchParams()
        if (value.trim()) params.set('q', value.trim())
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    const handleJoin = (challenge: Challenge) => {
        if (!user) { setShowGuestAlert(true); return }
        if (isExpired(challenge.expires_at)) return
        setActiveChallenge(challenge)
    }

    const activeCount = filtered.filter(c => !isExpired(c.expires_at)).length
    const isFiltering = search.trim().length > 0
    const noMatch     = isFiltering && challenges.length > 0 && filtered.length === challenges.length && !challenges.some(c => c.title.toLowerCase().includes(search.trim().toLowerCase()))

    return (
        <div className="min-h-screen text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
                .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; transition: all 0.2s; }
                .card:hover { background: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.13); }
                .chip { font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; }
                .btn-primary { background: white; color: black; font-weight: 600; padding: 8px 20px; border-radius: 999px; font-size: 0.85rem; transition: all 0.2s; border: 2px solid white; cursor: pointer; }
                .btn-primary:hover { background: transparent; color: white; }
                .btn-ghost { background: transparent; color: rgba(255,255,255,0.5); font-weight: 500; padding: 8px 20px; border-radius: 999px; font-size: 0.85rem; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.12); cursor: pointer; }
                .btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: white; }
                .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 50; display: flex; align-items: center; justify-content: center; }
                .modal { background: #141418; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 2rem; width: 100%; max-width: 480px; }
                .input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: white; font-size: 0.9rem; width: 100%; outline: none; transition: border-color 0.2s; font-family: 'DM Sans', sans-serif; }
                .input:focus { border-color: rgba(255,255,255,0.3); }
                .input::placeholder { color: rgba(255,255,255,0.25); }
                .bar { height: 3px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
                .bar-fill { height: 100%; border-radius: 999px; background: white; transition: width 0.5s ease; }
                select.input option { background: #141418; }
                .search-wrap { position: relative; flex: 1; max-width: 320px; }
                .search-wrap input { padding-left: 36px; }
                .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: 0.3; pointer-events: none; }
                .search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 1rem; line-height: 1; padding: 2px 4px; transition: color 0.2s; }
                .search-clear:hover { color: white; }
                .no-match-banner { font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); text-align: center; padding: 8px 0 0; }
            `}</style>

            <main className="max-w-5xl mx-auto px-6 py-14">

                {/* Header */}
                <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
                    <div>
                        <p className="chip text-white/50 mb-2" style={{ letterSpacing: '0.15em' }}>TYPANIME</p>
                        <h1 className="text-3xl font-semibold font-Space text-[2rem] uppercase tracking-tight">Challenges</h1>
                        <p className="text-white/50 text-sm mt-1">
                            {activeCount} actif{activeCount > 1 ? 's' : ''}
                            {isFiltering && !noMatch && (
                                <span className="ml-2 text-white/30">· filtrés sur «&nbsp;{search}&nbsp;»</span>
                            )}
                        </p>
                    </div>
                    <button className="btn-primary" onClick={() => user ? setShowCreate(true) : setShowGuestAlert(true)}>
                        + Créer un challenge
                    </button>
                </div>

                {/* Barre de recherche */}
                <div className="mb-8">
                    <div className="search-wrap">
                        <svg className="search-icon" viewBox="0 0 512 512" width="14" fill="white">
                            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                        </svg>
                        <input
                            className="input"
                            placeholder="Rechercher un challenge..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                        {search && (
                            <button className="search-clear" onClick={() => handleSearch('')}>✕</button>
                        )}
                    </div>
                    {noMatch && (
                        <p className="no-match-banner">
                            Aucun challenge trouvé pour «&nbsp;{search}&nbsp;» — tous les challenges sont affichés
                        </p>
                    )}
                </div>

                {/* Liste */}
                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card p-16 text-center">
                        <p className="text-4xl mb-4">🎌</p>
                        <p className="text-zinc-400">Aucun challenge pour l&apos;instant.</p>
                        <p className="text-zinc-600 text-sm mt-1">Sois le premier à en créer un !</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filtered.map(c => (
                            <ChallengeCard
                                key={c.id}
                                challenge={c}
                                currentUserId={user?.id as number | undefined}
                                onJoin={() => handleJoin(c)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {showCreate && (
                <CreateChallengeModal
                    onClose={() => setShowCreate(false)}
                    onCreated={() => { setShowCreate(false); fetchChallenges() }}
                />
            )}

            {activeChallenge && (
                <GameModal
                    challenge={activeChallenge}
                    userId={user?.id as number}
                    onClose={() => { setActiveChallenge(null); fetchChallenges() }}
                />
            )}

            {showGuestAlert && (
                <div className="overlay" onClick={() => setShowGuestAlert(false)}>
                    <div className="modal text-center" onClick={e => e.stopPropagation()}>
                        <div className="text-4xl mb-4">🎌</div>
                        <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
                        <p className="text-zinc-400 text-sm mb-6">Tu dois être connecté pour participer ou créer un challenge.</p>
                        <div className="flex gap-3 justify-center">
                            <Link href="/auth/login" className="btn-primary">Se connecter</Link>
                            <button className="btn-ghost" onClick={() => setShowGuestAlert(false)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function ChallengesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}>
            <ChallengesContent />
        </Suspense>
    )
}