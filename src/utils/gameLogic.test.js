import { describe, it, expect } from 'vitest';
import { calculateValidMoves, getPromotionNodes } from './gameLogic';
import { BASE_NODES, BASE_LINES } from '../config/layout';

// Mock active nodes/lines for standard board
const activeNodes = BASE_NODES;
const adjacency = {
    '1': new Set(['2', '6']),
    '2': new Set(['1', '3', '7']),
    // ... Simplified adjacency for test context ...
    // Let's rely on logic processing, but we need adjacency map.
    // For unit testing, it's safer to pass a small mock adjacency.
};

describe('Game Logic', () => {
    // Helper to generate a small mock adjacency
    const mockAdjacency = {
        '1': new Set(['2']),
        '2': new Set(['1', '3']),
        '3': new Set(['2'])
    };
    
    // Layout: 1 - 2 - 3 
    const mockNodes = {
        '1': { x: 0, y: 0 },
        '2': { x: 1, y: 0 },
        '3': { x: 2, y: 0 }
    };

    it('should allow simple walk to empty neighbor', () => {
        const piece = { id: 'p1', player: 1, node: '1', isKing: false };
        const pieces = [piece];
        // P1 moves UP (-y). But here y=0 for all?
        // Wait, standard P1 moves UP (decreasing Y).
        // Let's give coords that make sense.
        // Node 1: y=2, Node 2: y=1.
        
        const nodes = {
            '1': { x: 0, y: 2 },
            '2': { x: 0, y: 1 }
        };
        const adj = { '1': new Set(['2']), '2': new Set(['1']) };
        
        const moves = calculateValidMoves(piece, pieces, nodes, adj, 'standard');
        
        expect(moves).toHaveLength(1);
        expect(moves[0].target).toBe('2');
        expect(moves[0].type).toBe('walk');
    });

    it('should prevent backward walk for non-king', () => {
        const piece = { id: 'p1', player: 1, node: '2', isKing: false };
        // P1 moves UP (-y). Moving 2->1 is DOWN (+y) if 2(y=1), 1(y=2).
        
        const nodes = {
            '1': { x: 0, y: 2 },
            '2': { x: 0, y: 1 }
        };
        const adj = { '1': new Set(['2']), '2': new Set(['1']) };
        
        // P1 is at 2(y=1). Neigbor 1 is at y=2. Moving 2->1 increases Y.
        // P1 only decreases Y.
        
        const moves = calculateValidMoves(piece, [piece], nodes, adj, 'standard');
        expect(moves).toHaveLength(0);
    });

    it('should allow jump over opponent', () => {
        // Layout: 1 - 2 - 3 (Vertical)
        // 1(y=3), 2(y=2), 3(y=1)
        const nodes = {
            '1': { x: 0, y: 3 },
            '2': { x: 0, y: 2 },
            '3': { x: 0, y: 1 }
        };
        const adj = {
            '1': new Set(['2']),
            '2': new Set(['1', '3']),
            '3': new Set(['2'])
        };

        const p1 = { id: 'p1', player: 1, node: '1', isKing: false };
        const p2 = { id: 'p2', player: 2, node: '2', isKing: false }; // Enemy
        
        const pieces = [p1, p2];
        
        const moves = calculateValidMoves(p1, pieces, nodes, adj, 'standard');
        
        expect(moves).toHaveLength(1);
        expect(moves[0].type).toBe('jump');
        expect(moves[0].captured).toBe('p2');
        expect(moves[0].target).toBe('3');
    });
});
