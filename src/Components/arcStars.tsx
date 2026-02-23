'use client'
import { Star } from 'lucide-react'

// ═══════════════════════════════════════════════════════
// ⚙️  CONFIGURATION — modifie ces valeurs librement
// ═══════════════════════════════════════════════════════

const RADIUS      = 280   // rayon du cercle imaginaire (px) — plus grand = arc plus large et aplati
const ARC_SPREAD  = 40   // demi-angle total de l'arc en degrés (ex: 90 = arc serré, 130 = arc très ouvert)
const STAR_SIZE   = 70    // taille des étoiles en px
const W           = 520   // largeur du conteneur (px)
const H           = 230   // hauteur du conteneur (px)
// Le centre du cercle se trouve toujours au centre horizontal,
// et à (H + RADIUS * 0.3) px sous le haut — ajuste si les étoiles sortent du cadre
const CY_OFFSET   = 80    // px sous le bas du conteneur où se trouve le centre du cercle

// ═══════════════════════════════════════════════════════

function getStars(wpm: number): number {
    if (wpm >= 80) return 5
    if (wpm >= 60) return 4
    if (wpm >= 45) return 3
    if (wpm >= 30) return 2
    if (wpm >= 20) return 1
    return 0
}

function buildArcPositions() {
    const cx = W / 2
    const cy = H + CY_OFFSET

    // 5 angles répartis symétriquement autour de -90° (haut)
    // -90° = sommet du cercle, on étale de -90 ± ARC_SPREAD
    const angles = [-90 - ARC_SPREAD, -90 - ARC_SPREAD / 2, -90, -90 + ARC_SPREAD / 2, -90 + ARC_SPREAD]

    return angles.map(deg => {
        const rad = deg * Math.PI / 180
        const px  = cx + RADIUS * Math.cos(rad)
        const py  = cy + RADIUS * Math.sin(rad)
        return {
            x:      (px / W) * 100,
            y:      (py / H) * 100,
            rotate: deg + 90,   // tangente à l'arc = inclinaison naturelle de l'étoile
        }
    })
}

const ARC_POSITIONS = buildArcPositions()

// Ordre d'apparition : centre → gauche proche → droite proche → gauche loin → droite loin
const APPEAR_ORDER = [0, 1, 2, 3, 4, 5]

export default function ArcStars({ wpm }: { wpm: number }) {
    const earned = getStars(wpm)

    return (
        <>
            <style>{`
                @keyframes starPop {
                    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.2) rotate(var(--r)); }
                    60%  { opacity: 1; transform: translate(-50%, -50%) scale(1.25) rotate(var(--r)); }
                    80%  { transform: translate(-50%, -50%) scale(0.9) rotate(var(--r)); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(var(--r)); }
                }
                @keyframes starGlow {
                    0%, 100% { filter: drop-shadow(0 0 1px #ffa10088); }
                    50%      { filter: drop-shadow(0 0 6px #ffa100dd); }
                }
                .star-wrap {
                    position: absolute;
                    transform: translate(-50%, -50%) scale(0) rotate(var(--r));
                    opacity: 0;
                }
                .star-wrap.earned {
                    animation:
                        starPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                        starGlow 2s ease-in-out infinite;
                    animation-delay: var(--delay), calc(var(--delay) + 0.6s);
                }
                .star-wrap.empty {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1) rotate(var(--r));
                    animation: none;
                }
            `}</style>

            <div style={{ position: 'relative', width: W, height: H }}>
                {ARC_POSITIONS.map((pos, idx) => {
                    const appearIdx = APPEAR_ORDER.indexOf(idx)
                    const isEarned  = idx < earned
                    const delay     = `${appearIdx * 0.13}s`

                    return (
                        <div
                            key={idx}
                            className={`star-wrap ${isEarned ? 'earned' : 'empty'}`}
                            style={{
                                left:      `${pos.x}%`,
                                top:       `${pos.y}%`,
                                '--r':     `${pos.rotate}deg`,
                                '--delay': delay,
                            } as React.CSSProperties}
                        >
                            <Star
                                style={{ width: STAR_SIZE, height: STAR_SIZE }}
                                className={isEarned
                                    ? 'fill-[#ffa100] stroke-white/30'
                                    : 'fill-zinc-800 stroke-white/10'
                                }
                            />
                        </div>
                    )
                })}
            </div>
        </>
    )
}