'use client'
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import seiko from '../../../../public/assets/pngegg (4).png'
import shippai from '../../../../public/assets/anime-33.png'
import Image from 'next/image';
import axios from 'axios';
import { Content } from '@/app/types/content';
import { useUser } from '@/app/context/UserContext';
import { ArrowLeft, Pause, Play, RefreshCcw, Star, Volume2, VolumeOff } from 'lucide-react';
import ArcStars from '@/Components/arcStars';
import TypingGame from '@/Components/typingGame';

// ── Normalisation anti-caractères spéciaux ────────────────────────────────────
const normalizeChar = (c: string) =>
	c.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
		.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
		.replace(/\u2013|\u2014/g, '-')
		.replace(/\u2026/g, '...')
		.replace(/\u00A0/g, ' ')

const normalizeText = (t: string) => t.split('').map(normalizeChar).join('')

// ── Seuils anti-triche ────────────────────────────────────────────────────────
const MIN_ACCURACY = 70
const MAX_KEY_STREAK = 6


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
	const [soundEnabled, setSoundEnabled] = useState(true)
	const [invalidated, setInvalidated] = useState(false)
	const [cheatMsg, setCheatMsg] = useState('')

	// Refs
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
	const soundRef = useRef(true) // ref pour accès dans handleChange sans closure
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const aShippaiRef = useRef<HTMLAudioElement | null>(null)
	const aSeikoRef = useRef<HTMLAudioElement | null>(null)

	// Sync ref avec state son
	useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

	// ── Init ──────────────────────────────────────────────────────────────────

	useEffect(() => {
		audioRef.current = new Audio('/assets/sounds/keypress.wav')
		aShippaiRef.current = new Audio('/assets/sounds/shippai.mp3')
		aSeikoRef.current = new Audio('/assets/sounds/seiko.mp3')

		axios.get(`${apiUrl}contents/${id}`).then((resp) => {
			setSynop(resp.data)
		})
		const sound = localStorage.getItem('sound')
		setSoundEnabled(sound ? sound == "true" ? true : false : false)
	}, [])

	useEffect(() => {
		if (!synop) return
		const normalized = normalizeText(synop.text)
		const chars = normalized.split("")
		textRef.current = chars
		setText(chars)
		setLetters(normalized.split(" ").map(w => w.split("")))
	}, [synop])


	// ── HTML ──────────────────────────────────────────────────────────────────

	return (
		<div className='min-h-screen'>
			{synop ? (
				<TypingGame
					mode="synopsis"
					content={synop}
					contentId={parseInt(id)}
					backHref="/synopsis"
					breadcrumb={<><span className="bg-white text-primary p-1 border-2 border-white">Synopsis #{synop.id}</span><span className="border-2 border-white text-white p-1">{synop.title}</span></>}
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

export default Synopsis;