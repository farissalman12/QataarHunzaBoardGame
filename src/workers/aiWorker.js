import { runMinimax, simulateMove, getPlayerMoves } from '../utils/aiLogic';

self.onmessage = (e) => {
    const { 
        pieces, 
        activeNodes, 
        adjacency, 
        boardLayout, 
        difficulty 
    } = e.data;

    const moves = getPlayerMoves(2, pieces, activeNodes, adjacency, boardLayout);

    if (moves.length === 0) {
        self.postMessage(null);
        return;
    }

    // 1. EASY: Random
    if (difficulty === 'easy') {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        self.postMessage(randomMove);
        return;
    }

    // 2. NORMAL/HARD
    const depth = difficulty === 'hard' ? 6 : 2;
    
    let bestMove = null;
    let bestValue = -Infinity;

    // Shuffle
    const shuffledMoves = moves.sort(() => 0.5 - Math.random());
    
    // Prioritize Jumps
    shuffledMoves.sort((a, b) => {
            if (a.type === 'jump' && b.type !== 'jump') return -1;
            return 0;
    });

    for (const move of shuffledMoves) {
        const nextState = simulateMove(pieces, move, activeNodes, boardLayout);
        const moveValue = runMinimax(
            nextState, depth - 1, -Infinity, Infinity, false, 
            activeNodes, adjacency, boardLayout
        );
        
        if (moveValue > bestValue) {
            bestValue = moveValue;
            bestMove = move;
        }
    }

    self.postMessage(bestMove);
};
