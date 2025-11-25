import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ContentLibraryItem, User, Subject, Student, ContentType, InteractiveContent } from '../types';
import ContentCard from '../components/ContentCard';
import UploadContentModal from '../components/UploadContentModal';
import AssignContentModal from '../components/AssignContentModal';
import ShareContentModal from '../components/ShareContentModal';
import { CURRICULUM } from '../constants';
import { db } from '../services/dbAdapter';

interface ContentLibraryPageProps {
    user: User;
    students: Student[];
    onNavigateToCreator: (contentId?: string) => void;
    onNavigateToContent: (contentId: string) => void;
}

const ContentLibraryPage: React.FC<ContentLibraryPageProps> = ({ user, students, onNavigateToCreator, onNavigateToContent }) => {
    const [libraryItems, setLibraryItems] = useState<ContentLibraryItem[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ subject: Subject | '', grade: number | '', unit: string | '' }>({
        subject: '',
        grade: '',
        unit: '',
    });

    const [editingItem, setEditingItem] = useState<ContentLibraryItem | null>(null);
    const [assigningItem, setAssigningItem] = useState<ContentLibraryItem | null>(null);
    const [sharingItem, setSharingItem] = useState<ContentLibraryItem | null>(null);

    const loadLibrary = useCallback(async () => {
        try {
            const snapshot = await db.collection('contentLibrary').where('teacherId', '==', user.id).get();
            const items = snapshot.docs.map((doc: any) => ({id: doc.id, ...doc.data()}) as ContentLibraryItem);
            setLibraryItems(items);
        } catch (error) {
            console.error("Error loading content library:", error);
        }
    }, [user.id]);

    useEffect(() => {
        loadLibrary();
    }, [loadLibrary]);

    const handleUploadComplete = () => {
        loadLibrary();
        setIsUploadModalOpen(false);
        setEditingItem(null);
    };

    const handleEdit = (item: ContentLibraryItem) => {
        if (item.fileType === ContentType.Interactive) {
            onNavigateToCreator(item.id);
        } else {
            setEditingItem(item);
            setIsUploadModalOpen(true);
        }
    };
    
    const handleDelete = async (item: ContentLibraryItem) => {
        if(window.confirm(`'${item.title}' içeriğini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
            try {
                const batch = db.batch();
                const libraryItemRef = db.collection('contentLibrary').doc(item.id);
                batch.delete(libraryItemRef);

                if(item.fileType === ContentType.Interactive && item.interactiveContentId) {
                    const interactiveContentRef = db.collection('interactiveContent').doc(item.interactiveContentId);
                    batch.delete(interactiveContentRef);
                }
                
                await batch.commit();
                loadLibrary(); // Reload from firestore
            } catch (error) {
                console.error("Error deleting content:", error);
                alert("İçerik silinirken bir hata oluştu.");
            }
        }
    };


    const filteredItems = useMemo(() => {
        return libraryItems.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesSubject = !filters.subject || item.subject === filters.subject;
            const matchesGrade = !filters.grade || item.grade === filters.grade;
            const matchesUnit = !filters.unit || item.unit === filters.unit;
            return matchesSearch && matchesSubject && matchesGrade && matchesUnit;
        }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [libraryItems, searchTerm, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const availableUnits = filters.subject && filters.grade ? CURRICULUM[filters.subject as Subject][filters.grade as number] || [] : [];

    return (
        <>
            <div className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-text-primary">İçerik Kütüphanesi</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => onNavigateToCreator()} className="bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 flex items-center justify-center space-x-2 text-sm md:text-base">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 1-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 1 3.09-3.09L12 5.25l.813 2.846a4.5 4.5 0 0 1 3.09 3.09L18.75 12l-2.846.813a4.5 4.5 0 0 1-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18.259 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
                                <span className="whitespace-nowrap">Etkileşimli İçerik</span>
                            </button>
                            <button onClick={() => { setEditingItem(null); setIsUploadModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark flex items-center justify-center space-x-2 text-sm md:text-base">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                                <span className="whitespace-nowrap">İçerik Yükle</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-card-background p-3 md:p-4 rounded-xl shadow-md mb-6 space-y-3">
                        <input
                            type="text"
                            placeholder="Başlık veya etiket ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm md:text-base"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <select name="subject" value={filters.subject} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-lg text-sm md:text-base">
                                <option value="">Tüm Dersler</option>
                                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select name="grade" value={filters.grade} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-lg text-sm md:text-base">
                                <option value="">Tüm Sınıflar</option>
                                {[5, 6, 7, 8].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                            </select>
                            <select name="unit" value={filters.unit} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-lg text-sm md:text-base sm:col-span-2 lg:col-span-1" disabled={!filters.subject || !filters.grade}>
                                <option value="">Tüm Üniteler</option>
                                {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    {filteredItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredItems.map(item => (
                                <ContentCard
                                    key={item.id}
                                    item={item}
                                    onView={() => onNavigateToContent(item.id)}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onAssign={setAssigningItem}
                                    onShare={setSharingItem}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-12">Filtrelere uygun içerik bulunamadı.</p>
                    )}
                </div>
            </div>
            {(isUploadModalOpen || editingItem) && <UploadContentModal user={user} onClose={() => { setIsUploadModalOpen(false); setEditingItem(null); }} onUpload={handleUploadComplete} itemToEdit={editingItem} />}
            {assigningItem && <AssignContentModal isOpen={!!assigningItem} onClose={() => setAssigningItem(null)} contentItem={assigningItem} students={students} />}
            {sharingItem && <ShareContentModal isOpen={!!sharingItem} onClose={() => setSharingItem(null)} contentItem={sharingItem} user={user} />}
        </>
    );
};

export default ContentLibraryPage;