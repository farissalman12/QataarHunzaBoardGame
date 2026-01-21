# Qataar: Traditional Hunza Board Game ⏳

![Qataar Game Banner](https://img.shields.io/badge/Status-Live-success?style=for-the-badge) 
[![Play Now](https://img.shields.io/badge/Play-Qataar-black?style=for-the-badge&logo=vercel)](https://farissalman12.github.io/QataarHunzaBoardGame/)

**Qataar** (also known as Hourglass Checkers) is a traditional strategy board game from the Hunza Valley. This modern web adaptation brings the classic experience to your browser with smooth animations, mobile responsiveness, and a challenging AI opponent.

👉 **[Play the Live Demo](https://farissalman12.github.io/QataarHunzaBoardGame/)**

---

## 🎮 Game Features

-   **🤖 Smart AI Opponent**: Challenge the computer in "1 Player" mode. Powered by a **Web Worker** for zero-lag calculations even on high difficulty.
-   **📱 Installable PWA**: Works **100% Offline**. Add to your home screen for a native app experience.
-   **📳 Haptic Feedback**: Feel the game with vibration cues for moves, captures, and victory.
-   **♿ Accessible**: Full keyboard navigation and screen-reader support.
-   **⚔️ Multiplayer Support**: Toggle between "1 Player" (PvC) and "2 Players" (PvP).
-   **🎨 Dynamic Themes**: Switch between Light and Dark modes.
-   **🔄 Chain Jumps**: Authentic implementation of forced double/triple jumps.
-   **👑 King Promotion**: Reach the opposite end to promote your piece.

---

## 📜 How to Play

### The Board
-   The board consists of two triangles connected at a center point (Hourglass shape).
-   **Player 1 (Black)** starts at the **Bottom**.
-   **Player 2 / CPU (White)** starts at the **Top**.

### Movement
-   **Basic Move**: You can move one step to any connected empty spot.
-   **Direction**:
    -   Regular pieces can only move **Forward** (P1 moves UP, P2 moves DOWN).
    -   Lateral (side-to-side) moves are allowed if connected.
-   **Capturing**: Jump over an opponent's piece into an empty spot behind it to capture it.
    -   Captures can be in **any direction** (Forward or Backward) given a valid straight line.
    -   **Chain Jumps**: If you capture a piece and land in a spot where another capture is possible, you **must** continue jumping.

### Winning
-   Eliminate all opponent pieces or block them so they have no valid moves.

---

## 🛠️ Technologies Used

-   **React 19**: Core UI framework.
-   **Vite**: Fast build tool and dev server.
-   **Tailwind CSS v4**: Utility-first styling.
-   **Framer Motion**: Smooth animations.
-   **Web Workers**: Background thread for AI computation.
-   **PWA**: Service Workers for offline capabilities.
-   **Vitest**: Automated testing suite.
-   **Lucide React**: Beautiful icons.

---

## 🚀 Running Locally

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/farissalman12/QataarHunzaBoardGame.git
    cd QataarHunzaBoardGame
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```

4.  **Open your browser** at `http://localhost:5173/QataarHunzaBoardGame/`.

---

## 👨‍💻 Credits

Developed by **Faris Salman**.
