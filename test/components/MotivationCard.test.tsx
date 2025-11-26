import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MotivationCard from '../../components/MotivationCard';

describe('MotivationCard', () => {
    it('renders loading state correctly', () => {
        render(<MotivationCard message={null} isLoading={true} />);
        expect(screen.getByText('Sana özel bir mesaj hazırlanıyor...')).toBeInTheDocument();
    });

    it('renders message correctly', () => {
        const mockMessage = {
            message: 'Harika bir gün!',
            timestamp: new Date().toISOString()
        };
        render(<MotivationCard message={mockMessage} isLoading={false} />);
        expect(screen.getByText('"Harika bir gün!"')).toBeInTheDocument();
    });

    it('renders empty state correctly', () => {
        render(<MotivationCard message={null} isLoading={false} />);
        expect(screen.getByText('Bugün için motivasyon mesajı alınamadı.')).toBeInTheDocument();
    });
});
