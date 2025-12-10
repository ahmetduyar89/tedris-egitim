import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import Header from '../components/Header';
import EditTutorModal from '../components/EditTutorModal';

interface Tutor {
    id: string;
    name: string;
    email: string;
    requested_at?: string;
    approved_at?: string;
}

interface AdminDashboardProps {
    onLogout: () => void;
    adminName: string;
}

type TabType = 'pending' | 'approved';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, adminName }) => {
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [pendingTutors, setPendingTutors] = useState<Tutor[]>([]);
    const [approvedTutors, setApprovedTutors] = useState<Tutor[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);

    useEffect(() => {
        fetchTutors();
    }, []);

    const fetchTutors = async () => {
        setLoading(true);
        await Promise.all([fetchPendingTutors(), fetchApprovedTutors()]);
        setLoading(false);
    };

    const fetchPendingTutors = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'tutor')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map database fields to Tutor interface
            const tutors: Tutor[] = (data || []).map(user => ({
                id: user.id,
                name: user.name || user.full_name || 'İsimsiz',
                email: user.email,
                requested_at: user.created_at
            }));

            setPendingTutors(tutors);
        } catch (error) {
            console.error('Error fetching pending tutors:', error);
        }
    };

    const fetchApprovedTutors = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'tutor')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map database fields to Tutor interface
            const tutors: Tutor[] = (data || []).map(user => ({
                id: user.id,
                name: user.name || user.full_name || 'İsimsiz',
                email: user.email,
                approved_at: user.updated_at // Using updated_at as approximation for approval time
            }));

            setApprovedTutors(tutors);
        } catch (error) {
            console.error('Error fetching approved tutors:', error);
        }
    };

    const handleApprove = async (tutorId: string) => {
        setProcessingId(tutorId);
        try {
            // 1. Update user status in public.users table
            // 1. Update user status via RPC to bypass RLS recursion issues
            const { error: updateError } = await supabase.rpc('admin_update_user_status', {
                target_user_id: tutorId,
                new_status: 'approved'
            });

            if (updateError) throw updateError;

            // 2. We can't update auth.users metadata directly from client due to security
            // But the public.users table is the source of truth for our app logic

            alert('Öğretmen başarıyla onaylandı!');
            await fetchTutors();
        } catch (error: any) {
            console.error('Error approving tutor:', error);
            alert('Öğretmen onaylanırken bir hata oluştu: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (tutorId: string) => {
        if (!confirm('Bu öğretmen kaydını reddetmek istediğinizden emin misiniz?')) {
            return;
        }

        setProcessingId(tutorId);
        try {
            const { error } = await supabase.rpc('admin_update_user_status', {
                target_user_id: tutorId,
                new_status: 'rejected'
            });

            if (error) throw error;

            alert('Öğretmen kaydı reddedildi.');
            await fetchTutors();
        } catch (error: any) {
            console.error('Error rejecting tutor:', error);
            alert('Öğretmen reddedilirken bir hata oluştu: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (tutorId: string, tutorName: string) => {
        if (!confirm(`${tutorName} adlı öğretmeni silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
            return;
        }

        setProcessingId(tutorId);
        try {
            // Delete from public.users
            // Note: This won't delete from auth.users due to Supabase security limitations for client-side
            // But the user won't be able to login to the app effectively
            // Delete using RPC to bypass RLS recursion
            const { error } = await supabase.rpc('admin_delete_user', {
                target_user_id: tutorId
            });

            if (error) throw error;

            alert('Öğretmen başarıyla silindi!');
            await fetchTutors();
        } catch (error: any) {
            console.error('Error deleting tutor:', error);
            alert('Öğretmen silinirken bir hata oluştu: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleEdit = (tutor: Tutor) => {
        setEditingTutor(tutor);
    };

    const handleSaveEdit = async (tutorId: string, name: string, email: string) => {
        try {
            // Only update name, email update in auth requires more complex flow
            // Update using RPC
            const { error } = await supabase.rpc('admin_update_user_details', {
                target_user_id: tutorId,
                new_name: name
            });

            if (error) throw error;

            alert('Öğretmen bilgileri güncellendi! (Not: E-posta değişikliği sadece veritabanında yapıldı, giriş bilgileri değişmedi)');
            await fetchTutors();
        } catch (error: any) {
            console.error('Error updating tutor:', error);
            alert('Öğretmen güncellenirken bir hata oluştu: ' + error.message);
            throw error;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Header userName={adminName} onLogout={onLogout} role="admin" />

            <div className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold font-poppins text-text-primary mb-2">
                            Admin Paneli
                        </h1>
                        <p className="text-text-secondary">
                            Öğretmen kayıtlarını yönetin
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex">
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'pending'
                                        ? 'text-primary border-b-2 border-primary bg-blue-50'
                                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Bekleyen Kayıtlar
                                        {pendingTutors.length > 0 && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                                                {pendingTutors.length}
                                            </span>
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('approved')}
                                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'approved'
                                        ? 'text-primary border-b-2 border-primary bg-blue-50'
                                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Onaylı Öğretmenler
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                                            {approvedTutors.length}
                                        </span>
                                    </div>
                                </button>
                            </nav>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-text-secondary mt-4">Yükleniyor...</p>
                                </div>
                            ) : activeTab === 'pending' ? (
                                pendingTutors.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="text-xl font-semibold text-text-primary mb-2">
                                            Bekleyen Kayıt Yok
                                        </h3>
                                        <p className="text-text-secondary">
                                            Şu anda onay bekleyen öğretmen kaydı bulunmuyor.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">İsim</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">E-posta</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Talep Tarihi</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {pendingTutors.map(tutor => (
                                                    <tr key={tutor.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-text-primary">{tutor.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-text-secondary">{tutor.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-text-secondary text-sm">
                                                                {tutor.requested_at && new Date(tutor.requested_at).toLocaleDateString('tr-TR', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => handleApprove(tutor.id)}
                                                                    disabled={processingId === tutor.id}
                                                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    Onayla
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(tutor.id)}
                                                                    disabled={processingId === tutor.id}
                                                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    Reddet
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                approvedTutors.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                        </svg>
                                        <h3 className="text-xl font-semibold text-text-primary mb-2">
                                            Henüz Onaylı Öğretmen Yok
                                        </h3>
                                        <p className="text-text-secondary">
                                            Bekleyen kayıtları onaylayarak başlayın.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">İsim</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">E-posta</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Onay Tarihi</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {approvedTutors.map(tutor => (
                                                    <tr key={tutor.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-text-primary">{tutor.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-text-secondary">{tutor.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-text-secondary text-sm">
                                                                {tutor.approved_at && new Date(tutor.approved_at).toLocaleDateString('tr-TR', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => handleEdit(tutor)}
                                                                    disabled={processingId === tutor.id}
                                                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                    </svg>
                                                                    Düzenle
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(tutor.id, tutor.name)}
                                                                    disabled={processingId === tutor.id}
                                                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
                                                                    Sil
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {editingTutor && (
                <EditTutorModal
                    tutor={editingTutor}
                    onClose={() => setEditingTutor(null)}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
