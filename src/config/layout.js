export const BASE_NODES = {
  // Center
  19: { x: 0, y: 0, label: 'C' },
  
  // Top Triangle (P1)
  // Row 3 (Inner)
  7: { x: -1, y: -1, label: '7' },
  8: { x: 0, y: -1, label: '8' },
  9: { x: 1, y: -1, label: '9' },
  // Row 2 (Middle)
  4: { x: -2, y: -2, label: '4' },
  5: { x: 0, y: -2, label: '5' },
  6: { x: 2, y: -2, label: '6' },
  // Row 1 (Outer)
  1: { x: -3, y: -3, label: '1' },
  2: { x: 0, y: -3, label: '2' },
  3: { x: 3, y: -3, label: '3' },

  // Bottom Triangle (P2)
  // Row 4 (Inner)
  10: { x: -1, y: 1, label: '10' },
  11: { x: 0, y: 1, label: '11' },
  12: { x: 1, y: 1, label: '12' },
  // Row 5 (Middle)
  13: { x: -2, y: 2, label: '13' },
  14: { x: 0, y: 2, label: '14' },
  15: { x: 2, y: 2, label: '15' },
  // Row 6 (Outer)
  16: { x: -3, y: 3, label: '16' },
  17: { x: 0, y: 3, label: '17' },
  18: { x: 3, y: 3, label: '18' },
};

export const EXTRA_NODES = {
    20: { x: -3, y: 0, label: 'L' },
    21: { x: 3, y: 0, label: 'R' }
};

export const SQUARE_NODES = {
    // Outer Ring (-3 to 3)
    1: { x: -3, y: -3, label: 'TL1' }, 2: { x: 0, y: -3, label: 'TM1' }, 3: { x: 3, y: -3, label: 'TR1' },
    4: { x: -3, y: 0, label: 'ML1' },                                    5: { x: 3, y: 0, label: 'MR1' },
    6: { x: -3, y: 3, label: 'BL1' }, 7: { x: 0, y: 3, label: 'BM1' }, 8: { x: 3, y: 3, label: 'BR1' },

    // Middle Ring (-2 to 2)
    9: { x: -2, y: -2, label: 'TL2' }, 10: { x: 0, y: -2, label: 'TM2' }, 11: { x: 2, y: -2, label: 'TR2' },
    12: { x: -2, y: 0, label: 'ML2' },                                    13: { x: 2, y: 0, label: 'MR2' },
    14: { x: -2, y: 2, label: 'BL2' }, 15: { x: 0, y: 2, label: 'BM2' }, 16: { x: 2, y: 2, label: 'BR2' },

    // Inner Ring (-1 to 1)
    17: { x: -1, y: -1, label: 'TL3' }, 18: { x: 0, y: -1, label: 'TM3' }, 19: { x: 1, y: -1, label: 'TR3' },
    20: { x: -1, y: 0, label: 'ML3' },                                     21: { x: 1, y: 0, label: 'MR3' },
    22: { x: -1, y: 1, label: 'BL3' }, 23: { x: 0, y: 1, label: 'BM3' }, 24: { x: 1, y: 1, label: 'BR3' },
};

export const BASE_LINES = [
    // Horizontal Rows
    [1, 2, 3], 
    [4, 5, 6], 
    [7, 8, 9], 
    [10, 11, 12], 
    [13, 14, 15], 
    [16, 17, 18],
    
    // Vertical Spine (Straight)
    [2, 5, 8, 19, 11, 14, 17], 
    
    // Diagonal 1: Bottom-Left to Top-Right (Straight Geometric Line)
    // 16(-3,3) -> 13(-2,2) -> 10(-1,1) -> 19(0,0) -> 9(1,-1) -> 6(2,-2) -> 3(3,-3)
    [16, 13, 10, 19, 9, 6, 3],

    // Diagonal 2: Bottom-Right to Top-Left (Straight Geometric Line)
    // 18(3,3) -> 15(2,2) -> 12(1,1) -> 19(0,0) -> 7(-1,-1) -> 4(-2,-2) -> 1(-3,-3)
    [18, 15, 12, 19, 7, 4, 1]
];

export const EXTRA_LINES = [
    // Left Vertical: 1 -> 20 -> 16
    [1, 20, 16],
    // Right Vertical: 3 -> 21 -> 18
    [3, 21, 18],
    // Center Horizontal: 20 -> 19 -> 21
    [20, 19, 21]
];

export const SQUARE_LINES = [
    // --- Concentric Rings ---
    // Outer
    [1, 2, 3], [3, 5, 8], [8, 7, 6], [6, 4, 1],
    // Middle
    [9, 10, 11], [11, 13, 16], [16, 15, 14], [14, 12, 9],
    // Inner
    [17, 18, 19], [19, 21, 24], [24, 23, 22], [22, 20, 17],

    // --- Radials (connecting layers) ---
    // Diagonals
    [1, 9, 17], [3, 11, 19], [8, 16, 24], [6, 14, 22],
    // Cardinals (Cross)
    [2, 10, 18], [5, 13, 21], [7, 15, 23], [4, 12, 20]
];
