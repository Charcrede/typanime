'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useUser } from '@/app/context/UserContext'
import { ArrowLeft, Pause, Play, RefreshCcw, Trophy, Volume2, VolumeOff } from 'lucide-react'
import ArcStars from '@/Components/arcStars'
import { Challenge } from '@/app/types/challenge'
import { Participant } from '@/app/types/participant'
import TypingGame from '@/Components/typingGame'

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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ChallengeGamePage({ params: { id } }: { params: { id: string } }) {
    const { user } = useUser()

    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [participants, setParticipants] = useState<Participant[]>([])
    const [letters, setLetters] = useState<string[][]>([])
    const [entry, setEntry] = useState('')
    const [time, setTime] = useState(0)
    const [accuracy, setAccuracy] = useState(100)
    const [speed, setSpeed] = useState(0)
    const [key, setKey] = useState(0)
    const [mention, setMention] = useState('')
    const [pause, setPause] = useState(false)
    const [finalStats, setFinalStats] = useState<{ wpm: number; accuracy: number; duration: number } | null>(null)
    const [soundEnabled, setSoundEnabled] = useState(false)
    const [invalidated, setInvalidated] = useState(false)
    const [cheatMsg, setCheatMsg] = useState('')
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

        fetch(`/api/challenges/${id}`)
            .then(r => r.json())
            .then((data: Challenge) => {
                setChallenge(data)
                setParticipants(data.participants ?? [])
                const normalized = normalizeText(data.content.text)
                textRef.current = normalized.split('')
                setLetters(normalized.split(' ').map(w => w.split('')))
                setTimeout(() => initSpans(), 50)
            })
    }, [id])

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
            setTime(t => t + 1)
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

    // ── Résultats ─────────────────────────────────────────────────────────────
    const sendResult = async (wpm: number, acc: number) => {
        if (!challenge) return
        try {
            const res = await fetch(`/api/challenges/${challenge.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wpm, accuracy: acc }),
            })
            if (res.ok) {
                // Rafraîchir le classement après soumission
                const updated: Challenge = await fetch(`/api/challenges/${id}`).then(r => r.json())
                setParticipants(updated.participants ?? [])
                setRankUpdated(true)
            }
        } catch (err) { console.error('Erreur envoi résultat:', err) }
    }

    const handleGameEnd = async (finalWpm: number, finalAcc: number, finalTime: number) => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        if (finalAcc < MIN_ACCURACY) {
            invalidate(`Précision trop basse (${finalAcc}%) — minimum ${MIN_ACCURACY}% requis.`)
            return
        }
        setFinalStats({ wpm: finalWpm, accuracy: finalAcc, duration: finalTime })
        if (user) await sendResult(finalWpm, finalAcc)
    }

    // ── Jeu ───────────────────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if ((mention && !finalStats) || invalidated) return

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
                    cont.scrollTop += cur.offsetHeight + 25

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
    const isExpired = (expires_at: string) => new Date(expires_at).getTime() < Date.now()
    const handleSound = (s: boolean) => { setSoundEnabled(s); localStorage.setItem('sound', String(s)) }

    const restart = () => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        errorCountRef.current = 0; totalKeysRef.current = 0; timeRef.current = 0
        timerStarted.current = false; entryRef.current = ''; autoPause.current = 0
        lastKeyRef.current = ''; sameKeyStreak.current = 0
        setEntry(''); setPause(false); setSpeed(0); setAccuracy(100)
        setMention(''); setTime(0); setFinalStats(null)
        setInvalidated(false); setCheatMsg(''); setRankUpdated(false)
        setKey(k => k + 1)
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    if (!challenge) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    )

    const myRank = user
        ? [...participants].sort((a, b) => b.wpm - a.wpm).findIndex(p => p.user_id === user.id) + 1
        : null

    return (
        <div className='min-h-screen'>
            {challenge ? (
                <TypingGame
                    mode="challenge"
                    content={challenge.content}
                    challenge={{ id: challenge.id, title: challenge.title, max_players: challenge.max_players, participants: challenge.participants }}
                    backHref="/challenges"
                    breadcrumb={<><span className="border-2 border-white text-white p-1">{challenge.title}</span></>}
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-64 gap-3">
                    <div className="w-6 h-6 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
                    <p className="cit-subtitle">Chargement</p>
                </div>
            )}
        </div>
    )
}