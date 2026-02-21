// components/ShowCardContent.tsx
import Image from 'next/image';
import { Content } from '../app/types/content';
import { Download, X } from 'lucide-react';
import { useRef } from 'react';
import { toPng } from 'html-to-image';

interface ContentCardProps {
    content: Content;
    hideDetails?: () => void;
}

export default function ShowCardContent({ content, hideDetails }: ContentCardProps) {
    const exportRef = useRef<HTMLDivElement>(null);

    const downloadImage = async () => {
        if (!exportRef.current) return;
        try {
            const dataUrl = await toPng(exportRef.current, {
                quality: 1,
                pixelRatio: 3,
            });
            const link = document.createElement('a');
            const slug = (content.type === 'citation' ? content.author : content.title)
                ?.split(' ').join('-').toLowerCase() ?? 'export';
            link.download = `${content.type}-${slug}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Erreur export:', err);
        }
    };

    const isCitation = content.type === 'citation';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Zen+Kaku+Gothic+New:wght@300;400&display=swap');

                .show-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(8px);
                    padding: 24px;
                    animation: overlayIn 0.3s ease;
                }

                @keyframes overlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .show-container {
                    position: relative;
                    animation: cardIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }

                @keyframes cardIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .show-card {
                    position: relative;
                    overflow: hidden;
                    border-radius: 3px;
                    box-shadow: 0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06);
                }

                .show-card-citation {
                    width: min(420px, 88vw);
                    aspect-ratio: 3/4;
                }

                .show-card-synopsis {
                    width: min(680px, 92vw);
                    aspect-ratio: 16/9;
                }

                .show-card img {
                    filter: brightness(0.55) saturate(0.6);
                }

                /* Grain texture overlay */
                .show-card::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
                    opacity: 0.35;
                    z-index: 3;
                    pointer-events: none;
                    mix-blend-mode: overlay;
                }

                /* Cadre intérieur */
                .show-frame {
                    position: absolute;
                    inset: 12px;
                    border: 1px solid rgba(255,255,255,0.12);
                    z-index: 4;
                    pointer-events: none;
                }

                /* Coins décoratifs */
                .show-frame::before,
                .show-frame::after {
                    content: '';
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    border-color: rgba(255,255,255,0.5);
                    border-style: solid;
                }
                .show-frame::before {
                    top: -1px;
                    left: -1px;
                    border-width: 2px 0 0 2px;
                }
                .show-frame::after {
                    bottom: -1px;
                    right: -1px;
                    border-width: 0 2px 2px 0;
                }

                .show-content {
                    position: absolute;
                    inset: 0;
                    z-index: 5;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 36px;
                }

                .show-quote {
                    font-family: 'Cormorant Garamond', serif;
                    font-style: italic;
                    font-weight: 300;
                    color: rgba(255,255,255,0.92);
                    text-align: center;
                    line-height: 1.7;
                    letter-spacing: 0.01em;
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .show-quote-citation {
                    font-size: clamp(1rem, 3.5vw, 1.35rem);
                }

                .show-quote-synopsis {
                    font-size: clamp(0.75rem, 1.8vw, 1rem);
                    overflow-y: auto;
                    max-height: 100%;
                    scrollbar-width: none;
                    text-align: left;
                    align-items: flex-start;
                }

                .show-quote-synopsis::-webkit-scrollbar { display: none; }

                .show-separator {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    justify-content: center;
                    margin-top: 20px;
                    flex-shrink: 0;
                }

                .show-sep-line {
                    flex: 1;
                    max-width: 60px;
                    height: 1px;
                    background: rgba(255,255,255,0.25);
                }

                .show-attribution {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1rem;
                    letter-spacing: 0.2em;
                    color: rgba(255,255,255,0.6);
                    white-space: nowrap;
                }

                /* Type badge haut gauche */
                .show-type-badge {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    z-index: 6;
                    font-family: 'Zen Kaku Gothic New', sans-serif;
                    font-size: 0.6rem;
                    letter-spacing: 0.25em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.3);
                }

                /* Boutons flottants */
                .show-controls {
                    display: flex;
                    gap: 10px;
                }

                .show-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 2px;
                    font-family: 'Zen Kaku Gothic New', sans-serif;
                    font-size: 0.7rem;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .show-btn-close {
                    background: rgba(255,255,255,0.06);
                    color: rgba(255,255,255,0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .show-btn-close:hover {
                    background: rgba(255,255,255,0.12);
                    color: white;
                }

                .show-btn-download {
                    background: white;
                    color: black;
                }

                .show-btn-download:hover {
                    background: rgba(255,255,255,0.85);
                }
            `}</style>

            <div className="show-overlay" onClick={hideDetails}>
                <div className="show-container" onClick={e => e.stopPropagation()}>

                    {/* Carte exportable */}
                    <div
                        ref={exportRef}
                        className={`show-card ${isCitation ? 'show-card-citation' : 'show-card-synopsis'}`}
                    >
                        <Image
                            src={'/' + content.image}
                            alt={content.title}
                            fill
                            className="object-cover"
                        />

                        {/* Dégradé cinématique */}
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 2,
                            background: isCitation
                                ? 'linear-gradient(160deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
                                : 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)'
                        }} />

                        {/* Cadre */}
                        <div className="show-frame" />

                        {/* Badge type */}
                        <span className="show-type-badge">{content.type}</span>

                        {/* Contenu */}
                        <div className="show-content">
                            <div className={`show-quote ${isCitation ? 'show-quote-citation' : 'show-quote-synopsis'}`}>
                                {isCitation ? `"${content.text}"` : content.text}
                            </div>

                            <div className="show-separator">
                                <div className="show-sep-line" />
                                <span className="show-attribution">
                                    {isCitation ? content.author : content.title}
                                </span>
                                <div className="show-sep-line" />
                            </div>
                        </div>
                    </div>

                    {/* Contrôles sous la carte */}
                    <div className="show-controls">
                        <button className="show-btn show-btn-close" onClick={hideDetails}>
                            <X size={12} />
                            Fermer
                        </button>
                        <button className="show-btn show-btn-download" onClick={downloadImage}>
                            <Download size={12} />
                            Télécharger
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}