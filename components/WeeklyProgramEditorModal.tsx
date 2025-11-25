import React, { useState } from 'react';
import { WeeklyProgram, Task, TaskStatus } from '../types';

interface WeeklyProgramEditorModalProps {
    program: Omit<WeeklyProgram, 'id' | 'studentId' | 'week'>;
    onClose: () => void;
    onSave: (program: Omit<WeeklyProgram, 'id' | 'studentId' | 'week'>) => void;
}

const WeeklyProgramEditorModal: React.FC<WeeklyProgramEditorModalProps> = ({ program, onClose, onSave }) => {
    const [editableProgram, setEditableProgram] = useState(JSON.parse(JSON.stringify(program)));

    const handleTaskChange = (dayIndex: number, taskIndex: number, field: 'description' | 'duration', value: string | number) => {
        const newProgram = { ...editableProgram };
        const task = newProgram.days[dayIndex].tasks[taskIndex];
        if (field === 'description') {
            task.description = value as string;
        } else if (field === 'duration') {
            task.duration = value as number;
        }
        setEditableProgram(newProgram);
    };

    const handleAddTask = (dayIndex: number) => {
        const newProgram = { ...editableProgram };
        const newTask: Task = {
            id: `new-task-${Date.now()}`,
            description: 'Yeni görev...',
            status: TaskStatus.Assigned,
            duration: 30, // Default duration
        };
        newProgram.days[dayIndex].tasks.push(newTask);
        setEditableProgram(newProgram);
    };

    const handleDeleteTask = (dayIndex: number, taskIndex: number) => {
        const newProgram = { ...editableProgram };
        newProgram.days[dayIndex].tasks.splice(taskIndex, 1);
        setEditableProgram(newProgram);
    };

    const handleDuplicateTask = (dayIndex: number, taskIndex: number) => {
        // Duplicates the task to the next day, wrapping around to Monday if it's Sunday.
        const targetDayIndex = (dayIndex + 1) % 7;
        const taskToCopy = editableProgram.days[dayIndex].tasks[taskIndex];
        const newProgram = { ...editableProgram };

        const newTask: Task = {
            ...taskToCopy,
            id: `task-${Date.now()}-${Math.random()}`, // new unique ID
            status: TaskStatus.Assigned
        };
        newProgram.days[targetDayIndex].tasks.push(newTask);
        setEditableProgram(newProgram);
    };

    const handleSave = () => {
        onSave(editableProgram);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4">Haftalık Program Düzenleyici</h2>
                <p className="text-gray-500 mb-4">AI tarafından oluşturulan planı düzenleyebilir veya yeni görevler ekleyebilirsiniz.</p>
                
                <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                    {editableProgram.days.map((day: any, dayIndex: number) => (
                        <div key={dayIndex} className="p-4 border rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-primary">{day.day}</h3>
                            {day.tasks.length > 0 ? (
                                <div className="space-y-2">
                                    {day.tasks.map((task: Task, taskIndex: number) => (
                                        <div key={task.id} className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={task.description}
                                                onChange={(e) => handleTaskChange(dayIndex, taskIndex, 'description', e.target.value)}
                                                className="flex-grow border-gray-300 rounded-lg shadow-sm p-2"
                                            />
                                            <input
                                                type="number"
                                                value={task.duration}
                                                onChange={(e) => handleTaskChange(dayIndex, taskIndex, 'duration', parseInt(e.target.value) || 0)}
                                                className="w-20 border-gray-300 rounded-lg shadow-sm p-2 text-center"
                                                min="0"
                                            />
                                            <span className="text-sm text-gray-500">dk</span>
                                            <button onClick={() => handleDuplicateTask(dayIndex, taskIndex)} className="text-blue-500 hover:text-blue-700 p-1" title="Görevi ertesi güne kopyala">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.75 9.25c0-.621-.504-1.125-1.125-1.125H18a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V6.75A2.25 2.25 0 0 1 13.5 4.5h3.375c.621 0 1.125.504 1.125 1.125v1.5" /></svg>
                                            </button>
                                            <button onClick={() => handleDeleteTask(dayIndex, taskIndex)} className="text-red-500 hover:text-red-700 p-1" title="Görevi sil">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-gray-400">Bu gün için görev yok.</p>}
                             <button onClick={() => handleAddTask(dayIndex)} className="text-sm text-primary hover:underline mt-3">+ Görev Ekle</button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                    <button onClick={onClose} className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600">İptal</button>
                    <button onClick={handleSave} className="bg-success text-white px-6 py-2 rounded-xl hover:bg-green-700">
                        Planı Kaydet ve Ata
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WeeklyProgramEditorModal;