'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useUser } from '@/app/context/UserContext'
import { ArrowLeft, Pause, Play, RefreshCcw, Trophy, Volume2, VolumeOff } from 'lucide-react'
import ArcStars from '@/Components/arcStars'
import { Challenge } from '@/app/types/challenge'
import { Content } from '@/app/types/content'
import { Participant } from '@/app/types/participant'
import ChallengeCard from './challengeCard'

// ── Normalisation ─────────────────────────────────────────────────────────────
const normalizeChar = (c: string) =>
    c.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/\u2013|\u2014/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/\u00A0/g, ' ')

const normalizeText = (t: string) => t.split('').map(normalizeChar).join('')

const MIN_ACCURACY = 70
const MAX_KEY_STREAK = 6

// ── Types ─────────────────────────────────────────────────────────────────────
export type GameMode = 'citation' | 'synopsis' | 'challenge'

interface BaseProps {
    mode: GameMode
    content: Content
    backHref: string
    backLabel?: string
    breadcrumb?: React.ReactNode  // ex: "Citation #4" ou "Challenge: Mon titre"
}

interface CitationSynopsisProps extends BaseProps {
    mode: 'citation' | 'synopsis'
    contentId: number
    challenge?: never
}

interface ChallengeProps extends BaseProps {
    mode: 'challenge'
    contentId?: never
    challenge: Challenge
}

type TypingGameProps = CitationSynopsisProps | ChallengeProps

// ── Composant ─────────────────────────────────────────────────────────────────
export default function TypingGame(props: TypingGameProps) {
    const { mode, content, backHref, backLabel = 'Retour', breadcrumb } = props
    const { user } = useUser()

    const [letters, setLetters] = useState<string[][]>([])
    const [entry, setEntry] = useState('')
    const [accuracy, setAccuracy] = useState(100)
    const [speed, setSpeed] = useState(0)
    const [key, setKey] = useState(0)
    const [mention, setMention] = useState('')
    const [pause, setPause] = useState(false)
    const [showGuestPopup, setShowGuestPopup] = useState(false)
    const [finalStats, setFinalStats] = useState<{ wpm: number; accuracy: number; duration: number } | null>(null)
    const [soundEnabled, setSoundEnabled] = useState(false)
    const [invalidated, setInvalidated] = useState(false)
    const [cheatMsg, setCheatMsg] = useState('')

    // Challenge-only state
    const [participants, setParticipants] = useState<Participant[]>(
        mode === 'challenge' ? props.challenge.participants : []
    )
    const [rankUpdated, setRankUpdated] = useState(false)

    // Refs jeu
    const entryRef = useRef('')
    const errorCountRef = useRef(0)
    const totalKeysRef = useRef(0)
    const timeRef = useRef(0)
    const timerStarted = useRef(false)
    const autoPause = useRef(0)
    const stopTimer = useRef<ReturnType<typeof setInterval> | null>(null)
    const spansRef = useRef<NodeListOf<Element> | null>(null)
    const containerRef = useRef<HTMLElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const textRef = useRef<string[]>([])
    const lastKeyRef = useRef('')
    const sameKeyStreak = useRef(0)
    const soundRef = useRef(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const aShippaiRef = useRef<HTMLAudioElement | null>(null)
    const aSeikoRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

    // ── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        audioRef.current = new Audio('/assets/sounds/keypress.wav')
        aShippaiRef.current = new Audio('/assets/sounds/shippai.mp3')
        aSeikoRef.current = new Audio('/assets/sounds/seiko.mp3')

        const sound = localStorage.getItem('sound')
        setSoundEnabled(sound === 'true')

        const normalized = normalizeText(content.text)
        textRef.current = normalized.split('')
        setLetters(normalized.split(' ').map(w => w.split('')))
        setTimeout(() => initSpans(), 50)
    }, [content])

    useEffect(() => {
        setTimeout(() => initSpans(), 50)
    }, [key])

    const initSpans = () => {
        const sps = document.querySelectorAll('.lettre')
        const cont = document.getElementById('container') as HTMLElement
        const inp = document.getElementById('input') as HTMLInputElement
        spansRef.current = sps
        containerRef.current = cont
        inputRef.current = inp
        if (sps[0]) sps[0].classList.add('border-b-2', 'border-gray-300')
    }

    // ── Timer ─────────────────────────────────────────────────────────────────
    const startTimer = () => {
        if (timerStarted.current) return
        timerStarted.current = true
        stopTimer.current = setInterval(() => {
            autoPause.current += 1
            timeRef.current += 1
            const chars = entryRef.current.length
            if (chars > 4 && timeRef.current > 0)
                setSpeed(Math.max(0, Math.ceil((chars * 60) / (timeRef.current * 5))))
            if (autoPause.current >= 5) pauser()
        }, 1000)
    }

    const pauser = () => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        timerStarted.current = false
        autoPause.current = 0
        setPause(true)
        inputRef.current?.focus()
    }

    const play = () => { startTimer(); setPause(false) }

    // ── Anti-triche ───────────────────────────────────────────────────────────
    const detectCheat = (typedChar: string): boolean => {
        if (typedChar === lastKeyRef.current) sameKeyStreak.current += 1
        else { sameKeyStreak.current = 1; lastKeyRef.current = typedChar }
        return sameKeyStreak.current >= MAX_KEY_STREAK
    }

    const invalidate = (msg: string) => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        setCheatMsg(msg)
        setInvalidated(true)
        setMention('shippai')
    }

    // ── Envoi résultat ────────────────────────────────────────────────────────
    const sendResult = async (wpm: number, acc: number, duration: number) => {
        if (mode === 'challenge') {
            const res = await fetch(`/api/challenges/${props.challenge.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wpm, accuracy: acc }),
            })
            if (res.ok) {
                // Rafraîchir le classement
                const updated = await fetch(`/api/challenges/${props.challenge.id}`).then(r => r.json())
                setParticipants(updated.participants ?? [])
                setRankUpdated(true)
            }
        } else {
            await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content_id: content.id,
                    wpm, accuracy: acc, duration,
                    mode,
                }),
            })
        }
    }

    const handleGameEnd = async (finalWpm: number, finalAcc: number, finalTime: number) => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        if (finalAcc < MIN_ACCURACY) { invalidate(`Précision trop basse (${finalAcc}%) — minimum ${MIN_ACCURACY}% requis.`); return }

        setFinalStats({ wpm: finalWpm, accuracy: finalAcc, duration: finalTime })

        if (user) {
            await sendResult(finalWpm, finalAcc, finalTime)
        } else if (mode !== 'challenge') {
            setTimeout(() => setShowGuestPopup(true), 1200)
        }
    }

    // ── Jeu ───────────────────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if ((mention && !showGuestPopup) || invalidated) return

        const nativeEvent = e.nativeEvent as InputEvent
        const isDelete = nativeEvent.inputType === 'deleteContentBackward'

        if (soundRef.current && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play()
        }
        autoPause.current = 0

        const ent = e.target.value
        const l = ent.length
        const typedChar = normalizeChar(ent[l - 1] ?? '')

        if (!isDelete) {
            if (detectCheat(typedChar)) { invalidate('Spam de touche détecté — partie invalidée.'); return }
        } else {
            sameKeyStreak.current = 0
            lastKeyRef.current = ''
        }

        entryRef.current = ent
        setEntry(ent)

        const sps = spansRef.current
        const cont = containerRef.current
        if (!sps) return

        if (!isDelete) {
            if (pause) play()
            else if (l === 1) startTimer()
        }

        if (isDelete) {
            sps[l]?.classList.remove('bg-success', 'text-[#28ee81]', 'bg-[#fc785e]', 'text-[#8b0000]')
            sps[l + 1]?.classList.remove('border-b-2', 'border-gray-300')
            sps[l]?.classList.add('border-b-2', 'border-gray-300')
            const cur = sps[l] as HTMLElement
            const prev = sps[l + 1] as HTMLElement
            if (cont && cur && prev && cur.offsetTop < prev.offsetTop)
                cont.scrollTop -= cur.offsetHeight + 15
        } else {
            totalKeysRef.current += 1
            const expected = textRef.current[l - 1]
            const isCorrect = expected === typedChar

            if (isCorrect) sps[l - 1]?.classList.add('bg-success', 'text-[#28ee81]')
            else { sps[l - 1]?.classList.add('bg-[#fc785e]', 'retry', 'text-[#8b0000]'); errorCountRef.current += 1 }

            sps[l - 1]?.classList.remove('border-b-2', 'border-gray-300')
            sps[l]?.classList.add('border-b-2', 'border-gray-300')

            const total = totalKeysRef.current
            const acc = total > 0 ? Math.floor(((total - errorCountRef.current) / total) * 100) : 100
            setAccuracy(acc)

            const cur = sps[l - 1] as HTMLElement
            const prev = sps[l - 2] as HTMLElement
            if (cont && cur && prev && cur.offsetTop > prev?.offsetTop)
                if (cur.offsetTop + cur.offsetHeight * 2 > cont.offsetHeight)
                    cont.scrollTop += cur.offsetHeight + 15

            if (l === textRef.current.length) {
                const finalWpm = timeRef.current > 0 ? Math.ceil((l * 60) / (timeRef.current * 5)) : speed
                const finalAcc = total > 0 ? Math.floor(((total - errorCountRef.current) / total) * 100) : 100
                setSpeed(finalWpm)
                setAccuracy(finalAcc)

                if (finalAcc >= MIN_ACCURACY && finalWpm > 40) {
                    setMention('seiko')
                    if (soundRef.current && aSeikoRef.current) { aSeikoRef.current.currentTime = 0; aSeikoRef.current.play() }
                } else if (finalAcc >= MIN_ACCURACY) {
                    setMention('shippai')
                    if (soundRef.current && aShippaiRef.current) { aShippaiRef.current.currentTime = 0; aShippaiRef.current.play() }
                }

                handleGameEnd(finalWpm, finalAcc, timeRef.current)
            }
        }
    }

    const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    const doubler = (n: number) => n < 10 ? '0' + n : String(n)
    const handleSound = (s: boolean) => { setSoundEnabled(s); localStorage.setItem('sound', String(s)) }
    const isExpired = (expires_at: string) => new Date(expires_at).getTime() < Date.now()

    const restart = () => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        errorCountRef.current = 0; totalKeysRef.current = 0; timeRef.current = 0
        timerStarted.current = false; entryRef.current = ''; autoPause.current = 0
        lastKeyRef.current = ''; sameKeyStreak.current = 0
        setEntry(''); setPause(false); setSpeed(0); setAccuracy(100)
        setMention(''); setFinalStats(null); setShowGuestPopup(false)
        setInvalidated(false); setCheatMsg(''); setRankUpdated(false)
        setKey(k => k + 1)
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    const myRank = mode === 'challenge' && user
        ? [...participants].sort((a, b) => b.wpm - a.wpm).findIndex(p => p.user_id === user.id) + 1
        : null

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <div className='lg:px-56 mt-16 xs:z-0 xs:px-4'>

                {/* Header */}
                <div className='lg:text-xl mb-8 font-semibold xs:text-lg flex items-center justify-between'>
                    <div className='flex items-center gap-2 flex-wrap'>
                        {breadcrumb}
                    </div>
                    <Link className='bg-white text-primary p-1 border-2 border-white flex items-center gap-1' href={backHref}>
                        <ArrowLeft className="w-6 h-6 text-primary" />
                        {backLabel}
                    </Link>
                </div>

                {/* Zone de jeu */}

                <div hidden={mode === 'challenge' && isExpired(props.challenge.expires_at)} className='lg:m-8 border-b border-white xs:m-4' key={key}>
                    <div className='relative h-[400px] overflow-hidden'>
                        <img src={`/${content.image}`} alt="" className='z-0 h-full w-full object-cover' />
                        <div className='absolute top-0 bottom-0 left-0 right-0 bg-black/70 z-0' />

                        <div
                            className='absolute text-gray-200 top-0 left-0 right-0 bottom-0 lg:text-[2.5rem] xs:text-[2rem] xs:p-4 lg:p-8 h-[400px] overflow-scroll duration-300'
                            id='container'
                        >
                            {letters.map((word, i) => (
                                <span key={i}>
                                    {word.map((l, j) => <span key={j} className='lettre mx-[0.75px] rounded-sm'>{l}</span>)}
                                    <span className='lettre mx-[0.75px] rounded-sm'> </span>
                                </span>
                            ))}
                        </div>

                        {/* ── Fin de partie ──────────────────────────────────── */}
                        {mention && (
                            <div className='absolute top-0 left-0 bottom-0 right-0 bg-black/90 flex items-center justify-center flex-col gap-4 pt-8'>
                                <ArcStars wpm={finalStats?.wpm ?? 0} />
                                <div className='flex items-center gap-1 relative -top-[20%]'>
                                    <span className='font-Bebas text-white text-[3rem] mx-2'>{doubler(speed)} MPM</span>
                                    <span className={`font-Bebas text-[3rem] mx-2 ${accuracy < MIN_ACCURACY ? 'text-red-400' : 'text-white'}`}>
                                        {doubler(accuracy)}%
                                    </span>
                                    <span className='font-Bebas text-[3rem] lowercase text-white mx-2'>
                                    {formatDuration(finalStats?.duration ?? 0)}
                                </span>
                                </div>
                                <button onClick={restart} className='text-black gap-2 bg-white text-2xl font-Bebas flex justify-center items-center rounded-xl cursor-pointer hover:bg-white/70 duration-500 px-4 py-2 relative -top-[20%]'>
                                    <RefreshCcw className='w-5 h-5 text-black' />Rejouer
                                </button>
                                
                                {/* Rang challenge */}
                                {mode === 'challenge' && rankUpdated && myRank && myRank > 0 && (
                                    <div className='flex items-center gap-2'>
                                        <Trophy className='w-5 h-5 text-yellow-400' />
                                        <span className='font-Bebas text-2xl text-yellow-400'>#{myRank} au classement</span>
                                    </div>
                                )}
                                {/* Invalidation */}
                                {invalidated && (
                                    <div className='text-center px-8 relative -top-[14%]'>
                                        <p className='text-red-400 font-bold text-lg'>{cheatMsg}</p>
                                        <p className='text-zinc-500 text-sm mt-1'>Joue fairplay pour que ton score soit comptabilisé.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Popup invité ─────────────────────────────────── */}
                        {showGuestPopup && (
                            <div className='absolute top-0 left-0 bottom-0 right-0 bg-black/95 flex items-center justify-center flex-col gap-5 px-8 text-center z-10'>
                                <div className='text-5xl'>🎌</div>
                                {finalStats && (
                                    <div className='flex gap-6 text-white text-2xl font-bold font-Space'>
                                        <span>{finalStats.wpm} MPM</span>
                                        <span>{finalStats.accuracy}%</span>
                                    </div>
                                )}
                                <p className='text-white text-lg font-Space leading-relaxed max-w-sm'>
                                    Pas mal ! Connecte-toi pour sauvegarder ta progression — ça prend 2 minutes.
                                </p>
                                <div className='flex gap-4 flex-wrap justify-center'>
                                    <Link href='/auth/login' className='px-6 py-2 bg-white text-primary font-bold rounded-full hover:bg-primary hover:text-white border-2 border-white duration-300'>
                                        Se connecter
                                    </Link>
                                    <button onClick={restart} className='px-6 py-2 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-primary duration-300'>
                                        Continuer sans compte
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Pause ────────────────────────────────────────── */}
                        {pause && !mention && (
                            <div className='absolute top-0 left-0 bottom-0 right-0 bg-black/85 flex items-center justify-center gap-4 flex-col'>
                                <div className='flex items-center justify-center gap-8'>
                                    <svg viewBox="0 0 512 512" className='fill-white/75 w-20 h-20'>
                                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM224 192V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32s32 14.3 32 32zm128 0V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32s32 14.3 32 32z" />
                                    </svg>
                                    <span className="text-white/75 text-5xl">pause</span>
                                </div>
                                <span className='text-xl text-white'>Continuer à saisir pour reprendre</span>
                            </div>
                        )}

                        {/* ── Warning précision ────────────────────────────── */}
                        {!mention && accuracy < MIN_ACCURACY && totalKeysRef.current > 10 && (
                            <div className='absolute top-3 left-1/2 -translate-x-1/2 bg-[#fc785e]/90 text-white text-xs font-bold px-4 py-1.5 rounded-full z-10 backdrop-blur-sm'>
                                ⚠ Précision trop basse — min {MIN_ACCURACY}%
                            </div>
                        )}

                        <input
                            id='input'
                            autoCorrect='off' autoComplete='off' autoCapitalize='off'
                            type='text' autoFocus
                            className='absolute top-0 left-0 right-0 bottom-0 opacity-0 cursor-default'
                            value={entry}
                            onChange={handleChange}
                            disabled={invalidated}
                            hidden={!!finalStats?.duration}
                        />
                    </div>

                    {/* Barre de stats */}
                    <div className='citations-bar w-full mt-1 flex justify-between'>
                        <div className='my-auto ml-4 flex items-center gap-1'>
                            <span className='font-Bebas text-white text-[2rem] mx-2'>{doubler(speed)} MPM</span>
                            <span className={`font-Bebas text-[2rem] mx-2 ${accuracy < MIN_ACCURACY && totalKeysRef.current > 5 ? 'text-red-400' : 'text-white'}`}>
                                {doubler(accuracy)}%
                            </span>
                        </div>
                        <div className='flex p-2 gap-3 items-center'>
                            <button onClick={() => handleSound(!soundEnabled)} title={soundEnabled ? 'Couper le son' : 'Activer le son'} className='text-white'>
                                {soundEnabled ? <Volume2 className='w-5 h-5' /> : <VolumeOff className='w-5 h-5' />}
                            </button>
                            <button onClick={pause ? () => inputRef.current?.focus() : pauser} className='p-2'>
                                {pause ? <Pause className='w-5 h-5 text-white' /> : <Play className='w-5 h-5 text-white' />}
                            </button>
                            <button onClick={restart} className='p-2'>
                                <RefreshCcw className='w-5 h-5 text-white' />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Classement (challenge uniquement) ─────────────────────────────── */}
                {mode === 'challenge' && (
                    <div className='lg:mx-8 xs:mx-4 mb-12'>
                        <div className='flex items-center justify-between mb-4'>
                            <h3 className='font-Bebas text-2xl text-white tracking-widest'>Classement</h3>
                            <div className='flex items-center gap-3 text-sm text-white/40'>
                                <span>{participants.length}/{props.challenge.max_players} joueurs</span>
                                {rankUpdated && (
                                    <span className='text-emerald-400 text-xs font-mono animate-pulse'>↑ mis à jour</span>
                                )}
                            </div>
                        </div>

                        {participants.length === 0 ? (
                            <p className='text-white/30 text-sm'>Aucun participant — sois le premier !</p>
                        ) : (
                            <div className='flex flex-col gap-2'>
                                {[...participants]
                                    .sort((a, b) => b.wpm - a.wpm)
                                    .map((p, idx) => {
                                        const isMe = user && p.user_id === user.id
                                        const medals = ['🥇', '🥈', '🥉']
                                        return (
                                            <div
                                                key={p.id}
                                                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-500 ${isMe ? 'border-white/30 bg-white/[0.08]' : 'border-white/[0.07] bg-white/[0.03]'
                                                    } ${rankUpdated && isMe ? 'ring-1 ring-emerald-400/40' : ''}`}
                                            >
                                                <div className='flex items-center gap-3'>
                                                    <span className='w-6 text-center'>
                                                        {medals[idx] ?? <span className='text-white/30 font-mono text-xs'>{idx + 1}</span>}
                                                    </span>
                                                    <span className={`text-sm font-medium ${isMe ? 'text-white' : 'text-white/60'}`}>
                                                        {isMe ? 'Toi' : `Joueur #${p.user_id}`}
                                                    </span>
                                                </div>
                                                <div className='flex items-center gap-6 font-mono text-sm'>
                                                    <span className={`font-bold ${isMe ? 'text-white' : 'text-white/50'}`}>{p.wpm} MPM</span>
                                                    <span className='text-white/30'>{Math.round(p.accuracy)}%</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile block */}
            <div className='top-0 left-0 bottom-0 right-0 flex items-center flex-col bg-black/50 backdrop-blur-sm py-16 xs:fixed md:hidden'>
                <Image src='/assets/anya-forger-shocked-face.png' alt='anya forger' width={200} height={200} className='mb-8 mt-6' />
                <span className='text-2xl text-center px-8 font-bold text-white font-Metropolis'>
                    Tu dois utiliser un ordinateur pour pouvoir jouer et tester ta vitesse
                </span>
                <Link href={backHref} className='mt-4 mx-auto text-primary uppercase font-ProductSans text-2xl bg-white rounded-full px-4 font-bold hover:text-white hover:bg-primary duration-300 border border-white'>
                    {backLabel}
                </Link>
            </div>
        </>
    )
}