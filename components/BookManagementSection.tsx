import React, { useState, useEffect } from 'react';
import { User, Book, BookQuestion } from '../types';
import { getTeacherBooks, deleteBook, getBookQuestions } from '../services/bookReadingService';
import AddBookModal from './AddBookModal';
import ManageBookQuestionsModal from './ManageBookQuestionsModal';

interface BookManagementSectionProps {
    user: User;
}

const BookManagementSection: React.FC<BookManagementSectionProps> = ({ user }) => {
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState<{ book: Book; questions: BookQuestion[] } | null>(null);

    useEffect(() => {
        loadBooks();
    }, [user.id]);

    const loadBooks = async () => {
        setIsLoading(true);
        try {
            const booksData = await getTeacherBooks(user.id);
            setBooks(booksData);
        } catch (error) {
            console.error('Error loading books:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBook = async (bookId: string) => {
        if (!confirm('Bu kitabı silmek istediğinizden emin misiniz? İlgili tüm sorular ve atamalar da silinecektir.')) return;

        try {
            await deleteBook(bookId);
            await loadBooks();
        } catch (error) {
            console.error('Error deleting book:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleManageQuestions = async (book: Book) => {
        try {
            const questions = await getBookQuestions(book.id);
            setSelectedBook({ book, questions });
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Sorular yüklenirken bir hata oluştu.');
        }
    };

    const handleBookAdded = async (bookId: string) => {
        await loadBooks();
        const book = books.find(b => b.id === bookId);
        if (book) {
            handleManageQuestions(book);
        }
    };

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">📚 Kitap Kütüphanesi</h2>
                    <p className="text-gray-600 mt-1">Öğrencilerinize atayabileceğiniz kitapları yönetin</p>
                </div>
                <button
                    onClick={() => setShowAddBookModal(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Kitap Ekle
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Yükleniyor...</p>
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-5xl mb-3">📚</div>
                    <p className="text-gray-600 font-medium mb-2">Henüz kitap eklenmemiş</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Kitap ekleyerek öğrencilerinize atayabilirsiniz
                    </p>
                    <button
                        onClick={() => setShowAddBookModal(true)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        İlk Kitabı Ekle
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map((book) => (
                        <div key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{book.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2">✍️ {book.author}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteBook(book.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Sil"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="mr-2">📄</span>
                                    <span>{book.pageCount} sayfa</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="mr-2">📅</span>
                                    <span>{book.estimatedReadingDays} gün</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="mr-2">⭐</span>
                                    <span>Seviye {book.difficultyLevel}/5</span>
                                </div>
                            </div>

                            {book.summary && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{book.summary}</p>
                            )}

                            <button
                                onClick={() => handleManageQuestions(book)}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                            >
                                Soruları Yönet
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showAddBookModal && (
                <AddBookModal
                    user={user}
                    onClose={() => setShowAddBookModal(false)}
                    onSuccess={handleBookAdded}
                />
            )}

            {selectedBook && (
                <ManageBookQuestionsModal
                    bookId={selectedBook.book.id}
                    bookTitle={selectedBook.book.title}
                    existingQuestions={selectedBook.questions}
                    onClose={() => setSelectedBook(null)}
                    onSuccess={() => {
                        setSelectedBook(null);
                        loadBooks();
                    }}
                />
            )}
        </div>
    );
};

export default BookManagementSection;
