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

describe('Freezer Manager Final Tests', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders correctly with 13 named freezers in dropdown', () => {
        render(<App />);
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(13);
        expect(options[0]).toHaveTextContent(/Disney 1 \(Caixas\)/i);
        expect(options[2]).toHaveTextContent(/Zero \(Potes\)/i);
    });

    it('generates a report and opens it for WhatsApp', () => {
        render(<App />);
        const slot1 = getSlot(1);
        fireEvent.click(slot1);

        const reportBtn = screen.getByText(/Relatório/i);
        fireEvent.click(reportBtn);

        expect(window.open).toHaveBeenCalledWith(expect.stringContaining('wa.me'), '_blank');
    });

    it('resets all freezers via Zerar App', async () => {
        render(<App />);
        const slot1 = getSlot(1);
        fireEvent.click(slot1);
        expect(slot1).toHaveClass('cheia');

        const resetBtn = screen.getByText(/Zerar App/i);
        fireEvent.click(resetBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(slot1).toHaveClass('vazia');
    });
});
