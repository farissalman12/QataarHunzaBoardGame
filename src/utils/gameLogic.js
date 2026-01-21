import { SQUARE_NODES, BASE_NODES, EXTRA_NODES, SQUARE_LINES, BASE_LINES, EXTRA_LINES } from '../config/layout';

export const getInitialPieces = (layout) => {
    if (layout === 'square') {
        return [
            { id: 'p2-1', player: 2, node: 1, isKing: false }, { id: 'p2-2', player: 2, node: 2, isKing: false }, { id: 'p2-3', player: 2, node: 3, isKing: false },
            { id: 'p2-4', player: 2, node: 9, isKing: false }, { id: 'p2-5', player: 2, node: 10, isKing: false }, { id: 'p2-6', player: 2, node: 11, isKing: false },
            
            { id: 'p1-1', player: 1, node: 6, isKing: false }, { id: 'p1-2', player: 1, node: 7, isKing: false }, { id: 'p1-3', player: 1, node: 8, isKing: false },
            { id: 'p1-4', player: 1, node: 14, isKing: false }, { id: 'p1-5', player: 1, node: 15, isKing: false }, { id: 'p1-6', player: 1, node: 16, isKing: false },
        ];
    }

    if (layout === 'custom') {
        try {
            const saved = localStorage.getItem('qataar_custom_board');
            if (saved) {
                const config = JSON.parse(saved);
                return config.pieces || [];
            }
        } catch (e) {
            console.error("Failed to load custom board:", e);
        }
        return [];
    }
    // Standard / Extended
    return [
        ...Array.from({ length: 9 }, (_, i) => ({ id: `p2-${i+1}`, player: 2, node: i + 1, isKing: false })),    // P2 Top
        ...Array.from({ length: 9 }, (_, i) => ({ id: `p1-${i+1}`, player: 1, node: i + 10, isKing: false })),   // P1 Bottom
    ];
};

export const getPromotionNodes = (player, boardLayout, activeNodes) => {
    if (boardLayout === 'custom') {
        const allNodes = Object.values(activeNodes);
        if (allNodes.length === 0) return [];

        if (player === 1) {
           const minY = Math.min(...allNodes.map(n => n.y));
           return Object.keys(activeNodes).filter(id => activeNodes[id].y === minY);
        } else {
           const maxY = Math.max(...allNodes.map(n => n.y));
           return Object.keys(activeNodes).filter(id => activeNodes[id].y === maxY);
        }
    }

    if (player === 1) return ['1', '2', '3']; 
    if (player === 2) {
        if (boardLayout === 'square') return ['6', '7', '8'];
        return ['16', '17', '18'];
    }
    return [];
};

export const calculateValidMoves = (piece, pieces, activeNodes, adjacency, boardLayout) => {
    const moves = [];
    const currentNode = piece.node;
    const currentPos = activeNodes[currentNode];
    
    if (!currentPos) return [];

    const getPieceInState = (id) => pieces.find(p => String(p.node) === String(id));

    // Get neighbors
    const neighbors = Array.from(adjacency[currentNode] || []);

    neighbors.forEach(neighborId => {
       const occupant = getPieceInState(neighborId);
       
       // 1. Walk (Empty Spot)
       if (!occupant) {
           const nPos = activeNodes[neighborId];
           if (!nPos) return;

           // Determine direction
           let isForward = false;
           if (piece.isKing || boardLayout === 'custom') {
               // Custom Boards allow Free Roam (Omnidirectional)
               isForward = true;
           } else {
               if (piece.player === 1 && nPos.y < currentPos.y) isForward = true; // P1 moves UP (-y)
               else if (piece.player === 2 && nPos.y > currentPos.y) isForward = true; // P2 moves DOWN (+y)
               else if (nPos.y === currentPos.y) isForward = true; // Horizontal is always allowed
           }

           if (isForward) {
               moves.push({ target: neighborId, type: 'walk' });
           }
       } 
       // 2. Jump (Opponent + Empty Spot Behind)
       else if (occupant.player !== piece.player) {
           // ... (Jump logic remains geometric, but always allowed if geometry valid)
           // Actually, Jump logic doesn't check 'isForward' explicitly in the loop, 
           // but traditionally you can only jump forward? 
           // In this codebase, Jump vector check is purely geometric.
           // However, let's keep it as is. Usually 'isForward' constraint applies to non-Kings.
           // BE CAREFUL: Standard Checkers allows Jumping backwards? NO. Only Kings.
           // But here, I want Custom Board to be fully fluid.
           
           // Geometric Check:
           const midPos = activeNodes[neighborId];
           
           const candidates = Array.from(adjacency[neighborId] || []);
           candidates.forEach(landing => {
               if (String(landing) === String(currentNode)) return;
               
               // Check if landing is empty
               if (getPieceInState(landing)) return;

               const endPos = activeNodes[landing];
               if (!endPos) return;

               // Check Colinearity (within tolerance)
               const v1 = { x: midPos.x - currentPos.x, y: midPos.y - currentPos.y };
               const v2 = { x: endPos.x - midPos.x, y: endPos.y - midPos.y };
               
               const len1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y);
               const len2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y);
               
               if (len1 === 0 || len2 === 0) return;
               
               const dot = (v1.x * v2.x + v1.y * v2.y) / (len1 * len2);
               
               if (dot > 0.9) {
                   // Directionality Check for Jumps
                   let isValidJumpDir = false;
                   if (piece.isKing || boardLayout === 'custom') {
                       isValidJumpDir = true;
                   } else {
                        // Check if vector is "Forward"
                        // v1 is direction.
                        if (piece.player === 1 && v1.y < 0) isValidJumpDir = true; // Up
                        else if (piece.player === 2 && v1.y > 0) isValidJumpDir = true; // Down
                        else if (Math.abs(v1.y) < 0.1) isValidJumpDir = true; // Horizontal
                   }

                   if (isValidJumpDir) {
                        moves.push({ target: landing, type: 'jump', captured: occupant.id });
                   }
               }
           });
       }
    });

    return moves;
  };
