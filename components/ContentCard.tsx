import React from 'react';
import { ContentLibraryItem, Subject, ContentType } from '../types';

interface ContentCardProps {
    item: ContentLibraryItem;
    onView?: (item: ContentLibraryItem) => void;
    onEdit?: (item: ContentLibraryItem) => void;
    onDelete?: (item: ContentLibraryItem) => void;
    onAssign?: (item: ContentLibraryItem) => void;
    onShare?: (item: ContentLibraryItem) => void;
}

const subjectColors: { [key in Subject]: string } = {
    [Subject.Mathematics]: 'bg-blue-100 text-blue-800',
    [Subject.Science]: 'bg-green-100 text-green-800',
    [Subject.Turkish]: 'bg-yellow-100 text-yellow-800',
};

const typeIcons: { [key in ContentType]: React.ReactNode } = {
    [ContentType.PDF]: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
    [ContentType.Video]: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" /></svg>,
    [ContentType.Image]: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>,
    [ContentType.Interactive]: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M5.834 7.75l-1.59 1.59M6 12H3.75m1.5-4.166L4.5 6.166M12 21.75V19.5m5.834-1.591-1.591-1.591M14.25 4.5l1.59 1.59M18 12h2.25m-1.5 4.166 1.59 1.59M12 6.75a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" /></svg>,
    [ContentType.HTML]: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>,
};


const ContentCard: React.FC<ContentCardProps> = ({ item, onView, onEdit, onDelete, onAssign, onShare }) => {
    const subjectColor = subjectColors[item.subject] || 'bg-gray-100 text-gray-800';
    const typeIcon = typeIcons[item.fileType];
    const isTeacherView = !!(onView && onEdit && onDelete && onAssign);

    const handleCardClick = () => {
        if (!isTeacherView && onView) {
            onView(item);
        }
    }

    return (
        <div 
            className={`bg-card-background p-4 rounded-xl shadow-md transition-all duration-300 flex flex-col justify-between ${isTeacherView ? 'hover:shadow-lg transform hover:-translate-y-1' : 'cursor-pointer hover:shadow-lg'}`}
            onClick={handleCardClick}
        >
            <div>
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">{typeIcon}</div>
                    <div className="flex-grow">
                        <h3 className="text-md font-bold text-text-primary leading-tight">{item.title}</h3>
                        <div className="flex items-center space-x-2 mt-2 text-xs font-semibold flex-wrap gap-y-1">
                            <span className={`${subjectColor} px-2 py-1 rounded-full`}>{item.subject}</span>
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{item.grade}. Sınıf</span>
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{item.unit}</span>
                        </div>
                    </div>
                </div>
            </div>

            {isTeacherView && (
                <div className="border-t mt-4 pt-3 space-y-2">
                    <div className="flex justify-between items-center space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); onView(item); }} className="flex-1 text-sm font-semibold text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors flex items-center justify-center space-x-1" title="Görüntüle">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="flex-1 text-sm font-semibold text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors flex items-center justify-center space-x-1" title="Düzenle">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="flex-1 text-sm font-semibold text-error hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center space-x-1" title="Sil">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                    </div>
                    <div className="flex justify-between items-center space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); onAssign(item); }} className="flex-1 bg-primary text-white text-sm font-semibold hover:bg-primary-dark p-2 rounded-lg transition-colors flex items-center justify-center space-x-1" title="Öğrenciye Ata">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                            <span>Ata</span>
                        </button>
                        {onShare && (
                            <button onClick={(e) => { e.stopPropagation(); onShare(item); }} className="flex-1 bg-green-600 text-white text-sm font-semibold hover:bg-green-700 p-2 rounded-lg transition-colors flex items-center justify-center space-x-1" title="Link ile Paylaş">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
                                <span>Paylaş</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentCard;