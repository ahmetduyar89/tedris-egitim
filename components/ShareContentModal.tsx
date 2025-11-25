import React, { useState, useEffect } from 'react';
import { ContentLibraryItem, User } from '../types';
import { db } from '../services/dbAdapter';

interface ShareContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentItem: ContentLibraryItem;
    user: User;
}

interface ShareLink {
    id: string;
    shareToken: string;
    createdAt: string;
    expiresAt: string | null;
    isActive: boolean;
    viewCount: number;
}

const ShareContentModal: React.FC<ShareContentModalProps> = ({ isOpen, onClose, contentItem, user }) => {
    const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expirationDays, setExpirationDays] = useState<number | ''>('');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadShareLinks();
        }
    }, [isOpen, contentItem.id]);

    const loadShareLinks = async () => {
        try {
            const snapshot = await db.collection('publicContentShares')
                .where('contentId', '==', contentItem.id)
                .where('createdBy', '==', user.id)
                .get();

            const links = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                shareToken: doc.data().shareToken,
                createdAt: doc.data().createdAt,
                expiresAt: doc.data().expiresAt,
                isActive: doc.data().isActive,
                viewCount: doc.data().viewCount || 0
            }));

            setShareLinks(links);
        } catch (error) {
            console.error('Error loading share links:', error);
        }
    };

    const generateShareLink = async () => {
        setIsLoading(true);
        try {
            const shareToken = generateRandomToken();
            const expiresAt = expirationDays ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString() : null;

            console.log('[ShareContentModal] Creating share link with token:', shareToken);

            await db.collection('publicContentShares').add({
                contentId: contentItem.id,
                shareToken,
                createdBy: user.id,
                createdAt: new Date().toISOString(),
                expiresAt,
                isActive: true,
                viewCount: 0,
                lastViewedAt: null
            });

            console.log('[ShareContentModal] Share link created successfully');
            await loadShareLinks();
            setExpirationDays('');
        } catch (error) {
            console.error('[ShareContentModal] Error creating share link:', error);
            alert('Paylaşım linki oluşturulurken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const generateRandomToken = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 16; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    };

    const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
        try {
            await db.collection('publicContentShares').doc(linkId).update({
                isActive: !currentStatus
            });
            await loadShareLinks();
        } catch (error) {
            console.error('Error updating link status:', error);
            alert('Link durumu güncellenirken bir hata oluştu.');
        }
    };

    const deleteLink = async (linkId: string) => {
        if (!confirm('Bu paylaşım linkini silmek istediğinizden emin misiniz?')) return;

        try {
            await db.collection('publicContentShares').doc(linkId).delete();
            await loadShareLinks();
        } catch (error) {
            console.error('Error deleting link:', error);
            alert('Link silinirken bir hata oluştu.');
        }
    };

    const copyToClipboard = (token: string) => {
        const shareUrl = `${window.location.origin}/share/${token}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
        });
    };

    const getShareUrl = (token: string) => {
        return `${window.location.origin}/share/${token}`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Süresiz';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">İçeriği Paylaş</h3>
                            <p className="text-green-100">{contentItem.title}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                        <div className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                            </svg>
                            <p className="text-sm text-blue-800">
                                Bu içeriği link ile paylaşarak sistemde kayıtlı olmayan kişilerin de erişmesini sağlayabilirsiniz.
                                Linke erişen herkes içeriği görüntüleyebilir.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 mb-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Yeni Paylaşım Linki Oluştur</h4>
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Link Geçerlilik Süresi (Gün)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Boş bırakırsanız süresiz olur"
                                    value={expirationDays}
                                    onChange={(e) => setExpirationDays(e.target.value ? parseInt(e.target.value) : '')}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                            <button
                                onClick={generateShareLink}
                                disabled={isLoading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Oluşturuluyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        <span>Link Oluştur</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Mevcut Paylaşım Linkleri</h4>
                        {shareLinks.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                </svg>
                                <p>Henüz paylaşım linki oluşturulmamış.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {shareLinks.map((link) => {
                                    const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                                    const shareUrl = getShareUrl(link.shareToken);

                                    return (
                                        <div key={link.id} className={`border-2 rounded-xl p-4 ${link.isActive && !isExpired ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${link.isActive && !isExpired ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                                                            {isExpired ? 'SÜRESİ DOLMUŞ' : link.isActive ? 'AKTİF' : 'DEVRE DIŞI'}
                                                        </span>
                                                        <span className="text-xs text-gray-600">
                                                            {link.viewCount} görüntülenme
                                                        </span>
                                                    </div>
                                                    <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-gray-700 break-all">
                                                        {shareUrl}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-2">
                                                        Oluşturulma: {formatDate(link.createdAt)} • Son geçerlilik: {formatDate(link.expiresAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => copyToClipboard(link.shareToken)}
                                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                                                >
                                                    {copiedToken === link.shareToken ? (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                            </svg>
                                                            <span>Kopyalandı!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                                            </svg>
                                                            <span>Kopyala</span>
                                                        </>
                                                    )}
                                                </button>
                                                {!isExpired && (
                                                    <button
                                                        onClick={() => toggleLinkStatus(link.id, link.isActive)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${link.isActive ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                                    >
                                                        {link.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteLink(link.id)}
                                                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareContentModal;
