'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import ContentCard from '../../Components/ContentCard';
import { Content } from '../types/content';
import ShowCardContent from '@/Components/ShowCardContent';

const Synops = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API

    const [synopsis, setSynopsis] = useState<Content[]>([])
    const [active, setActive] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [content, setContent] = useState<Content | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchPage = (page: number) => {
        setLoading(true)
        axios.get(`${apiUrl}contents/?categoryId=1&page=${page}`).then((resp) => {
            setSynopsis(resp.data.data)
            setTotalPages(resp.data.meta.totalPages)
            setActive(page)
            setLoading(false)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        })
    }

    useEffect(() => { fetchPage(1) }, [])

    return (
        <>
            <div className="min-h-screen">
                <div className="max-w-6xl mx-auto px-6 pt-24 pb-20">

                    {/* Header */}
                    <div className="mb-16 flex flex-col items-center text-center gap-3">
                        <span className="synops-subtitle">Typanime · Collection</span>
                        <h1 className="synops-title">Synopsis</h1>
                        <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.15)' }} />
                    </div>

                    {/* Grille */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-3">
                            <div className="w-6 h-6 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
                            <p className="synops-subtitle">Chargement</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 grid-fade">
                            {synopsis.map((el, i) => (
                                <div key={i} className="flex justify-center">
                                    <ContentCard
                                        content={el}
                                        showDetails={(c) => setContent(c)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-5 mt-16">
                            <button
                                className="page-btn page-btn-outline"
                                onClick={() => fetchPage(active - 1)}
                                disabled={active <= 1}
                            >
                                ← Précédent
                            </button>
                            <span className="page-indicator">{active} / {totalPages}</span>
                            <button
                                className="page-btn page-btn-outline"
                                onClick={() => fetchPage(active + 1)}
                                disabled={active >= totalPages}
                            >
                                Suivant →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {content && (
                <ShowCardContent
                    content={content}
                    hideDetails={() => setContent(null)}
                />
            )}
        </>
    )
}

export default Synops;