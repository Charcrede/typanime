'use client'
import { Content } from "@/app/types/content";
import { useEffect, useState, useRef } from "react";
import { Search, X, ChevronDown } from "lucide-react";

function CreateChallengeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [contentType, setContentType]   = useState<'citation' | 'synopsis'>('citation')
    const [contents, setContents]         = useState<Content[]>([])
    const [contentsLoading, setContentsLoading] = useState(false)
    const [form, setForm]                 = useState({ title: '', content_id: '', duration: 300, expires_in: 24, max_players: 10 })
    const [loading, setLoading]           = useState(false)
    const [error, setError]               = useState('')

    // Select custom
    const [searchContent, setSearchContent]   = useState('')
    const [dropdownOpen, setDropdownOpen]     = useState(false)
    const [selectedContent, setSelectedContent] = useState<Content | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchRef   = useRef<HTMLInputElement>(null)

    // Fermer le dropdown si clic extérieur
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Focus input search à l'ouverture du dropdown
    useEffect(() => {
        if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50)
    }, [dropdownOpen])

    // Fetch contents quand le type change
    useEffect(() => {
        setSelectedContent(null)
        setForm(f => ({ ...f, content_id: '' }))
        setSearchContent('')
        setContentsLoading(true)

        // categoryId=2 → citations, categoryId=1 → synopsis
        const categoryId = contentType === 'citation' ? 2 : 1
        fetch(`/api/contents?categoryId=${categoryId}&limit=100`)
            .then(r => r.json())
            .then(d => setContents(d.data ?? d))
            .finally(() => setContentsLoading(false))
    }, [contentType])

    const filtered = contents.filter(c => {
        const q = searchContent.toLowerCase()
        return (
            c.title.toLowerCase().includes(q) ||
            c.text.toLowerCase().includes(q) ||
            (c.author ?? '').toLowerCase().includes(q)
        )
    })

    const selectContent = (c: Content) => {
        setSelectedContent(c)
        setForm(f => ({ ...f, content_id: String(c.id) }))
        setDropdownOpen(false)
        setSearchContent('')
    }

    const clearContent = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedContent(null)
        setForm(f => ({ ...f, content_id: '' }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.content_id) { setError('Sélectionne un contenu'); return }
        setLoading(true)
        setError('')

        const expires_at = new Date(Date.now() + form.expires_in * 3600000).toISOString()

        const res = await fetch('/api/challenges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: form.title,
                content_id: parseInt(form.content_id),
                duration: form.duration,
                expires_at,
                max_players: form.max_players,
            }),
        })

        setLoading(false)
        if (res.ok) {
            onCreated()
        } else {
            const d = await res.json()
            setError(d.message || 'Erreur lors de la création')
        }
    }

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-6">Créer un challenge</h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Titre */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Titre</label>
                        <input
                            className="input"
                            placeholder="Mon super challenge..."
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Toggle type */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Type de contenu</label>
                        <div className="flex gap-2">
                            {(['citation', 'synopsis'] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setContentType(t)}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize border"
                                    style={{
                                        background: contentType === t ? 'white' : 'transparent',
                                        color:      contentType === t ? 'black' : 'rgba(255,255,255,0.4)',
                                        borderColor: contentType === t ? 'white' : 'rgba(255,255,255,0.1)',
                                    }}
                                >
                                    {t === 'citation' ? '💬 Citations' : '📖 Synopsis'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Select custom avec recherche */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Contenu</label>
                        <div ref={dropdownRef} className="relative">

                            {/* Trigger */}
                            <button
                                type="button"
                                className="input flex items-center justify-between text-left"
                                onClick={() => setDropdownOpen(o => !o)}
                                style={{ cursor: 'pointer' }}
                            >
                                {selectedContent ? (
                                    <span className="flex-1 truncate text-white">
                                        {selectedContent.title}
                                        {selectedContent.author && <span className="text-zinc-500 ml-1">— {selectedContent.author}</span>}
                                    </span>
                                ) : (
                                    <span className="text-zinc-600">
                                        {contentsLoading ? 'Chargement...' : `Rechercher parmi ${contents.length} ${contentType}s...`}
                                    </span>
                                )}
                                <span className="flex items-center gap-1 ml-2 shrink-0">
                                    {selectedContent && (
                                        <span onClick={clearContent} className="text-zinc-600 hover:text-white transition-colors p-0.5">
                                            <X size={12} />
                                        </span>
                                    )}
                                    <ChevronDown size={14} className="text-zinc-600" style={{ transform: dropdownOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
                                </span>
                            </button>

                            {/* Dropdown */}
                            {dropdownOpen && (
                                <div
                                    className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
                                    style={{ background: '#1c1c22', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
                                >
                                    {/* Search input */}
                                    <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                        <Search size={13} className="text-zinc-600 shrink-0" />
                                        <input
                                            ref={searchRef}
                                            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-600"
                                            placeholder="Titre, auteur ou extrait du texte..."
                                            value={searchContent}
                                            onChange={e => setSearchContent(e.target.value)}
                                        />
                                        {searchContent && (
                                            <button type="button" onClick={() => setSearchContent('')} className="text-zinc-600 hover:text-white">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Résultats */}
                                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                                        {contentsLoading ? (
                                            <div className="flex justify-center py-6">
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            </div>
                                        ) : filtered.length === 0 ? (
                                            <p className="text-center text-zinc-600 text-sm py-6">Aucun résultat</p>
                                        ) : filtered.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => selectContent(c)}
                                                className="w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors duration-100"
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <span className="text-sm text-white truncate">
                                                    {c.title}
                                                    {c.author && <span className="text-zinc-500 ml-1">— {c.author}</span>}
                                                </span>
                                                <span className="text-xs text-zinc-600 truncate">{c.text.slice(0, 60)}…</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Footer count */}
                                    {!contentsLoading && (
                                        <div className="px-4 py-2 text-xs text-zinc-700" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Durée + expire + max joueurs */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Expire dans</label>
                            <select className="input" value={form.expires_in} onChange={e => setForm(f => ({ ...f, expires_in: parseInt(e.target.value) }))}>
                                <option value={1}>1 heure</option>
                                <option value={6}>6 heures</option>
                                <option value={24}>24 heures</option>
                                <option value={72}>3 jours</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Max joueurs</label>
                            <input
                                className="input"
                                type="number"
                                min={2}
                                max={100}
                                value={form.max_players}
                                onChange={e => setForm(f => ({ ...f, max_players: parseInt(e.target.value) }))}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="submit" className="btn-primary flex-1" disabled={loading}>
                            {loading ? 'Création...' : 'Créer'}
                        </button>
                        <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateChallengeModal