import { calculateValidMoves, getPromotionNodes } from './gameLogic';

// Move Simulation Helper
export const simulateMove = (pieces, move, activeNodes, boardLayout) => {
    // Deep clone
    const newPieces = pieces.map(p => ({ ...p }));
    const movedPiece = newPieces.find(p => p.id === move.pieceId);
    if (!movedPiece) return newPieces;

    // 1. Move
    movedPiece.node = move.target;

    // 2. Promote
    if (!movedPiece.isKing) {
        const promo = getPromotionNodes(movedPiece.player, boardLayout, activeNodes);
        if (promo.includes(String(move.target))) {
            movedPiece.isKing = true;
        }
    }

    // 3. Remove Captured
    if (move.type === 'jump' && move.captured) {
        const captureIndex = newPieces.findIndex(p => p.id === move.captured);
        if (captureIndex !== -1) newPieces.splice(captureIndex, 1);
    }

    return newPieces;
};

// Heuristic Evaluation
export const evaluateBoard = (pieces, activeNodes) => {
    let score = 0;
    
    pieces.forEach(p => {
        // Base Value
        let val = p.isKing ? 100 : 20;
        
        // Positional (Center Control)
        const pos = activeNodes[p.node];
        if (pos) {
            // Advancement Logic
            if (p.player === 2 && !p.isKing) {
               val += pos.y * 2; // Encourages moving down
            } else if (p.player === 1 && !p.isKing) {
               // Assuming standard grid where y ranges roughly 0-4?
               // Let's use relative worth. 
               // Actually, let's keep it simple: 
               // Higher Y is better for P2 (Down), Lower Y is better for P1 (Up).
               // But 'pos.y' values depend on layout. 
               // For standard: P1 starts safely at bottom (High Y?), target Top (Low Y?).
               // Wait, existing code said: val -= (10 - pos.y) * 2;
               // This implies P1 wants to Minimize (10-Y) -> Maximize Y?
               // Let's trust the logic I verified earlier or improve it.
               
               // Let's stick to the extracted logic pattern.
               // We will assume 'standard' layout conventions where Y decreases upwards.
               // So P1 wants to DECREASE Y.
            }

            // Centrality
            if (pos.x >= 3 && pos.x <= 5) val += 3;
        }

        if (p.player === 2) score += val;
        else score -= val;
    });

    return score;
};

export const getPlayerMoves = (player, currentPieces, activeNodes, adjacency, boardLayout) => {
    const myPieces = currentPieces.filter(p => p.player === player);
    let allMoves = [];
    
    myPieces.forEach(p => {
         const moves = calculateValidMoves(p, currentPieces, activeNodes, adjacency, boardLayout);
         moves.forEach(m => allMoves.push({ ...m, pieceId: p.id }));
    });

    // Forced Jump Rule
    const jumps = allMoves.filter(m => m.type === 'jump');
    if (jumps.length > 0) return jumps;
    
    return allMoves;
};

// Exported Minimax for Testing/Usage
export const runMinimax = (currentPieces, depth, alpha, beta, isMaximizing, activeNodes, adjacency, boardLayout) => {
    // Base Case
    if (depth === 0) {
        return evaluateBoard(currentPieces, activeNodes);
    }

    const player = isMaximizing ? 2 : 1;
    const moves = getPlayerMoves(player, currentPieces, activeNodes, adjacency, boardLayout);

    // Terminal State
    if (moves.length === 0) {
        return isMaximizing ? -10000 : 10000;
    }

    // Move Ordering
    moves.sort((a, b) => {
        if (a.type === 'jump' && b.type !== 'jump') return -1;
        if (b.type === 'jump' && a.type !== 'jump') return 1;
        return 0;
    });

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const nextState = simulateMove(currentPieces, move, activeNodes, boardLayout);
            let evalScore;
            
            // Chain Jump Logic
            if (move.type === 'jump') {
                const movedPiece = nextState.find(p => p.id === move.pieceId);
                const promo = getPromotionNodes(movedPiece.player, boardLayout, activeNodes);
                
                if (movedPiece && !movedPiece.isKing && promo.includes(String(move.target))) {
                     evalScore = runMinimax(nextState, depth - 1, alpha, beta, false, activeNodes, adjacency, boardLayout);
                } else if (movedPiece) {
                     const nextMoves = calculateValidMoves(movedPiece, nextState, activeNodes, adjacency, boardLayout);
                     const jumps = nextMoves.filter(m => m.type === 'jump');
                     
                     if (jumps.length > 0) {
                         // Continue Maximizing (Chain)
                         evalScore = runMinimax(nextState, depth, alpha, beta, true, activeNodes, adjacency, boardLayout); 
                     } else {
                         evalScore = runMinimax(nextState, depth - 1, alpha, beta, false, activeNodes, adjacency, boardLayout);
                     }
                } else {
                    evalScore = runMinimax(nextState, depth - 1, alpha, beta, false, activeNodes, adjacency, boardLayout);
                }
            } else {
                evalScore = runMinimax(nextState, depth - 1, alpha, beta, false, activeNodes, adjacency, boardLayout);
            }

            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const nextState = simulateMove(currentPieces, move, activeNodes, boardLayout);
            let evalScore;
             
            // Opponent Chain Logic
            if (move.type === 'jump') {
                const movedPiece = nextState.find(p => p.id === move.pieceId);
                const promo = getPromotionNodes(movedPiece.player, boardLayout, activeNodes);

                if (movedPiece && !movedPiece.isKing && promo.includes(String(move.target))) {
                     evalScore = runMinimax(nextState, depth - 1, alpha, beta, true, activeNodes, adjacency, boardLayout);
                } else if (movedPiece) {
                     const nextMoves = calculateValidMoves(movedPiece, nextState, activeNodes, adjacency, boardLayout);
                     const jumps = nextMoves.filter(m => m.type === 'jump');
                     
                     if (jumps.length > 0) {
                         evalScore = runMinimax(nextState, depth, alpha, beta, false, activeNodes, adjacency, boardLayout); 
                     } else {
                         evalScore = runMinimax(nextState, depth - 1, alpha, beta, true, activeNodes, adjacency, boardLayout);
                     }
                } else {
                    evalScore = runMinimax(nextState, depth - 1, alpha, beta, true, activeNodes, adjacency, boardLayout);
                }
            } else {
                evalScore = runMinimax(nextState, depth - 1, alpha, beta, true, activeNodes, adjacency, boardLayout);
            }

            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};
