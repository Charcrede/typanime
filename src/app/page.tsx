'use client'
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const words = ["synopsis.", "citations.", "challenges."];

const Home = () => {
    const [text, setText] = useState("");
    const [wordIndex, setWordIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const current = words[wordIndex];
        const speed = isDeleting ? 40 : 80;

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (text.length < current.length) {
                    setText(current.slice(0, text.length + 1));
                } else {
                    setTimeout(() => setIsDeleting(true), 900);
                }
            } else {
                if (text.length > 0) {
                    setText(current.slice(0, text.length - 1));
                } else {
                    setIsDeleting(false);
                    setWordIndex(i => (i + 1) % words.length);
                }
            }
        }, speed);

        return () => clearTimeout(timeout);
    }, [text, isDeleting, wordIndex]);

    return (
        <>
            <style>{`
                

                .home-bg {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                }

                .home-bg video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: brightness(0.35) saturate(0.5);
                }

                /* Vignette sur les bords */
                
            `}</style>

            {/* Fond vidéo */}
            <div className="home-bg">
                <video autoPlay muted loop playsInline>
                    <source src="/assets/bg.mp4" type="video/mp4" />
                </video>
            </div>

            {/* Ligne décorative */}
            <div className="home-line" />

            {/* Contenu principal */}
            <div className="home-content">
                <span className="home-eyebrow">Typanime · Vitesse de frappe</span>

                <h1 className="home-headline">
                    <span className="home-headline-accent">Chaque seconde compte.</span>
                    Chaque faute
                    <br />
                    se paye.
                </h1>

                <div className="home-typewriter-line">
                    <span style={{
                        fontFamily: "'Bebas', sans-serif",
                        fontSize: 'clamp(2.8rem, 8vw, 6.5rem)',
                        letterSpacing: '0.04em',
                        color: 'rgba(255,255,255,0.18)',
                    }}>
                        Lance-toi avec nos
                    </span>
                    <span className="home-typewriter-word">
                        {text}
                        <span className="home-cursor" />
                    </span>
                </div>

                <p className="home-sub">
                    Mesure ta vitesse de frappe sur des synopsis et citations de tes animes préférés. Rivalise, progresse, deviens le plus rapide.
                </p>

                <div className="home-actions">
                    <Link href="/citations" className="btn-start">Commencer</Link>
                    <Link href="/challenges" className="btn-secondary">Voir les challenges</Link>
                </div>
            </div>

            {/* Personnages */}
            <div className="home-chars">
                <div className="home-char-wrap">
                    <Image
                        src="/assets/hashira1.png"
                        alt="Luffy"
                        width={260}
                        height={350}
                        style={{ objectFit: 'contain', objectPosition: 'bottom' }}
                    />
                </div>
                <div className="home-char-wrap">
                    <Image
                        src="/assets/snakehashira.png"
                        alt="Naruto"
                        width={220}
                        height={320}
                        style={{ objectFit: 'contain', objectPosition: 'bottom' }}
                    />
                </div>
            </div>

            {/* Stats en bas à gauche */}
            <div className="home-stats">
                <div className="stat-item">
                    <span className="stat-value">3</span>
                    <span className="stat-label">Modes de jeu</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-value">∞</span>
                    <span className="stat-label">Contenus</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Excuses</span>
                </div>
            </div>
        </>
    )
}

export default Home;