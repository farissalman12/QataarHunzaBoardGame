import { useState, useEffect, useCallback, useMemo } from 'react';
import { getInitialPieces, calculateValidMoves, getPromotionNodes } from '../utils/gameLogic';

export const useGameEngine = (boardLayout, activeNodes, activeLines, adjacency, sounds) => {
    
    // --- State ---
    const [pieces, setPieces] = useState(() => getInitialPieces('standard'));
    const [turn, setTurn] = useState(1);
    const [winner, setWinner] = useState(null);
    const [isChainJumping, setIsChainJumping] = useState(false);
    const [gameMode, setGameMode] = useState('pvc'); 
    const [selectedPieceId, setSelectedPieceId] = useState(null);
    const [validMoves, setValidMoves] = useState([]); 

    // Reset when layout changes
    useEffect(() => {
        handleReset();
    }, [boardLayout]);

    // Reactive Win Check
    useEffect(() => {
        if (winner) return;
        const p1Count = pieces.filter(p => p.player === 1).length;
        const p2Count = pieces.filter(p => p.player === 2).length;
        
        if (pieces.length > 0) { 
            if (p1Count === 0) {
                setWinner(2);
                sounds.playWin();
            } else if (p2Count === 0) {
                setWinner(1);
                sounds.playWin();
            }
        }
    }, [pieces, winner, sounds]);

    const getPieceAt = useCallback((nodeId) => pieces.find(p => String(p.node) === String(nodeId)), [pieces]);

    const handleReset = useCallback(() => {
        setPieces(getInitialPieces(boardLayout));
        setTurn(1);
        setWinner(null);
        setSelectedPieceId(null);
        setValidMoves([]);
        setIsChainJumping(false); 
        sounds.playClick();
    }, [boardLayout, sounds]);

    const toggleGameMode = () => {
        setGameMode(prev => {
            const next = prev === 'pvp' ? 'pvc' : 'pvp';
            handleReset();
            sounds.playClick();
            return next;
        });
    };

    const executeMove = (move, pieceId = selectedPieceId) => {
        const movedPiece = pieces.find(p => p.id === pieceId);
        if (!movedPiece) return;

        let shouldPromote = false;
        if (!movedPiece.isKing) {
            const promotionNodes = getPromotionNodes(movedPiece.player, boardLayout, activeNodes);
            if (promotionNodes.includes(String(move.target))) shouldPromote = true;
        }

        let nextPieceState = { 
            ...movedPiece, 
            node: move.target,
            isKing: movedPiece.isKing || shouldPromote
        };

        let newPieces = pieces.map(p => 
            p.id === pieceId ? nextPieceState : p
        );

        if (move.type === 'jump') {
            newPieces = newPieces.filter(p => p.id !== move.captured);
            
            if (shouldPromote) {
               // Turn Ends on Promotion
               setPieces(newPieces);
               setSelectedPieceId(null);
               setValidMoves([]);
               setIsChainJumping(false);
               setTurn(turn === 1 ? 2 : 1);
               sounds.playCapture();
            } else {
               // Chain Jump Check
                // Use local 'newPieces' state for calculation
               const subsequentMoves = calculateValidMoves(nextPieceState, newPieces, activeNodes, adjacency, boardLayout);
               const jumpMoves = subsequentMoves.filter(m => m.type === 'jump');
               
               if (jumpMoves.length > 0) {
                   // Force Chain
                   setPieces(newPieces);
                   setValidMoves(jumpMoves);
                   setIsChainJumping(true);
                   sounds.playCapture();
               } else {
                   // Turn Ends
                   setPieces(newPieces);
                   setSelectedPieceId(null);
                   setValidMoves([]);
                   setIsChainJumping(false);
                   setTurn(turn === 1 ? 2 : 1);
                   sounds.playCapture();
               }
            }
        } else {
            // Walk ends turn
            setPieces(newPieces);
            setSelectedPieceId(null);
            setValidMoves([]);
            setIsChainJumping(false);
            setTurn(turn === 1 ? 2 : 1);
            sounds.playMove();
        }
    };

    return {
        pieces, setPieces,
        turn, setTurn,
        winner, setWinner,
        isChainJumping, setIsChainJumping,
        gameMode, setGameMode, toggleGameMode,
        selectedPieceId, setSelectedPieceId,
        validMoves, setValidMoves,
        getPieceAt,
        executeMove,
        handleReset
    };
};
