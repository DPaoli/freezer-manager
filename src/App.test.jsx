import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock window.confirm and window.open
window.confirm = vi.fn(() => true);
window.open = vi.fn();

const getSlot = (n) => screen.getByRole('button', { name: new RegExp(`^${n}$`) });

describe('Freezer Manager Mixed Layout Tests', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders correctly with specific named freezers and types', () => {
        render(<App />);
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(13);
        expect(options[0]).toHaveTextContent(/Disney 1 \(Caixa\)/i);
        expect(options[3]).toHaveTextContent(/HK\/Festa \(Pote\/Caixa\)/i);
        expect(options[5]).toHaveTextContent(/Potes Tradicionais \(Pote\)/i);
    });

    it('handles HK/Festa mixed stats correctly', () => {
        render(<App />);

        // Switch to HK/Festa (index 3)
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '3' } });

        // Click slot 1 (Pote zone)
        const slot1 = getSlot(1);
        fireEvent.click(slot1);

        // Click slot 13 (Caixa zone)
        const slot13 = getSlot(13);
        fireEvent.click(slot13);

        // Check Potes stats header (Potes cheias should be 1)
        const potesHeading = screen.getByRole('heading', { name: /^Potes$/i });
        const potesGroup = potesHeading.closest('.stats-group');
        expect(potesGroup.querySelector('.stat-item.blue .stat-value')).toHaveTextContent('1');

        // Check Caixas stats header (Caixas cheias should be 1)
        const caixasHeading = screen.getByRole('heading', { name: /^Caixas$/i });
        const caixasGroup = caixasHeading.closest('.stats-group');
        expect(caixasGroup.querySelector('.stat-item.blue .stat-value')).toHaveTextContent('1');
    });

    it('generates a detailed report with mixed info', () => {
        render(<App />);
        // Select HK/Festa
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '3' } });

        // Fill one pote and one caixa
        fireEvent.click(getSlot(1));
        fireEvent.click(getSlot(13));

        const reportBtn = screen.getByText(/Relatório/i);
        fireEvent.click(reportBtn);

        expect(window.open).toHaveBeenCalledWith(expect.stringContaining('HK%2FFesta*%3A%201%20Potes%20%2F%201%20Caixas'), '_blank');
    });

    it('resets all freezers via Limpar Tudo', async () => {
        render(<App />);
        const slot1 = getSlot(1);
        fireEvent.click(slot1);
        expect(slot1).toHaveClass('cheia');

        // Confirm stats are greater than 0
        const caixasGroup = screen.getByRole('heading', { name: /^Caixas$/i }).closest('.stats-group');
        expect(caixasGroup.querySelector('.stat-item.blue .stat-value')).toHaveTextContent('1');

        const resetBtn = screen.getByText(/Limpar Tudo/i);
        fireEvent.click(resetBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(slot1).toHaveClass('vazia');

        // Confirm stats are back to 0
        expect(caixasGroup.querySelector('.stat-item.blue .stat-value')).toHaveTextContent('0');
    });
});
