import React from 'react';
import { Student, LearningLoopStatus } from '../../types';

interface StudentCardProps {
    student: Student;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    children?: React.ReactNode;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onSelect, onEdit, onDelete, children }) => {
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        <div
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 overflow-hidden group hover:-translate-y-1"
            onClick={onSelect}
        >
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-start relative">
                <div className="flex items-center gap-2.5 flex-1 min-w-0 z-10">
                    <div className="bg-white text-blue-600 rounded-lg h-9 w-9 flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0">
                        {student.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate leading-tight" title={student.name}>
                            {student.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 bg-white/20 border border-white/10 text-white/90 text-[10px] font-medium rounded">
                                {student.grade === 4 ? 'İlkokul' : `${student.grade}. Sınıf`}
                            </span>
                            <span className="px-1.5 py-0.5 bg-yellow-400/20 border border-yellow-400/30 text-yellow-100 text-[10px] font-medium rounded">
                                Lv {student.level}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/10 backdrop-blur-sm rounded-lg p-0.5">
                    {children}
                    <button
                        onClick={handleEdit}
                        className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded transition-colors"
                        title="Düzenle"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1 text-white/80 hover:text-red-200 hover:bg-red-500/30 rounded transition-colors"
                        title="Sil"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
            </div>

            <div className="p-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">XP</p>
                        <p className="text-sm font-bold text-gray-800">{student.xp.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Durum</p>
                        <p className={`text-xs font-bold ${student.learningLoopStatus !== LearningLoopStatus.Initial ? 'text-green-600' : 'text-gray-400'}`}>
                            {student.learningLoopStatus !== LearningLoopStatus.Initial ? 'Aktif' : 'Pasif'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentCard;
