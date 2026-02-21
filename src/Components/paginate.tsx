'use client'
import { useState, FormEvent, use, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Paginate = () => {

    // ########################### CONSTANTES #################################### //
    const router = usePathname();
    // ########################### VARIABLES #################################### //
    const [active, setActive] = useState('');
    const [isOpen, setIsOpen] = useState(false)

    // ########################### MOUNTED #################################### //
    useEffect(() => {
        setActive(router.split('/')[1])

    }, [])


    // ########################### WATCHER #################################### //


    // ########################### METHODS #################################### //




    // ########################### HTML #################################### //


    return (
        <>
            <header>
                <nav className='flex justify-between lg:my-8 mx-4 xs:my-4'>
                    <span className='text-white text-2xl font-bold font-Metropolis'>OTAKU TYPE</span>
                    <button className='lg:hidden' onClick={() => { setIsOpen(!isOpen) }}>
                        <svg viewBox="0 0 448 512" className='fill-white w-8 h-8'>
                            {!isOpen && (
                                <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
                            )}
                            {isOpen && (
                                <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                            )}
                        </svg>
                    </button>
                    <ul className='lg:flex py-0 m-0 font-ProductSans bg-white rounded-full items-center p-1 font-bold text-primary xs:hidden'>
                        <li><Link className={`${active == '' ? 'text-white bg-primary' : 'text-primary'} px-2 py-1 rounded-full`} href={'/'}>Acceuil</Link></li>
                        <li><Link className={`${active == 'citations' ? 'text-white bg-primary' : 'text-primary'} px-2 py-1 rounded-full`} href={'/citations'}>Citations</Link></li>
                        <li><Link className={`${active == 'synopsis' ? 'text-white bg-primary' : 'text-primary'} px-2 py-1 rounded-full`} href={'/synopsis'}>Synopsis</Link></li>
                    </ul>
                </nav>
                <ul className={`${isOpen ? 'h-32' : 'h-0'} py-0 m-0 mb-4 font-ProductSans bg-white p-1 xs:p-0 font-bold text-primary lg:hidden duration-300 overflow-hidden`}>
                    <li><Link className={`${active == '' ? 'text-white bg-primary' : 'text-primary'} px-2 py-2 block`} href={'/'}>Acceuil</Link></li>
                    <li><Link className={`${active == 'citations' ? 'text-white bg-primary' : 'text-primary'} px-2 py-2 block`} href={'/citations'}>Citations</Link></li>
                    <li><Link className={`${active == 'synopsis' ? 'text-white bg-primary' : 'text-primary'} px-2 py-2 block`} href={'/synopsis'}>Synopsis</Link></li>
                </ul>
            </header>
        </>
    )


};

export default Paginate;
