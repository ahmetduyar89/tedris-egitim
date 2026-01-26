import React from 'react';
import { ContentLibraryItem } from '../../types';
import ContentCard from '../ContentCard';

interface LibraryTabProps {
    assignedContent: ContentLibraryItem[];
    onContentViewed: (item: ContentLibraryItem) => void;
}

const LibraryTab: React.FC<LibraryTabProps> = ({ assignedContent, onContentViewed }) => (
    <div className="p-4 md:p-8 animate-fade-in">
        <h2 className="text-3xl font-bold mb-6">Kütüphanem</h2>
        {assignedContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {assignedContent.map(item => <ContentCard key={item.id} item={item} onView={onContentViewed} />)}
            </div>
        ) : <p className="text-text-secondary">Henüz sana atanmış bir materyal yok.</p>}
    </div>
);

export default LibraryTab;
