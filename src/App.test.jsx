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

// Mock window.confirm
window.confirm = vi.fn(() => true);

const getSlot = (n) => screen.getByRole('button', { name: new RegExp(`^${n}$`) });
const getFreezerSelect = () => screen.getByRole('combobox');

describe('Freezer Manager Refined Tests', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders correctly with 13 freezers in a select dropdown', () => {
        render(<App />);
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(13);
        expect(options[0]).toHaveTextContent(/Freezer 1 \(Caixas\)/i);
        expect(options[1]).toHaveTextContent(/Freezer 2 \(Potes\)/i);
    });

    it('renders 24 slots for each freezer', () => {
        render(<App />);
        const slots = screen.getAllByRole('button', { name: /^[0-9]+$/ });
        expect(slots).toHaveLength(24);
    });

    it('toggles slot state on click', async () => {
        render(<App />);
        const slot1 = getSlot(1);

        expect(slot1).toHaveClass('vazia');
        fireEvent.click(slot1);
        expect(slot1).toHaveClass('cheia');
    });

    it('clears current freezer state', async () => {
        render(<App />);
        const slot1 = getSlot(1);
        fireEvent.click(slot1);
        expect(slot1).toHaveClass('cheia');

        const clearBtn = screen.getByText(/Limpar/i);
        fireEvent.click(clearBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(slot1).toHaveClass('vazia');
    });

    it('maintains separate state for different freezer layouts', async () => {
        render(<App />);

        // Switch to Freezer 2 (Potes)
        const select = getFreezerSelect();
        fireEvent.change(select, { target: { value: '1' } }); // index 1 = Freezer 2

        const slot1 = getSlot(1);
        fireEvent.click(slot1);

        // Check that Potes stats show 1 cheia
        const potesHeading = screen.getByRole('heading', { name: /^Potes$/i });
        const potesGroup = potesHeading.closest('.stats-group');
        const cheiaValue = potesGroup.querySelector('.stat-item.blue .stat-value');
        expect(cheiaValue).toHaveTextContent('1');
    });
});

describe('Freezer Manager Integration Tests V2', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('persists data to localStorage_v2', async () => {
        render(<App />);

        const slot5 = getSlot(5);
        fireEvent.click(slot5);

        await waitFor(() => {
            expect(localStorage.setItem).toHaveBeenCalledWith('freezer_data_v2', expect.any(String));
            const calls = localStorage.setItem.mock.calls;
            const lastCall = calls[calls.length - 1];
            const callArgs = JSON.parse(lastCall[1]);
            expect(callArgs[0][4]).toBe(true);
        });
    });
});
