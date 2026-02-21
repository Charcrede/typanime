'use client'
import { Challenge } from "@/app/types/challenge";
import { Ban, BicepsFlexed, Trophy } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const normalizeChar = (c: string) =>
    c.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
     .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
     .replace(/\u2013|\u2014/g, '-')
     .replace(/\u2026/g, '...')
     .replace(/\u00A0/g, ' ')

const normalizeText = (t: string) => t.split('').map(normalizeChar).join('')

const MIN_ACCURACY   = 70
const MAX_KEY_STREAK = 6

function GameModal({ challenge, userId, onClose }: { challenge: Challenge; userId: number; onClose: () => void }) {
    const text    = normalizeText(challenge.content.text).split("")
    const letters = normalizeText(challenge.content.text).split(" ").map(w => w.split(""))

    // ── Seulement les states UI stricts (pas de logique de jeu ici) ───────────
    const [speed,       setSpeed]       = useState(0)
    const [accuracy,    setAccuracy]    = useState(100)
    const [finished,    setFinished]    = useState(false)
    const [invalidated, setInvalidated] = useState(false)
    const [cheatMsg,    setCheatMsg]    = useState('')
    const [key,         setKey]         = useState(0)

    // ── Toute la logique de jeu dans des refs — zéro re-render dans la boucle chaude ──
    const inputRef     = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const spansRef     = useRef<HTMLSpanElement[]>([])
    const audioRef     = useRef<HTMLAudioElement | null>(null)

    const posRef         = useRef(0)
    const errorRef       = useRef(0)
    const totalRef       = useRef(0)
    const timeRef        = useRef(0)
    const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
    const timerStarted   = useRef(false)
    const finishedRef    = useRef(false)
    const invalidRef     = useRef(false)
    const submittedRef   = useRef(false)
    const lastKeyRef     = useRef('')
    const streakRef      = useRef(0)

    useEffect(() => {
        audioRef.current = new Audio('/assets/sounds/keypress.wav')
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    // Reconstruire les refs de spans après reset
    useEffect(() => {
        const t = setTimeout(() => {
            spansRef.current = Array.from(document.querySelectorAll('.g-lettre')) as HTMLSpanElement[]
            const first = spansRef.current[0]
            if (first) first.style.borderBottom = '2px solid #1a1a2e'
            inputRef.current?.focus()
        }, 30)
        return () => clearTimeout(t)
    }, [key])

    const startTimer = () => {
        if (timerStarted.current) return
        timerStarted.current = true
        timerRef.current = setInterval(() => {
            timeRef.current += 1
            const pos = posRef.current
            if (pos > 4) setSpeed(Math.ceil((pos * 60) / (timeRef.current * 5)))
        }, 1000)
    }

    const invalidate = (msg: string) => {
        if (timerRef.current) clearInterval(timerRef.current)
        invalidRef.current  = true
        finishedRef.current = true
        setCheatMsg(msg)
        setInvalidated(true)
        setFinished(true)
    }

    const submitResult = (wpm: number, acc: number) => {
        if (submittedRef.current) return
        submittedRef.current = true
        fetch(`/api/challenges/${challenge.id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wpm, accuracy: acc }),
        })
    }

    // ── Coeur du jeu : DOM direct, onKeyDown, zéro setState dans la boucle ───
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (finishedRef.current || invalidRef.current) { e.preventDefault(); return }

        const isBackspace = e.key === 'Backspace'
        if (!isBackspace && e.key.length !== 1) return

        e.preventDefault()

        // Son immédiat
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {})
        }

        const sps  = spansRef.current
        const cont = containerRef.current
        const pos  = posRef.current

        if (isBackspace) {
            if (pos === 0) return
            const newPos = pos - 1
            posRef.current = newPos

            const span = sps[newPos]
            if (span) {
                span.style.background   = ''
                span.style.color        = ''
                span.style.borderBottom = '2px solid #1a1a2e'
            }
            if (sps[pos]) sps[pos].style.borderBottom = ''

            if (cont && span && sps[pos] && span.offsetTop < (sps[pos] as HTMLElement).offsetTop)
                cont.scrollTop -= span.offsetHeight + 15

            streakRef.current  = 0
            lastKeyRef.current = ''
            return
        }

        const typedChar = normalizeChar(e.key)

        // Anti-spam
        if (typedChar === lastKeyRef.current) streakRef.current += 1
        else { streakRef.current = 1; lastKeyRef.current = typedChar }

        if (streakRef.current >= MAX_KEY_STREAK) {
            invalidate('Spam de touche détecté — partie invalidée.')
            return
        }

        if (pos === 0) startTimer()

        const isCorrect = text[pos] === typedChar

        // ── Coloration synchrone, avant tout re-render React ─────────────────
        const span = sps[pos]
        if (span) {
            span.style.borderBottom = ''
            span.style.color        = 'white'
            span.style.borderRadius = '2px'
            span.style.background   = isCorrect ? '#16a34a' : '#dc2626'
            if (!isCorrect) errorRef.current += 1
        }

        const newPos = pos + 1
        posRef.current = newPos
        totalRef.current += 1

        if (sps[newPos]) (sps[newPos] as HTMLElement).style.borderBottom = '2px solid #1a1a2e'

        // Scroll
        if (cont && span && sps[newPos]) {
            const next = sps[newPos] as HTMLElement
            if (next.offsetTop > span.offsetTop && next.offsetTop + next.offsetHeight * 2 > cont.offsetHeight)
                cont.scrollTop += span.offsetHeight + 25
        }

        // Mise à jour précision toutes les 5 frappes seulement → moins de re-renders
        if (totalRef.current % 5 === 0) {
            setAccuracy(Math.floor(((totalRef.current - errorRef.current) / totalRef.current) * 100))
        }

        // Fin de partie
        if (newPos === text.length) {
            if (timerRef.current) clearInterval(timerRef.current)
            const finalAcc = Math.floor(((totalRef.current - errorRef.current) / totalRef.current) * 100)
            const finalWpm = timeRef.current > 0 ? Math.ceil((newPos * 60) / (timeRef.current * 5)) : 0
            finishedRef.current = true
            setAccuracy(finalAcc)
            setSpeed(finalWpm)
            setFinished(true)
            if (finalAcc < MIN_ACCURACY) {
                invalidate(`Précision insuffisante (${finalAcc}%) — minimum ${MIN_ACCURACY}% requis.`)
            } else {
                submitResult(finalWpm, finalAcc)
            }
        }
    }

    const restart = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        posRef.current       = 0
        errorRef.current     = 0
        totalRef.current     = 0
        timeRef.current      = 0
        timerStarted.current = false
        finishedRef.current  = false
        invalidRef.current   = false
        submittedRef.current = false
        lastKeyRef.current   = ''
        streakRef.current    = 0
        setSpeed(0)
        setAccuracy(100)
        setFinished(false)
        setInvalidated(false)
        setCheatMsg('')
        setKey(k => k + 1)
    }

    const doubler = (n: number) => n < 10 ? '0' + n : String(n)

    const timeLeft = (expires_at: string) => {
        const diff = new Date(expires_at).getTime() - Date.now()
        if (diff <= 0) return 'Expiré'
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        return h > 0 ? `${h}h ${m}m` : `${m}m`
    }

    return (
        <div className="overlay">
            <div style={{ background: '#0c0c0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '100%', maxWidth: '780px', overflow: 'hidden' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div>
                        <h2 className="font-semibold">{challenge.title}</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">{challenge.content.author || challenge.content.title}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors text-xl">✕</button>
                </div>

                {/* Zone de texte */}
                <div key={key} className="relative" style={{ height: '280px' }}>
                    <img src={`/${challenge.content.image}`} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.65)' }} />

                    <div
                        ref={containerRef}
                        className="absolute inset-0 overflow-y-scroll"
                        style={{ fontSize: '1.9rem', padding: '1.5rem', color: '#1a1a2e' }}
                    >
                        {letters.map((word, i) => (
                            <span key={i}>
                                {word.map((l, j) => (
                                    <span key={j} className="g-lettre" style={{ display: 'inline', borderRadius: '2px' }}>{l}</span>
                                ))}
                                <span className="g-lettre" style={{ display: 'inline' }}> </span>
                            </span>
                        ))}
                    </div>

                    {finished && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
                            {invalidated ? (
                                <>
                                    <Ban className="w-12 h-12 text-red-500" />
                                    <p className="text-red-400 font-bold text-lg text-center px-8">{cheatMsg}</p>
                                    <p className="text-zinc-500 text-sm text-center px-8">Joue fairplay pour que ton score soit comptabilisé.</p>
                                    <button onClick={restart} className="btn-primary mt-2">Réessayer</button>
                                </>
                            ) : (
                                <>
                                    {speed > 40 ? <Trophy className="w-12 h-12 text-yellow-400" /> : <BicepsFlexed className="w-12 h-12 text-[#e8c9a0]" />}
                                    <div className="flex gap-8 text-white text-2xl font-bold font-mono">
                                        <span>{speed} MPM</span>
                                        <span>{accuracy}%</span>
                                        <span>{doubler(Math.floor(timeRef.current / 60))}:{doubler(timeRef.current % 60)}</span>
                                    </div>
                                    <p className="text-zinc-400 text-sm">Résultat sauvegardé !</p>
                                    <div className="flex gap-3">
                                        <button onClick={restart} className="btn-primary">Rejouer</button>
                                        <button onClick={onClose} className="btn-ghost">Fermer</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Input non contrôlé — onKeyDown pur, React ne touche pas à la valeur */}
                    <input
                        ref={inputRef}
                        autoFocus
                        autoCorrect="off"
                        autoComplete="off"
                        autoCapitalize="off"
                        className="absolute inset-0 opacity-0 cursor-default"
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {/* Barre de stats */}
                <div className="flex items-center justify-between px-6 py-3" style={{ background: '#1a1a2e', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex gap-6 items-center">
                        <span className="font-mono text-2xl font-bold">
                            {doubler(speed)} <span className="text-sm text-zinc-500 font-sans font-normal">MPM</span>
                        </span>
                        <span className={`font-mono text-2xl font-bold ${accuracy < MIN_ACCURACY && totalRef.current > 5 ? 'text-red-400' : ''}`}>
                            {doubler(accuracy)}<span className="text-sm text-zinc-500 font-sans font-normal">%</span>
                        </span>
                        {accuracy < MIN_ACCURACY && totalRef.current > 5 && !finished && (
                            <span className="text-xs text-red-400 self-center">min {MIN_ACCURACY}%</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{challenge.participants.length}/{challenge.max_players} joueurs</span>
                        <span>·</span>
                        <span>{timeLeft(challenge.expires_at)}</span>
                    </div>
                </div>

                {/* Classement */}
                {challenge.participants.length > 0 && (
                    <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Classement actuel</p>
                        <div className="space-y-2">
                            {[...challenge.participants]
                                .sort((a, b) => b.wpm - a.wpm)
                                .slice(0, 5)
                                .map((p, idx) => (
                                    <div key={p.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-zinc-600 font-mono w-4">{idx + 1}</span>
                                            <span className="text-sm text-zinc-300">
                                                {p.user_id === userId ? 'Toi' : `${p.user.username}`}
                                            </span>
                                        </div>
                                        <div className="flex gap-4 text-sm font-mono">
                                            <span className="text-white">{p.wpm} MPM</span>
                                            <span className="text-zinc-500">{Math.round(p.accuracy)}%</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GameModal