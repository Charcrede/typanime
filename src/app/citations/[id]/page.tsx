'use client'
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import seiko from '../../../../public/assets/pngegg (4).png'
import shippai from '../../../../public/assets/anime-33.png'
import Image from 'next/image';
import axios from 'axios';
import { Content } from '@/app/types/content';
import { useUser } from '@/app/context/UserContext';
import { Volume2, VolumeOff } from 'lucide-react';

// ── Normalisation anti-caractères spéciaux ────────────────────────────────────
const normalizeChar = (c: string) =>
    c.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
     .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
     .replace(/\u2013|\u2014/g, '-')
     .replace(/\u2026/g, '...')
     .replace(/\u00A0/g, ' ')

const normalizeText = (t: string) => t.split('').map(normalizeChar).join('')

// ── Seuils anti-triche ────────────────────────────────────────────────────────
const MIN_ACCURACY    = 70
const MAX_KEY_STREAK  = 6


const Citations = ({ params: { id } }: { params: { id: string } }) => {

    const { user } = useUser()
    const apiUrl = process.env.NEXT_PUBLIC_API

    const [cit, setCit]               = useState<Content>()
    const [text, setText]             = useState<string[]>([])
    const [letters, setLetters]       = useState<string[][]>([])
    const [entry, setEntry]           = useState('')
    const [time, setTime]             = useState(0)
    const [accuracy, setAccuracy]     = useState(100)
    const [speed, setSpeed]           = useState(0)
    const [key, setKey]               = useState(0)
    const [mention, setMention]       = useState('')
    const [pause, setPause]           = useState(false)
    const [showGuestPopup, setShowGuestPopup] = useState(false)
    const [finalStats, setFinalStats] = useState<{ wpm: number; accuracy: number; duration: number } | null>(null)
    const [soundEnabled, setSoundEnabled]     = useState(true)
    const [invalidated, setInvalidated]       = useState(false)
    const [cheatMsg, setCheatMsg]             = useState('')

    // Refs
    const entryRef        = useRef('')
    const errorCountRef   = useRef(0)
    const totalKeysRef    = useRef(0)
    const timeRef         = useRef(0)
    const timerStarted    = useRef(false)
    const autoPause       = useRef(0)
    const stopTimer       = useRef<ReturnType<typeof setInterval> | null>(null)
    const spansRef        = useRef<NodeListOf<Element> | null>(null)
    const containerRef    = useRef<HTMLElement | null>(null)
    const inputRef        = useRef<HTMLInputElement | null>(null)
    const textRef         = useRef<string[]>([])
    const lastKeyRef      = useRef('')
    const sameKeyStreak   = useRef(0)
    const soundRef        = useRef(true) // ref pour accès dans handleChange sans closure
    const audioRef        = useRef<HTMLAudioElement | null>(null)
    const aShippaiRef     = useRef<HTMLAudioElement | null>(null)
    const aSeikoRef       = useRef<HTMLAudioElement | null>(null)

    // Sync ref avec state son
    useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

    // ── Init ──────────────────────────────────────────────────────────────────

    useEffect(() => {
        audioRef.current   = new Audio('/assets/sounds/keypress.wav')
        aShippaiRef.current = new Audio('/assets/sounds/shippai.mp3')
        aSeikoRef.current  = new Audio('/assets/sounds/seiko.mp3')

        axios.get(`${apiUrl}contents/${id}`).then((resp) => {
            setCit(resp.data)
            setTimeout(() => initSpans(), 50)
        })
    }, [])

    useEffect(() => {
        if (!cit) return
        const normalized = normalizeText(cit.text)
        const chars = normalized.split("")
        textRef.current = chars
        setText(chars)
        setLetters(normalized.split(" ").map(w => w.split("")))
    }, [cit])

    useEffect(() => {
        setTimeout(() => initSpans(), 50)
    }, [key])

    const initSpans = () => {
        const sps = document.querySelectorAll(".lettre")
        const cont = document.getElementById("container") as HTMLElement
        const inp  = document.getElementById("input") as HTMLInputElement
        spansRef.current    = sps
        containerRef.current = cont
        inputRef.current    = inp
        if (sps[0]) sps[0].classList.add("border-b-2", "border-b-primary")
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
        if (typedChar === lastKeyRef.current) {
            sameKeyStreak.current += 1
        } else {
            sameKeyStreak.current = 1
            lastKeyRef.current = typedChar
        }
        return sameKeyStreak.current >= MAX_KEY_STREAK
    }

    const invalidate = (msg: string) => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        setCheatMsg(msg)
        setInvalidated(true)
        setMention('shippai')
    }

    // ── Résultats ─────────────────────────────────────────────────────────────

    const sendResult = async (wpm: number, acc: number, duration: number) => {
        try {
            await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content_id: parseInt(id), wpm, accuracy: acc, duration, mode: 'citation' }),
            })
        } catch (err) { console.error('Erreur envoi résultat:', err) }
    }

    const handleGameEnd = async (finalWpm: number, finalAcc: number, finalTime: number) => {
        if (stopTimer.current) clearInterval(stopTimer.current)

        // Refus si précision trop basse
        if (finalAcc < MIN_ACCURACY) {
            invalidate(`Précision trop basse (${finalAcc}%) — minimum ${MIN_ACCURACY}% requis.`)
            return
        }

        const stats = { wpm: finalWpm, accuracy: finalAcc, duration: finalTime }
        setFinalStats(stats)

        if (user) {
            await sendResult(finalWpm, finalAcc, finalTime)
        } else {
            setTimeout(() => setShowGuestPopup(true), 1200)
        }
    }

    // ── Jeu ───────────────────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if ((mention && !showGuestPopup) || invalidated) return

        const nativeEvent = e.nativeEvent as InputEvent
        const isDelete    = nativeEvent.inputType === 'deleteContentBackward'

        if (soundRef.current && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play()
        }
        autoPause.current = 0

        const ent = e.target.value
        const l   = ent.length
        const typedChar = normalizeChar(ent[l - 1] ?? '')

        // Anti-spam (sauf backspace)
        if (!isDelete) {
            if (detectCheat(typedChar)) {
                invalidate('Spam de touche détecté — partie invalidée.')
                return
            }
        } else {
            sameKeyStreak.current = 0
            lastKeyRef.current = ''
        }

        entryRef.current = ent
        setEntry(ent)

        const sps  = spansRef.current
        const cont = containerRef.current
        if (!sps) return

        if (!isDelete) {
            if (pause) play()
            else if (l === 1) startTimer()
        }

        if (isDelete) {
            sps[l]?.classList.remove("bg-green-500", "bg-red-500", "text-white")
            sps[l + 1]?.classList.remove("border-b-2", "border-b-primary")
            sps[l]?.classList.add("border-b-2", "border-b-primary")
            const cur  = sps[l] as HTMLElement
            const prev = sps[l + 1] as HTMLElement
            if (cont && cur && prev && cur.offsetTop < prev.offsetTop)
                cont.scrollTop -= cur.offsetHeight + 15
        } else {
            totalKeysRef.current += 1
            const expected  = textRef.current[l - 1]
            const isCorrect = expected === typedChar

            if (isCorrect) {
                sps[l - 1]?.classList.add("bg-green-500", "text-white")
            } else {
                sps[l - 1]?.classList.add("bg-red-500", "text-white")
                errorCountRef.current += 1
            }

            sps[l - 1]?.classList.remove("border-b-2", "border-b-primary")
            sps[l]?.classList.add("border-b-2", "border-b-primary")

            const total = totalKeysRef.current
            const acc   = total > 0 ? Math.floor(((total - errorCountRef.current) / total) * 100) : 100
            setAccuracy(acc)

            const cur  = sps[l - 1] as HTMLElement
            const prev = sps[l - 2] as HTMLElement
            if (cont && cur && prev && cur.offsetTop > prev?.offsetTop)
                if (cur.offsetTop + cur.offsetHeight * 2 > cont.offsetHeight)
                    cont.scrollTop += cur.offsetHeight + 25

            if (l === textRef.current.length) {
                const finalWpm = timeRef.current > 0
                    ? Math.ceil((l * 60) / (timeRef.current * 5)) : speed
                const finalAcc = total > 0
                    ? Math.floor(((total - errorCountRef.current) / total) * 100) : 100

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

    const doubler = (n: number) => n < 10 ? '0' + n : String(n)

    const restart = () => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        errorCountRef.current = 0
        totalKeysRef.current  = 0
        timeRef.current       = 0
        timerStarted.current  = false
        entryRef.current      = ''
        autoPause.current     = 0
        lastKeyRef.current    = ''
        sameKeyStreak.current = 0
        setEntry('')
        setPause(false)
        setSpeed(0)
        setAccuracy(100)
        setMention('')
        setTime(0)
        setFinalStats(null)
        setShowGuestPopup(false)
        setInvalidated(false)
        setCheatMsg('')
        setKey(k => k + 1)
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    // ── HTML ──────────────────────────────────────────────────────────────────

    return (
        <>
            <style>{`
                .citations-bar { background: var(--color-primary, #1a1a2e); }
                .accuracy-warn { color: #f87171; }
            `}</style>

            <div className='lg:px-56 xs:z-0 xs:px-4'>

                {/* Fil d'ariane */}
                <div className='lg:text-xl font-semibold xs:text-lg flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <span className='bg-white text-primary mr-2 p-1 border-2 border-white xs:hidden lg:inline'>
                            Citation #{cit?.id}
                        </span>
                        <span className='border-2 border-white text-white p-1'>{cit?.author}</span>
                    </div>
                    <Link className='bg-white text-primary p-1 border-2 border-white flex items-center' href='/citations'>
                        <svg viewBox="0 0 448 512" className='h-6 w-6 mr-2 fill-primary inline'>
                            <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
                        </svg>
                        Retour
                    </Link>
                </div>

                <div className='lg:m-8 h-[460px] border-2 border-white xs:m-4' key={key}>
                    <div className='relative h-[400px] overflow-hidden'>
                        <img src={`/${cit?.image}`} alt="" className='z-0 h-full w-full object-cover' />
                        <div className='absolute top-0 bottom-0 left-0 right-0 bg-white bg-opacity-65 z-0' />

                        <div
                            className='absolute text-primary top-0 left-0 right-0 bottom-0 lg:text-[3rem] xs:text-[2rem] xs:p-4 lg:p-8 h-[400px] overflow-scroll duration-300'
                            id='container'
                        >
                            {letters.map((el, i) => (
                                <span key={i}>
                                    {el.map((l, j) => <span key={j} className='lettre'>{l}</span>)}
                                    <span className='lettre'> </span>
                                </span>
                            ))}
                        </div>

                        {/* Fin de partie */}
                        {mention && (
                            <div className='absolute top-0 left-0 bottom-0 right-0 bg-black bg-opacity-90 font-Space flex items-center justify-center flex-col gap-4'>
                                <Image alt='résultat' src={mention === 'seiko' ? seiko : shippai} width={125} height={125} />
                                <span className={`text-[4rem] font-bold ${mention === 'shippai' ? 'text-red-500' : 'text-green-500'}`}>
                                    {mention}
                                </span>

                                {/* Message d'invalidation */}
                                {invalidated && (
                                    <div className='text-center px-8'>
                                        <p className='text-red-400 font-bold text-lg'>{cheatMsg}</p>
                                        <p className='text-zinc-500 text-sm mt-1'>Joue fairplay pour que ton score soit comptabilisé.</p>
                                    </div>
                                )}

                                {/* Stats si valide et pas invité */}
                                {finalStats && !showGuestPopup && !invalidated && (
                                    <div className='flex gap-8 text-white text-xl font-bold'>
                                        <span>{finalStats.wpm} MPM</span>
                                        <span>{finalStats.accuracy}%</span>
                                        <span>{doubler(Math.floor(finalStats.duration / 60))}:{doubler(finalStats.duration % 60)}</span>
                                    </div>
                                )}

                                <button
                                    onClick={restart}
                                    className='mt-2 px-6 py-2 bg-white text-primary font-bold rounded-full hover:bg-primary hover:text-white border-2 border-white duration-300'
                                >
                                    Rejouer
                                </button>
                            </div>
                        )}

                        {/* Popup invité */}
                        {showGuestPopup && (
                            <div className='absolute top-0 left-0 bottom-0 right-0 bg-black bg-opacity-95 flex items-center justify-center flex-col gap-5 px-8 text-center z-10'>
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

                        {/* Pause */}
                        {pause && !mention && (
                            <div className='absolute top-0 left-0 bottom-0 right-0 bg-black bg-opacity-85 font-Space flex items-center justify-center gap-4 flex-col'>
                                <div className='flex items-center justify-center gap-8'>
                                    <svg viewBox="0 0 512 512" className='fill-white/75 w-20 h-20'>
                                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM224 192V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32s32 14.3 32 32zm128 0V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32s32 14.3 32 32z" />
                                    </svg>
                                    <span className="text-white/75 text-5xl">pause</span>
                                </div>
                                <span className='text-xl text-white'>Continuer à saisir pour reprendre</span>
                            </div>
                        )}

                        {/* Indicateur précision faible (avertissement en cours de partie) */}
                        {!mention && accuracy < MIN_ACCURACY && totalKeysRef.current > 10 && (
                            <div className='absolute top-3 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-xs font-bold px-4 py-1.5 rounded-full z-10 backdrop-blur-sm'>
                                ⚠ Précision trop basse — min {MIN_ACCURACY}%
                            </div>
                        )}

                        <input
                            id='input'
                            autoCorrect='off'
                            autoComplete='off'
                            autoCapitalize="off"
                            type="text"
                            autoFocus
                            className='absolute top-0 left-0 right-0 bottom-0 opacity-0 cursor-default'
                            value={entry}
                            onChange={handleChange}
                            disabled={invalidated}
                        />
                    </div>

                    {/* Barre de stats */}
                    <div className='citations-bar w-full h-[55px] flex justify-between'>
                        <div className='my-auto ml-4 flex items-center gap-1'>
                            <span className='font-Space text-white text-[2.5rem] font-bold mx-2'>{doubler(speed)} MPM</span>
                            <span className={`font-Space text-[2.5rem] font-bold mx-2 ${accuracy < MIN_ACCURACY && totalKeysRef.current > 5 ? 'text-red-400' : 'text-white'}`}>
                                {doubler(accuracy)}%
                            </span>
                        </div>
                        <div className='lg:flex p-2 gap-3 xs:hidden items-center'>

                            {/* Bouton son */}
                            <button
                                onClick={() => setSoundEnabled(s => !s)}
                                title={soundEnabled ? 'Couper le son' : 'Activer le son'}
                                className='flex justify-center items-center rounded-full bg-white px-2 h-8 w-8 text-primary  transition-opacity'
                            >
                                {soundEnabled ? <Volume2 /> : <VolumeOff />}
                            </button>

                            {/* <Link href={`/citations/${parseInt(id) - 1}`} className='flex justify-center items-center rounded-full bg-white px-2'>
                                <svg viewBox="0 0 512 512" className='w-5 h-5 fill-primary'>
                                    <path d="M493.6 445c-11.2 5.3-24.5 3.6-34.1-4.4L288 297.7V416c0 12.4-7.2 23.7-18.4 29s-24.5 3.6-34.1-4.4L64 297.7V416c0 17.7-14.3 32-32 32s-32-14.3-32-32V96C0 78.3 14.3 64 32 64s32 14.3 32 32V214.3L235.5 71.4c9.5-7.9 22.8-9.7 34.1-4.4S288 83.6 288 96V214.3L459.5 71.4c9.5-7.9 22.8-9.7 34.1-4.4S512 83.6 512 96V416c0 12.4-7.2 23.7-18.4 29z" />
                                </svg>
                            </Link> */}
                            <button
                                onClick={pause ? () => inputRef.current?.focus() : pauser}
                                className='flex justify-center items-center rounded-full bg-white px-2'
                            >
                                <svg viewBox="0 0 320 512" className='w-5 h-5 fill-primary duration-500'>
                                    {!pause
                                        ? <path d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z" />
                                        : <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                                    }
                                </svg>
                            </button>
                            <button onClick={restart} className='flex justify-center items-center rounded-full bg-white px-2'>
                                <svg viewBox="0 0 512 512" className='w-5 h-5 fill-primary'>
                                    <path d="M0 224c0 17.7 14.3 32 32 32s32-14.3 32-32c0-53 43-96 96-96H320v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S320 19.1 320 32V64H160C71.6 64 0 135.6 0 224zm512 64c0-17.7-14.3-32-32-32s-32 14.3-32 32c0 53-43 96-96 96H192V352c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V448H352c88.4 0 160-71.6 160-160z" />
                                </svg>
                            </button>
                            {/* <Link href={`/citations/${parseInt(id) + 1}`} className='flex justify-center items-center rounded-full bg-white px-2'>
                                <svg viewBox="0 0 512 512" className='w-5 h-5 fill-primary'>
                                    <path d="M18.4 445c11.2 5.3 24.5 3.6 34.1-4.4L224 297.7V416c0 12.4 7.2 23.7 18.4 29s24.5 3.6 34.1-4.4L448 297.7V416c0 17.7 14.3 32 32 32s32-14.3 32-32V96c0-17.7-14.3-32-32-32s-32 14.3-32 32V214.3L276.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S224 83.6 224 96V214.3L52.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S0 83.6 0 96V416c0 12.4 7.2 23.7 18.4 29z" />
                                </svg>
                            </Link> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile block */}
            <div className='top-0 left-0 bottom-0 right-0 flex items-center flex-col bg-black bg-opacity-50 backdrop-blur-sm py-16 xs:fixed lg:hidden'>
                <Image src='/assets/anya-forger-shocked-face.png' alt='anya forger' width={200} height={200} className='mb-8 mt-6' />
                <span className='text-2xl text-center px-8 font-bold text-white font-Metropolis'>
                    Tu dois utiliser un ordinateur pour pouvoir jouer et tester ta vitesse
                </span>
                <Link href='/citations' className='mt-4 mx-auto text-primary uppercase font-ProductSans text-2xl bg-white rounded-full px-4 font-bold hover:text-white hover:bg-primary duration-300 border border-white'>
                    Retour
                </Link>
            </div>
        </>
    )
}

export default Citations;