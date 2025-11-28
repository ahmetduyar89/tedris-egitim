import React, { useState, useEffect } from 'react';
import { User, InteractiveContentComponent, InteractiveContent, ContentLibraryItem, ContentType, Subject } from '../types';
import { generateInteractiveComponent } from '../services/secureAIService';
import { db } from '../services/dbAdapter';

interface CreateInteractiveMaterialPageProps {
    user: User;
    onBack: () => void;
    contentIdForEdit?: string | null;
}

const componentConfig = {
    text: { icon: '📄', label: 'Metin Bloğu' },
    mcq: { icon: '❓', label: 'Çoktan Seçmeli Soru' },
    'fill-in-the-blank': { icon: '✍️', label: 'Boşluk Doldurma' },
    'true-false': { icon: '👍👎', label: 'Doğru / Yanlış' },
};

const CreateInteractiveMaterialPage: React.FC<CreateInteractiveMaterialPageProps> = ({ user, onBack, contentIdForEdit }) => {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState<Subject>(Subject.Mathematics);
    const [grade, setGrade] = useState(5);
    const [components, setComponents] = useState<InteractiveContentComponent[]>([]);
    const [aiLoadingType, setAiLoadingType] = useState<'mcq' | 'fill-in-the-blank' | 'true-false' | null>(null);
    const [interactiveContentId, setInteractiveContentId] = useState<string | null>(null);

    const isEditing = !!contentIdForEdit;

    useEffect(() => {
        if (isEditing && contentIdForEdit) {
            const fetchContent = async () => {
                try {
                    const itemDoc = await db.collection('contentLibrary').doc(contentIdForEdit).get();
                    if (!itemDoc.exists) return;
                    const itemToEdit = { id: itemDoc.id, ...itemDoc.data() } as ContentLibraryItem;

                    if (itemToEdit && itemToEdit.interactiveContentId) {
                        const interactiveDoc = await db.collection('interactiveContent').doc(itemToEdit.interactiveContentId).get();
                        if (!interactiveDoc.exists) return;
                        const interactiveData = { id: interactiveDoc.id, ...interactiveDoc.data() } as InteractiveContent;

                        setTitle(interactiveData.title);
                        setComponents(interactiveData.components);
                        setSubject(itemToEdit.subject);
                        setGrade(itemToEdit.grade);
                        setInteractiveContentId(interactiveData.id);
                    }
                } catch (error) {
                    console.error("Error fetching content for editing:", error);
                }
            };
            fetchContent();
        }
    }, [contentIdForEdit, isEditing]);


    const addComponent = (type: InteractiveContentComponent['type']) => {
        let newComponent: InteractiveContentComponent;
        switch (type) {
            case 'text':
                newComponent = { id: `comp-${Date.now()}`, type, content: { text: 'Buraya metin girin...' } };
                break;
            case 'mcq':
                newComponent = { id: `comp-${Date.now()}`, type, content: { question: '', options: ['', '', '', ''], answer: '' } };
                break;
            case 'fill-in-the-blank':
                newComponent = { id: `comp-${Date.now()}`, type, content: { sentence: '', answer: '' } };
                break;
            case 'true-false':
                newComponent = { id: `comp-${Date.now()}`, type, content: { statement: '', answer: true } };
                break;
        }
        setComponents([...components, newComponent]);
    };

    const deleteComponent = (id: string) => {
        setComponents(components.filter(c => c.id !== id));
    };

    const handleContentChange = (id: string, newContent: any) => {
        setComponents(components.map(c => c.id === id ? { ...c, content: newContent } : c));
    };

    const handleAiAssist = async (type: 'mcq' | 'fill-in-the-blank' | 'true-false') => {
        setAiLoadingType(type);
        try {
            const lastTextComponent = [...components].reverse().find(c => c.type === 'text');
            const context = lastTextComponent ? lastTextComponent.content.text : title;

            if (!context.trim()) {
                alert("Lütfen içerik oluşturmak için bir başlık veya metin ekleyin.");
                return;
            }

            const aiContent = await generateInteractiveComponent(context, grade, subject, type);

            let newComponent: InteractiveContentComponent;
            if (type === 'mcq') {
                newComponent = { id: `comp-${Date.now()}`, type, content: { question: aiContent.question, options: aiContent.options, answer: aiContent.answer } };
            } else if (type === 'fill-in-the-blank') {
                newComponent = { id: `comp-${Date.now()}`, type, content: { sentence: aiContent.sentence, answer: aiContent.answer } };
            } else { // true-false
                newComponent = { id: `comp-${Date.now()}`, type, content: { statement: aiContent.statement, answer: aiContent.answer } };
            }
            setComponents(prev => [...prev, newComponent]);

        } catch (error) {
            console.error(`AI ${type} generation failed:`, error);
            alert(`AI ${type} etkinliği oluştururken bir hata oluştu.`);
        } finally {
            setAiLoadingType(null);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert("Lütfen materyale bir başlık verin.");
            return;
        }

        try {
            if (isEditing && interactiveContentId && contentIdForEdit) {
                const batch = db.batch();
                const interactiveRef = db.collection('interactiveContent').doc(interactiveContentId);
                batch.update(interactiveRef, { title, components });

                const libraryRef = db.collection('contentLibrary').doc(contentIdForEdit);
                batch.update(libraryRef, { title, subject, grade });

                await batch.commit();
                alert("Materyal başarıyla güncellendi!");
            } else {
                const newInteractiveContent: Omit<InteractiveContent, 'id'> = { teacherId: user.id, title, components };
                const interactiveRef = await db.collection('interactiveContent').add(newInteractiveContent);

                const newLibraryItem: Omit<ContentLibraryItem, 'id'> = {
                    teacherId: user.id, title, subject, grade,
                    unit: 'Genel', tags: ['etkileşimli', subject], fileType: ContentType.Interactive,
                    interactiveContentId: interactiveRef.id, createdAt: new Date().toISOString(),
                };
                await db.collection('contentLibrary').add(newLibraryItem);

                alert("Etkileşimli materyal başarıyla kütüphaneye kaydedildi!");
            }

            onBack();
        } catch (e) {
            console.error("Error saving interactive content: ", e);
            alert("Materyal kaydedilirken bir hata oluştu.");
        }
    };

    const renderComponentEditor = (comp: InteractiveContentComponent) => {
        const { id, type, content } = comp;
        switch (type) {
            case 'text':
                return <textarea value={content.text} onChange={e => handleContentChange(id, { text: e.target.value })} className="w-full p-2 border rounded" rows={5} />;
            case 'mcq':
                return (
                    <div className="space-y-2">
                        <input type="text" placeholder="Soru metni" value={content.question} onChange={e => handleContentChange(id, { ...content, question: e.target.value })} className="w-full p-2 border rounded font-semibold" />
                        {content.options.map((opt: string, i: number) => (
                            <div key={i} className="flex items-center space-x-2">
                                <input type="radio" name={`answer-${id}`} checked={content.answer === opt} onChange={() => handleContentChange(id, { ...content, answer: opt })} />
                                <input type="text" placeholder={`Seçenek ${i + 1}`} value={opt} onChange={e => {
                                    const newOptions = [...content.options]; newOptions[i] = e.target.value;
                                    handleContentChange(id, { ...content, options: newOptions })
                                }} className="w-full p-2 border rounded" />
                            </div>
                        ))}
                    </div>
                );
            case 'fill-in-the-blank':
                return (
                    <div className="space-y-2">
                        <input type="text" placeholder="Boşluklu cümle (boşluk için ___ kullanın)" value={content.sentence} onChange={e => handleContentChange(id, { ...content, sentence: e.target.value })} className="w-full p-2 border rounded" />
                        <input type="text" placeholder="Doğru Cevap" value={content.answer} onChange={e => handleContentChange(id, { ...content, answer: e.target.value })} className="w-full p-2 border rounded bg-gray-50" />
                    </div>
                );
            case 'true-false':
                return (
                    <div className="space-y-3">
                        <input type="text" placeholder="Doğru veya yanlış ifade" value={content.statement} onChange={e => handleContentChange(id, { ...content, statement: e.target.value })} className="w-full p-2 border rounded" />
                        <div className="flex space-x-4">
                            <label><input type="radio" name={`tf-${id}`} checked={content.answer === true} onChange={() => handleContentChange(id, { ...content, answer: true })} /> Doğru</label>
                            <label><input type="radio" name={`tf-${id}`} checked={content.answer === false} onChange={() => handleContentChange(id, { ...content, answer: false })} /> Yanlış</label>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                <button onClick={onBack} className="flex items-center text-primary mb-6 font-semibold hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                    Kütüphaneye Geri Dön
                </button>
                <h2 className="text-3xl font-bold text-text-primary mb-2">{isEditing ? 'Materyali Düzenle' : 'Etkileşimli Materyal Oluşturucu'}</h2>
                <p className="text-text-secondary mb-6">Öğrencileriniz için metinler ve çeşitli etkinlikler içeren dijital dersler tasarlayın.</p>

                <div className="bg-white p-6 rounded-xl shadow-md space-y-4 mb-6">
                    <input type="text" placeholder="Materyal Başlığı" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-3 border rounded-lg text-xl font-bold" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={subject} onChange={e => setSubject(e.target.value as Subject)} className="w-full p-2 border rounded-lg"><option value="" disabled>Ders Seçin</option>{Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select value={grade} onChange={e => setGrade(Number(e.target.value))} className="w-full p-2 border rounded-lg"><option value={0} disabled>Sınıf Seçin</option>{[5, 6, 7, 8].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}</select>
                    </div>
                </div>

                <div className="space-y-4">
                    {components.map((comp) => (
                        <div key={comp.id} className="bg-white p-4 rounded-lg shadow-md border relative">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-gray-600 flex items-center">{componentConfig[comp.type].icon}<span className="ml-2">{componentConfig[comp.type].label}</span></h4>
                                <button onClick={() => deleteComponent(comp.id)} className="text-red-500 hover:text-red-700 p-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></button>
                            </div>
                            {renderComponentEditor(comp)}
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-white rounded-xl shadow-md space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button onClick={() => addComponent('text')} className="bg-gray-200 px-3 py-2 rounded-lg font-semibold text-sm">Metin Ekle</button>
                        <button onClick={() => addComponent('mcq')} className="bg-gray-200 px-3 py-2 rounded-lg font-semibold text-sm">Soru Ekle</button>
                        <button onClick={() => addComponent('fill-in-the-blank')} className="bg-gray-200 px-3 py-2 rounded-lg font-semibold text-sm">Boşluk Doldurma</button>
                        <button onClick={() => addComponent('true-false')} className="bg-gray-200 px-3 py-2 rounded-lg font-semibold text-sm">Doğru/Yanlış</button>
                    </div>
                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button onClick={() => handleAiAssist('mcq')} disabled={!!aiLoadingType} className="bg-blue-100 text-primary px-3 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-60 text-sm"><span>{aiLoadingType === 'mcq' ? '...' : 'AI Soru Üret'}</span></button>
                        <button onClick={() => handleAiAssist('fill-in-the-blank')} disabled={!!aiLoadingType} className="bg-blue-100 text-primary px-3 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-60 text-sm"><span>{aiLoadingType === 'fill-in-the-blank' ? '...' : 'AI Boşluk Doldurma'}</span></button>
                        <button onClick={() => handleAiAssist('true-false')} disabled={!!aiLoadingType} className="bg-blue-100 text-primary px-3 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-60 text-sm"><span>{aiLoadingType === 'true-false' ? '...' : 'AI Doğru/Yanlış'}</span></button>
                    </div>
                </div>

                <div className="mt-8 text-right">
                    <button onClick={handleSave} className="bg-accent text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-yellow-600 transition-colors">Materyali Kaydet</button>
                </div>
            </div>
        </div>
    );
};

export default CreateInteractiveMaterialPage;