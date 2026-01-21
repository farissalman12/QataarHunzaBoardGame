import { useEffect, useRef } from 'react';
import { runMinimax, simulateMove, getPlayerMoves } from '../utils/aiLogic';

export const useAI = ({
    turn, gameMode, winner, pieces, 
    isChainJumping, selectedPieceId, validMoves,
    executeMove, setSelectedPieceId, setTurn,
    boardLayout, activeNodes, adjacency,
    difficulty = 'normal'
}) => {
    
    const workerRef = useRef(null);
    const isThinking = useRef(false);
    
    // Stale Closure Fix: Keep latest functions in Ref
    const callbacks = useRef({ executeMove, setSelectedPieceId, setTurn });
    useEffect(() => {
        callbacks.current = { executeMove, setSelectedPieceId, setTurn };
    });

    // Initialize Worker
    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/aiWorker.js', import.meta.url), { type: 'module' });
        
        workerRef.current.onmessage = (e) => {
            const move = e.data;
            const { executeMove, setSelectedPieceId, setTurn } = callbacks.current;
            
            if (move) {
                setSelectedPieceId(move.pieceId);
                executeMove(move, move.pieceId);
            } else {
                setTurn(1);
            }
            isThinking.current = false;
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []); // Run once on mount

    useEffect(() => {
        if (gameMode === 'pvc' && turn === 2 && !winner && !isThinking.current) {
            isThinking.current = true;
            
            // Chain Jump Logic (Quick check on main thread OK, or move to worker?)
            // Chain jumps are forced and usually single-options in UI, so let's handle greedy chain on main thread for speed?
            // Actually, keep logic consistent. If chain jumping, we usually want immediate UI response.
            if (isChainJumping && selectedPieceId) {
                const piece = pieces.find(p => p.id === selectedPieceId);
                if (validMoves.length > 0 && piece) {
                    setTimeout(() => {
                         const move = validMoves[0]; 
                         executeMove(move, piece.id);
                         isThinking.current = false;
                    }, 500);
                } else {
                    setTurn(1);
                    isThinking.current = false;
                }
                return;
            }

            // Regular Move - Send to Worker
            // Add slight delay so UI can render "Thinking..." state if we had one
            setTimeout(() => {
                workerRef.current.postMessage({
                    pieces, 
                    activeNodes, 
                    adjacency, 
                    boardLayout, 
                    difficulty
                });
            }, 500);
        }
    }, [turn, isChainJumping, validMoves, winner, gameMode, pieces]);

    // Cleanup helper (Removed sync logic)
};
