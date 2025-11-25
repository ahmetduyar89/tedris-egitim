import React, { useState, useEffect } from 'react';
import { User, Subject, ContentType, ContentLibraryItem } from '../types';
import { CURRICULUM } from '../constants';
import { db } from '../services/dbAdapter';

interface UploadContentModalProps {
    user: User;
    onClose: () => void;
    onUpload: (item: ContentLibraryItem) => void;
    itemToEdit?: ContentLibraryItem | null;
}

const UploadContentModal: React.FC<UploadContentModalProps> = ({ user, onClose, onUpload, itemToEdit }) => {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState<Subject>(Subject.Mathematics);
    const [grade, setGrade] = useState(5);
    const [unit, setUnit] = useState('');
    const [tags, setTags] = useState('');
    const [fileType, setFileType] = useState<ContentType>(ContentType.PDF);
    const [fileUrl, setFileUrl] = useState('');
    const [htmlContent, setHtmlContent] = useState('');

    useEffect(() => {
        if (itemToEdit) {
            setTitle(itemToEdit.title);
            setSubject(itemToEdit.subject);
            setGrade(itemToEdit.grade);
            setUnit(itemToEdit.unit);
            setTags(itemToEdit.tags.join(', '));
            setFileType(itemToEdit.fileType);
            setFileUrl(itemToEdit.fileUrl || '');
            setHtmlContent(itemToEdit.htmlContent || '');
        }
    }, [itemToEdit]);
    
    useEffect(() => {
        const units = CURRICULUM[subject]?.[grade] || [];
        if (!units.includes(unit)) {
            setUnit(units[0] || '');
        }
    }, [subject, grade, unit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const itemData = {
            teacherId: user.id,
            title, subject, grade, unit,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            fileType,
            fileUrl: fileType !== ContentType.HTML ? fileUrl : '',
            htmlContent: fileType === ContentType.HTML ? htmlContent : '',
            createdAt: itemToEdit?.createdAt || new Date().toISOString(),
        };

        try {
            if (itemToEdit) {
                await db.collection('contentLibrary').doc(itemToEdit.id).update(itemData);
                onUpload({ ...itemData, id: itemToEdit.id });
            } else {
                const result = await db.collection('contentLibrary').add(itemData);
                const newId = typeof result === 'object' ? result.id : result;
                onUpload({ ...itemData, id: newId });
            }
        } catch (error) {
            console.error("Error saving content:", error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            alert(`İçerik kaydedilirken bir hata oluştu: ${errorMessage}`);
        }
    };

    const availableUnits = CURRICULUM[subject]?.[grade] || [];
    const isEditing = !!itemToEdit;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{isEditing ? 'İçeriği Düzenle' : 'Yeni İçerik Yükle'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="İçerik Başlığı" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded-lg" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={subject} onChange={e => setSubject(e.target.value as Subject)} className="w-full p-2 border rounded-lg">
                            {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={grade} onChange={e => setGrade(Number(e.target.value))} className="w-full p-2 border rounded-lg">
                            {[5,6,7,8].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                        </select>
                    </div>
                    <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-2 border rounded-lg">
                        {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input type="text" placeholder="Etiketler (virgülle ayırın)" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2 border rounded-lg" />
                    
                    <select value={fileType} onChange={e => setFileType(e.target.value as ContentType)} className="w-full p-2 border rounded-lg" disabled={isEditing && itemToEdit?.fileType === ContentType.Interactive}>
                        {Object.values(ContentType).filter(t => t !== ContentType.Interactive).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                    </select>
                    
                    {fileType === ContentType.HTML ? (
                        <textarea
                            placeholder="HTML kodunu buraya yapıştırın..."
                            value={htmlContent}
                            onChange={e => setHtmlContent(e.target.value)}
                            className="w-full p-2 border rounded-lg h-32 font-mono"
                            required
                        />
                    ) : (
                        <input
                            type="text"
                            placeholder="Dosya URL'si"
                            value={fileUrl}
                            onChange={e => setFileUrl(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            required
                        />
                    )}

                    <p className="text-xs text-gray-500">Not: Bu bir prototip olduğu için gerçek dosya yüklemesi yerine URL girişi veya HTML kodu girişi yapılmaktadır.</p>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-xl">İptal</button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl">{isEditing ? 'Güncelle' : 'Yükle'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadContentModal;