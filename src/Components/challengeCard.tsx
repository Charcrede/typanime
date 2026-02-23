import { useUser } from "@/app/context/UserContext"
import { Challenge } from "@/app/types/challenge"
import { Trophy, Link2, Check } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function ChallengeCard({ challenge: c, currentUserId, onJoin, showAlert }: {
    challenge: Challenge
    currentUserId?: number
    onJoin: () => void
    showAlert?: () => void
}) {
    const [copied, setCopied] = useState(false)
    const { user, logout } = useUser();
    const timeLeft = (expires_at: string) => {
        const diff = new Date(expires_at).getTime() - Date.now()
        if (diff <= 0) return 'Expiré'
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        if (h > 0) return `${h}h ${m}m`
        return `${m}m`
    }

    const copyLink = () => {
        const base = window.location.origin + window.location.pathname
        const url = `${base}?q=${encodeURIComponent(c.title)}`
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const isExpired = (expires_at: string) => new Date(expires_at).getTime() < Date.now()
    const expired = isExpired(c.expires_at)
    const joined = c.participants.some(p => p.user_id === currentUserId)
    const full = c.participants.length >= c.max_players
    const fillPct = Math.min(100, (c.participants.length / c.max_players) * 100)
    const best = c.participants.length > 0 ? Math.max(...c.participants.map(p => p.wpm)) : null

    return (
        <div className={`card p-5 ${expired ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`chip text-xs ${expired ? 'bg-zinc-800 text-zinc-500' : 'bg-white/10 text-white/70'}`}>
                            {expired ? 'Expiré' : timeLeft(c.expires_at)}
                        </span>
                        <span className="chip bg-white/5 text-zinc-500">{c.content.type}</span>
                        {joined && <span className="chip bg-emerald-500/15 text-emerald-400">Participé</span>}
                    </div>

                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-base truncate">{c.title}</h2>
                        {/* Bouton copie lien — discret, inline avec le titre */}
                        <button
                            onClick={copyLink}
                            title="Copier le lien"
                            className="shrink-0 flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors duration-200"
                        >
                            {copied
                                ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-400 font-mono">Copié</span></>
                                : <Link2 className="w-3 h-3" />
                            }
                        </button>
                    </div>

                    <p className="text-zinc-500 text-sm mt-0.5 truncate">
                        {c.content.author ? `${c.content.author} · ` : ''}{c.content.title}
                    </p>

                    {/* Participants */}
                    <div className="mt-3 flex items-center gap-3">
                        <div className="bar flex-1">
                            <div className="bar-fill" style={{ width: `${fillPct}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">
                            {c.participants.length}/{c.max_players}
                        </span>
                        {best !== null && (
                            <span className="text-xs text-zinc-400 font-mono whitespace-nowrap flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-400" /> {best} MPM
                            </span>
                        )}
                    </div>
                </div>
                {user ? (
                    <Link
                        href={"/challenges/" + c.id}
                        // disabled={expired || full}
                        className={`shrink-0 self-center btn-primary`}
                    >
                        {full ? 'Complet' : expired ? 'Expiré' : joined ? 'Rejouer' : 'Jouer'}
                    </Link>
                ) : (
                    <button
                       onClick={showAlert}
                        // disabled={expired || full}
                        className={`shrink-0 self-center btn-primary`}
                    >
                        {full ? 'Complet' : expired ? 'Expiré' : joined ? 'Rejouer' : 'Jouer'}
                    </button>
                )}
            </div>
        </div>
    )
}

export default ChallengeCard