import React from 'react';

export const TedrisLogo = () => (
    <img src="/logo-full.png" alt="TedrisEDU" className="h-10 w-auto" />
);

export type View = 'overview' | 'students' | 'studentDetail' | 'library' | 'createMaterial' | 'questionBank' | 'diagnosisTests' | 'privateLessons' | 'onlineLessons' | 'subjectLearning' | 'coaching';

interface SidebarContentProps {
    currentView: View;
    setView: (view: View) => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ currentView, setView }) => {
    const navItems = [
        { id: 'overview', label: 'Genel Bakış', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
        { id: 'students', label: 'Öğrencilerim', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-4.12-9.337 9.38 9.38 0 0 0-2.625-.372M6.375 19.128a9.38 9.38 0 0 1 2.625-.372 9.337 9.337 0 0 1 4.121-2.253 9.5 9.5 0 0 1-4.12 9.337 9.38 9.38 0 0 1-2.625-.372Zm12.75 0a9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-4.12-9.337 9.38 9.38 0 0 0-2.625-.372M6.375 7.5a9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-4.12-9.337 9.38 9.38 0 0 0-2.625-.372M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" /></svg> },
        { id: 'diagnosisTests', label: 'Tanı Testleri', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg> },
        { id: 'subjectLearning', label: 'Branş Çalışmaları', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
        { id: 'library', label: 'Kütüphane', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
        { id: 'questionBank', label: 'Soru Bankası', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg> },
        { id: 'privateLessons', label: 'Özel Ders Programı', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg> },
        { id: 'onlineLessons', label: 'Online Dersler', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg> },
        { id: 'coaching', label: 'Koçluk Paneli', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg> },
    ];

    const isActive = (id: View) => {
        if (id === 'overview') return currentView === 'overview';
        if (id === 'students') return ['students', 'studentDetail'].includes(currentView);
        if (id === 'library') return ['library', 'createMaterial'].includes(currentView);
        if (id === 'questionBank') return currentView === 'questionBank';
        if (id === 'diagnosisTests') return currentView === 'diagnosisTests';
        if (id === 'subjectLearning') return currentView === 'subjectLearning';
        if (id === 'privateLessons') return currentView === 'privateLessons';
        if (id === 'onlineLessons') return currentView === 'onlineLessons';
        if (id === 'coaching') return currentView === 'coaching';
        return false;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="mb-10 pl-3 pt-2">
                <TedrisLogo />
            </div>
            <nav className="flex flex-col space-y-3 px-2">
                {navItems.map(item => {
                    const active = isActive(item.id as View);
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id as View)}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-poppins font-medium transition-all duration-300 group text-left ${active
                                ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                : 'text-gray-500 hover:bg-slate-50 hover:text-indigo-600 hover:shadow-sm'
                                }`}
                        >
                            <span className={`transition-transform duration-300 flex-shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </span>
                            <span className="tracking-wide text-left leading-tight flex-1">{item.label}</span>
                            {active && (
                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white opacity-50 animate-pulse"></div>
                            )}
                        </button>
                    );
                })}
            </nav>
            <div className="mt-auto p-4 opacity-50 pointer-events-none">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100">
                    <div className="h-1.5 w-12 bg-indigo-200 rounded-full mb-2"></div>
                    <div className="h-1.5 w-8 bg-indigo-100 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default SidebarContent;
