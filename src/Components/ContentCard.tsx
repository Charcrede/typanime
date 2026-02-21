// components/ContentCard.tsx
import Image from 'next/image';
import { Content } from '../app/types/content';
import Link from 'next/link';
import { Play, ScanText } from 'lucide-react';

interface ContentCardProps {
  content: Content;
  showDetails?: (content: Content) => void;
}

export default function ContentCard({ content, showDetails }: ContentCardProps) {
  const href = content.type === 'citation'
    ? `/citations/${content.id}`
    : `/synopsis/${content.id}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Zen+Kaku+Gothic+New:wght@300;400;700&display=swap');

        .content-card {
          position: relative;
          width: 100%;
          max-width: 360px;
          aspect-ratio: 2/3;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          display: block;
        }

        .content-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.97) 0%,
            rgba(0,0,0,0.5) 40%,
            rgba(0,0,0,0.1) 70%,
            transparent 100%
          );
          z-index: 1;
          transition: opacity 0.5s ease;
        }

        .content-card:hover::before {
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.99) 0%,
            rgba(0,0,0,0.75) 50%,
            rgba(0,0,0,0.4) 80%,
            rgba(0,0,0,0.1) 100%
          );
        }

        .content-card img {
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease;
          filter: saturate(0.8) brightness(0.9);
        }

        .content-card:hover img {
          transform: scale(1.06);
          filter: saturate(0.6) brightness(0.75);
        }

        .card-type-tag {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 3;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          padding: 3px 10px;
          border: 1px solid rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.6);
          backdrop-filter: blur(4px);
          background: rgba(0,0,0,0.2);
          border-radius: 2px;
        }

        .card-body {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 2;
          padding: 24px 20px 20px;
        }

        .card-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.1rem;
          line-height: 1;
          letter-spacing: 0.03em;
          color: white;
          margin-bottom: 4px;
          transform: translateY(0);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .content-card:hover .card-title {
          transform: translateY(-6px);
        }

        .card-author {
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .card-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.35s ease 0.05s, transform 0.4s cubic-bezier(0.16,1,0.3,1) 0.05s;
        }

        .content-card:hover .card-meta {
          opacity: 1;
          transform: translateY(0);
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .meta-label {
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
        }

        .meta-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.95rem;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.8);
        }

        .card-divider {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin-bottom: 14px;
          opacity: 0;
          transform: scaleX(0);
          transform-origin: left;
          transition: opacity 0.3s ease 0.1s, transform 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s;
        }

        .content-card:hover .card-divider {
          opacity: 1;
          transform: scaleX(1);
        }

        .card-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.3s ease 0.15s, transform 0.4s cubic-bezier(0.16,1,0.3,1) 0.15s;
        }

        .content-card:hover .card-actions {
          opacity: 1;
          transform: translateY(0);
        }

        .btn-details {
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          border: none;
          background: none;
          cursor: pointer;
          padding: 6px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
        }

        .btn-details:hover {
          color: rgba(255,255,255,0.8);
        }

        .btn-play {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: black;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.9rem;
          letter-spacing: 0.12em;
          padding: 8px 18px;
          border-radius: 2px;
          text-decoration: none;
          transition: background 0.2s, color 0.2s;
        }

        .btn-play:hover {
          background: rgba(255,255,255,0.85);
        }

        .card-id {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 3;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          color: rgba(255,255,255,0.2);
        }
      `}</style>

      <div className="content-card">
        {/* Image */}
        <Image
          src={'/' + content.image}
          alt={content.title}
          fill
          className="object-cover"
        />

        {/* ID */}
        <span className="card-id">#{String(content.id).padStart(3, '0')}</span>

        {/* Type tag */}
        <span className="card-type-tag">{content.type}</span>

        {/* Contenu */}
        <div className="card-body">
          <h2 className="card-title">{content.title}</h2>
          {content.author && (
            <p className="card-author">{content.author}</p>
          )}

          {/* Méta révélées au hover */}
          <div className="card-meta">
            <div className="meta-item">
              <span className="meta-label">Catégorie</span>
              <span className="meta-value">{content.category.name}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Longueur</span>
              <span className="meta-value">{content.text.length} car.</span>
            </div>
          </div>

          <div className="card-divider" />

          {/* Actions */}
          <div className="card-actions">
            <button className="btn-details" onClick={() => showDetails?.(content)}>
              <ScanText size={13} />
              Aperçu
            </button>
            <Link href={href} className="btn-play">
              <Play size={12} fill="black" />
              Jouer
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}