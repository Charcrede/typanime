'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut, TextAlignJustify, User, X } from 'lucide-react';
import { useUser } from '../app/context/UserContext';

const Nav = () => {
    const router = usePathname();
    const { user, logout } = useUser();
    const [active, setActive] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const links = [
        { label: 'Accueil', href: '/', key: '' },
        { label: 'Citations', href: '/citations', key: 'citations' },
        { label: 'Synopsis', href: '/synopsis', key: 'synopsis' },
        { label: 'Challenges', href: '/challenges', key: 'challenges' },
    ];
    useEffect(() => {
        setActive(router.split('/')[1]);
        setIsOpen(false);
    }, [router]);

    return (
        <>
            <header className='backdrop-blur-lg fixed top-0 w-full z-20'>
                <nav className='w-full flex justify-between items-center py-6 lg:px-32 px-4 z-20 border-b border-white'>
                    <span className='text-white text-2xl font-bold font-Metropolis'>TYPANIME.<span className="animate-fade-in">|</span></span>
                    <button className='lg:hidden text-white' onClick={() => setIsOpen(!isOpen)}>
                        
                            {!isOpen && (
                                <TextAlignJustify className='w-7 h-7'/>
                            )}
                            {isOpen && (
                                <X className='w-7 h-7'/>
                            )}
                        
                    </button>

                    {/* Desktop */}
                    <ul className='lg:flex gap-2 py-0 m-0 font-ProductSans rounded-full items-center p-1 font-bold text-primary xs:hidden'>
                        {links.map(({ label, href, key }) => (
                            <li key={key} className='group relative flex flex-col uppercase text-white font-Space'>
                                <Link className='px-[2px] py-[2px] rounded-full' href={href}>{label}</Link>
                                <div className={`w-0 group-hover:w-full duration-500 h-[2px] rounded-full bg-white ${active === key ? 'w-full' : ''}`}></div>
                            </li>
                        ))}
                        <div className='ml-16 flex items-center gap-4'>
                            {user && (
                                <li className='relative  text-white font-Space w-fit'>

                                    <Link className={`hover:bg-white/10 flex rounded-xl items-center p-3 ${active === 'dashboard' ? 'bg-white/10' : ''}`} href='/dashboard'><User className='w-6 h-6 inline-block' /><span>{user.username}</span></Link>
                                </li>
                            )}
                            <li className=' relative flex flex-col uppercase text-white font-Space'>
                                {user ? (
                                    <button onClick={logout} className={`px-[2px] py-[2px] cursor-pointer rounded-full text-white/70 hover:text-white duration-500`}>
                                        <LogOut />
                                    </button>
                                ) : (
                                    <Link className={`px-[2px] py-[2px] rounded-full text-white/70 hover:text-white duration-500 ${active === 'auth' ? 'text-white' : ''}`} href='/auth/login'>
                                        <LogIn />
                                    </Link>
                                )}
                            </li>
                        </div>
                    </ul>
                </nav>

                {/* Mobile */}
                <ul className={`${isOpen ? 'h-[20rem]' : 'h-0'} py-0 m-0 mb-4 font-ProductSans pl-8 p-1 flex flex-col gap-4 justify-center bg-black/50 xs:p-0 font-bold text-primary lg:hidden duration-300 overflow-hidden`}>
                    {links.map(({ label, href, key }) => (
                        <li key={key} className='group ml-4 relative flex flex-col uppercase text-white font-Space w-fit'>
                            <Link className='px-[2px] py-[2px] rounded-full' href={href}>{label}</Link>
                            <div className={`w-0 group-hover:w-full duration-500 h-[2px] rounded-full bg-white ${active === key ? 'w-full' : ''}`}></div>
                        </li>
                    ))}
                    <div className='ml-4 flex flex-col items-start gap-4'>
                            {user && (
                                <li className='relative  text-white font-Space w-fit'>

                                    <Link className={`hover:bg-white/10 flex rounded-xl items-center p-3 pl-0 ${active === 'dashboard' ? 'bg-white/10 pl-3' : ''}`} href='/dashboard'><User className='w-6 h-6 inline-block' /><span>{user.username}</span></Link>
                                </li>
                            )}
                            <li className=' relative flex flex-col uppercase text-white font-Space'>
                                {user ? (
                                    <button onClick={logout} className={`px-[2px] py-[2px] cursor-pointer rounded-full text-white/70 hover:text-white duration-500`}>
                                        <LogOut />
                                    </button>
                                ) : (
                                    <Link className={`px-[2px] py-[2px] rounded-full text-white/70 hover:text-white duration-500 ${active === 'auth' ? 'text-white' : ''}`} href='/auth/login'>
                                        <LogIn />
                                    </Link>
                                )}
                            </li>
                        </div>
                </ul>
            </header>
        </>
    );
};

export default Nav;