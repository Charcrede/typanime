'use client'
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import seiko from '../../../../public/assets/pngegg (4).png'
import shippai from '../../../../public/assets/anime-33.png'
import Image from 'next/image';
import axios from 'axios';
import { Content } from '@/app/types/content';
import { useUser } from '@/app/context/UserContext';

const Synopsis = ({ params: { id } }: { params: { id: string } }) => {

    const { user } = useUser()
    const apiUrl = process.env.NEXT_PUBLIC_API

    const [synop, setSynop] = useState<Content>()
    const [text, setText] = useState<string[]>([])
    const [letters, setLetters] = useState<string[][]>([])
    const [entry, setEntry] = useState('')
    const [time, setTime] = useState(0)
    const [accuracy, setAccuracy] = useState(100)
    const [speed, setSpeed] = useState(0)
    const [key, setKey] = useState(0)
    const [mention, setMention] = useState('')
    const [pause, setPause] = useState(false)
    const [showGuestPopup, setShowGuestPopup] = useState(false)
    const [finalStats, setFinalStats] = useState<{ wpm: number; accuracy: number; duration: number } | null>(null)

    // Refs pour éviter les problèmes de closure dans les setInterval
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

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const aShippaiRef = useRef<HTMLAudioElement | null>(null)
    const aSeikoRef = useRef<HTMLAudioElement | null>(null)

    // ── Init ──────────────────────────────────────────────────────────────────

    useEffect(() => {
        audioRef.current = new Audio('/assets/sounds/keypress.wav')
        aShippaiRef.current = new Audio('/assets/sounds/shippai.mp3')
        aSeikoRef.current = new Audio('/assets/sounds/seiko.mp3')

        axios.get(`${apiUrl}contents/${id}`).then((resp) => {
            setSynop(resp.data)
            setTimeout(() => initSpans(), 50)
        })
    }, [])

    useEffect(() => {
        if (!synop) return
        const chars = synop.text.split("")
        textRef.current = chars
        setText(chars)
        setLetters(synop.text.split(" ").map(w => w.split("")))
    }, [synop])

    useEffect(() => {
        setTimeout(() => initSpans(), 50)
    }, [key])

    const initSpans = () => {
        const sps = document.querySelectorAll(".lettre")
        const cont = document.getElementById("container") as HTMLElement
        const inp = document.getElementById("input") as HTMLInputElement
        spansRef.current = sps
        containerRef.current = cont
        inputRef.current = inp
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
            if (chars > 4 && timeRef.current > 0) {
                const wpm = Math.ceil((chars * 60) / (timeRef.current * 5))
                setSpeed(Math.max(0, wpm))
            }

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

    const play = () => {
        startTimer()
        setPause(false)
    }

    // ── Résultats ─────────────────────────────────────────────────────────────

    const sendResult = async (wpm: number, acc: number, duration: number) => {
        try {
            await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content_id: parseInt(id),
                    wpm,
                    accuracy: acc,
                    duration,
                    mode: 'synopsis',
                }),
            })
        } catch (err) {
            console.error('Erreur envoi résultat:', err)
        }
    }

    const handleGameEnd = async (finalWpm: number, finalAccuracy: number, finalTime: number) => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        const stats = { wpm: finalWpm, accuracy: finalAccuracy, duration: finalTime }
        setFinalStats(stats)

        if (user) {
            await sendResult(finalWpm, finalAccuracy, finalTime)
        } else {
            // Petit délai pour laisser l'animation mention s'afficher d'abord
            setTimeout(() => setShowGuestPopup(true), 1200)
        }
    }

    // ── Jeu ───────────────────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (mention && !showGuestPopup) return // bloque si partie terminée

        const nativeEvent = e.nativeEvent as InputEvent
        const isDelete = nativeEvent.inputType === 'deleteContentBackward'

        audioRef.current!.currentTime = 0
        audioRef.current!.play()
        autoPause.current = 0

        const ent = e.target.value
        entryRef.current = ent
        setEntry(ent)
        const l = ent.length

        const sps = spansRef.current
        const cont = containerRef.current
        if (!sps) return

        // Démarrer ou reprendre le timer
        if (!isDelete) {
            if (pause) {
                play()
            } else if (l === 1) {
                startTimer()
            }
        }

        if (isDelete) {
            sps[l]?.classList.remove("bg-green-500", "bg-red-500", "text-white")
            sps[l + 1]?.classList.remove("border-b-2", "border-b-primary")
            sps[l]?.classList.add("border-b-2", "border-b-primary")

            // Scroll vers le haut si changement de ligne
            const cur = sps[l] as HTMLElement
            const prev = sps[l + 1] as HTMLElement
            if (cont && cur && prev && cur.offsetTop < prev.offsetTop) {
                cont.scrollTop -= cur.offsetHeight + 15
            }
        } else {
            totalKeysRef.current += 1

            if (textRef.current[l - 1] === ent[l - 1]) {
                sps[l - 1]?.classList.add("bg-green-500", "text-white")
            } else {
                sps[l - 1]?.classList.add("bg-red-500", "text-white")
                errorCountRef.current += 1
            }

            // Déplacer le curseur
            sps[l - 1]?.classList.remove("border-b-2", "border-b-primary")
            sps[l]?.classList.add("border-b-2", "border-b-primary")

            // Précision depuis les refs (pas de décalage state)
            const total = totalKeysRef.current
            const errors = errorCountRef.current
            setAccuracy(total > 0 ? Math.floor(((total - errors) / total) * 100) : 100)

            // Scroll vers le bas si changement de ligne
            const cur = sps[l - 1] as HTMLElement
            const prev = sps[l - 2] as HTMLElement
            if (cont && cur && prev && cur.offsetTop > prev?.offsetTop) {
                if (cur.offsetTop + cur.offsetHeight * 2 > cont.offsetHeight) {
                    cont.scrollTop += cur.offsetHeight + 25
                }
            }

            // Fin de partie
            if (l === textRef.current.length) {
                const finalWpm = timeRef.current > 0
                    ? Math.ceil((l * 60) / (timeRef.current * 5))
                    : speed
                const finalAcc = totalKeysRef.current > 0
                    ? Math.floor(((totalKeysRef.current - errorCountRef.current) / totalKeysRef.current) * 100)
                    : 100

                setSpeed(finalWpm)
                setAccuracy(finalAcc)

                if (finalWpm > 40) {
                    setMention('seiko')
                    aSeikoRef.current!.currentTime = 0
                    aSeikoRef.current!.play()
                } else {
                    setMention('shippai')
                    aShippaiRef.current!.currentTime = 0
                    aShippaiRef.current!.play()
                }

                handleGameEnd(finalWpm, finalAcc, timeRef.current)
            }
        }
    }

    const doubler = (num: number) => num < 10 ? '0' + num : String(num)

    const restart = () => {
        if (stopTimer.current) clearInterval(stopTimer.current)
        errorCountRef.current = 0
        totalKeysRef.current = 0
        timeRef.current = 0
        timerStarted.current = false
        entryRef.current = ''
        autoPause.current = 0
        setEntry('')
        setPause(false)
        setSpeed(0)
        setAccuracy(100)
        setMention('')
        setTime(0)
        setFinalStats(null)
        setShowGuestPopup(false)
        setKey(k => k + 1)
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    // ── HTML ──────────────────────────────────────────────────────────────────

    return (
        <>
            <div className='lg:px-56 xs:z-0 xs:px-4'>
                <div className='lg:text-xl font-semibold xs:text-lg'>
                    <span className='bg-white text-primary mr-2 p-1 border-2 border-white xs:hidden lg:inline'>Synopsis #{synop?.id}</span>
                    <span className='border-2 border-white text-white p-1'>{synop?.title}</span>
                    <Link className='bg-white text-primary p-1 border-2 border-white float-right flex items-center' href={'/citations'}>
                        <svg viewBox="0 0 448 512" className='h-6 w-6 mr-2 fill-primary inline'>
                            <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
                        </svg>
                        Retour
                    </Link>
                </div>

                <div className='lg:m-8 h-[460px] border-2 border-white xs:m-4' key={key}>
                    <div className='relative h-[400px] overflow-hidden'>
                        <img src={`/${synop?.image}`} alt="" className='z-0 h-full w-full object-cover' />
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
                            <div className='absolute top-0 left-0 bottom-0 right-0 bg-black bg-opacity-85 font-Space flex items-center justify-center flex-col gap-4'>
                                <Image alt='résultat' src={mention === 'seiko' ? seiko : shippai} width={125} height={125} />
                                <span className={`text-[4rem] font-bold ${mention === 'shippai' ? 'text-red-500' : 'text-green-500'}`}>
                                    {mention}
                                </span>
                                {finalStats && !showGuestPopup && (
                                    <>
                                        {/* <div className='flex gap-8 text-white text-xl font-bold'>
                                            <span>{finalStats.wpm} MPM</span>
                                            <span>{finalStats.accuracy}%</span>
                                            <span>{doubler(Math.floor(finalStats.duration / 60))}:{doubler(finalStats.duration % 60)}</span>
                                        </div> */}
                                        {/* <button onClick={restart} className='mt-2 px-6 py-2 bg-white text-primary font-bold rounded-full hover:bg-primary hover:text-white border-2 border-white duration-300'>
                                            Rejouer
                                        </button> */}
                                    </>
                                )}
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
                                    Pas mal ! Connecte-toi pour sauvegarder ta progression et suivre ton évolution, ça prend 2 minutes à peine.
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
                            <div className='absolute top-0 left-0 bottom-0 right-0 bg-black bg-opacity-85 font-Space text-[5rem] flex items-center justify-center gap-4 flex-col'>
                                <div className='flex items-center justify-center gap-8'>
                                    <svg viewBox="0 0 512 512" className='fill-white/75 w-20 h-20'>
                                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM224 192V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32s32 14.3 32 32zm128 0V320c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32s32 14.3 32 32z" />
                                    </svg>
                                    <span className="text-white/75">pause</span>
                                </div>
                                <span className='text-xl text-white'>Continuer à saisir pour reprendre</span>
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
                        />
                    </div>

                    {/* Barre de stats */}
                    <div className='bg-primary w-full h-[55px] flex justify-between'>
                        <div className='my-auto ml-4'>
                            <span className='font-Space text-white text-[2.5rem] font-bold mx-2'>{doubler(speed)} MPM</span>
                            <span className='font-Space text-white text-[2.5rem] font-bold mx-2'>{doubler(accuracy)}%</span>
                        </div>
                        <div className='lg:flex p-2 gap-4 xs:hidden'>
                            <Link href={`/synopsis/${parseInt(id) - 1}`} className='flex justify-center items-center rounded-full bg-white px-2'>
                                <svg viewBox="0 0 512 512" className='w-5 h-5 fill-primary'>
                                    <path d="M493.6 445c-11.2 5.3-24.5 3.6-34.1-4.4L288 297.7V416c0 12.4-7.2 23.7-18.4 29s-24.5 3.6-34.1-4.4L64 297.7V416c0 17.7-14.3 32-32 32s-32-14.3-32-32V96C0 78.3 14.3 64 32 64s32 14.3 32 32V214.3L235.5 71.4c9.5-7.9 22.8-9.7 34.1-4.4S288 83.6 288 96V214.3L459.5 71.4c9.5-7.9 22.8-9.7 34.1-4.4S512 83.6 512 96V416c0 12.4-7.2 23.7-18.4 29z" />
                                </svg>
                            </Link>
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
                            <Link href={`/synopsis/${parseInt(id) + 1}`} className='flex justify-center items-center rounded-full bg-white px-2'>
                                <svg viewBox="0 0 512 512" className='w-5 h-5 fill-primary'>
                                    <path d="M18.4 445c11.2 5.3 24.5 3.6 34.1-4.4L224 297.7V416c0 12.4 7.2 23.7 18.4 29s24.5 3.6 34.1-4.4L448 297.7V416c0 17.7 14.3 32 32 32s32-14.3 32-32V96c0-17.7-14.3-32-32-32s-32 14.3-32 32V214.3L276.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S224 83.6 224 96V214.3L52.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S0 83.6 0 96V416c0 12.4 7.2 23.7 18.4 29z" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile block */}
            <div className='top-0 left-0 bottom-0 right-0 flex items-center flex-col bg-black bg-opacity-50 backdrop-blur-sm py-16 xs:fixed lg:hidden'>
                <Image src={'/assets/anya-forger-shocked-face.png'} alt='anya forger' width={200} height={200} className='mb-8 mt-6' />
                <span className='text-2xl text-center px-8 font-bold text-white font-Metropolis'>
                    Tu dois utiliser un ordinateur pour pouvoir jouer et tester ta vitesse
                </span>
                <Link href={'/citations'} className='mt-4 mx-auto text-primary uppercase font-ProductSans text-2xl bg-white rounded-full px-4 font-bold hover:text-white hover:bg-primary duration-300 border border-white'>
                    Retour
                </Link>
            </div>
        </>
    )
}

export default Synopsis;