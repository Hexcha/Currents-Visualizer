# BİL301S Assignment 1: Generative Visualization
## Tame Impala - Currents: Deep Purple & Bass Flash Edition

This project is an audio-reactive generative art application developed for the **Introduction to Computer Graphics (BİL301S)** course. It simulates the iconic aesthetic of Tame Impala's *Currents* album cover using **pure mathematical curves** and **audio frequency analysis**.

### Overview & Features
Instead of using static images or pre-made assets, this project renders a dynamic scene in real-time:
* **Physics-Based Intro:** A red laser approaches a metallic sphere based on vector physics.
* **Audio-Reactive Wakes:** Upon impact, the scene explodes into hundreds of flowing lines that react to the music's bass frequencies.
* **Custom UI:** Includes a custom-styled Play/Pause button, a seek slider, and a time display.

### Technical Implementation

The project is built with **p5.js** but implements core graphics algorithms manually:

#### 1. Manual Cubic Bézier Implementation
Unlike standard drawing functions, this project calculates Bézier curves mathematically to demonstrate the underlying graphics logic.


* **The Formula:** The code implements the explicit cubic formula:
    $$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$$
* **Implementation:** The `cubicBezierPoint()` and `drawCubicBezier()` functions manually sample points along the curve ($t: 0 \to 1$) to render the "Wake" strands.
* **Dynamic Control Points:** $P_1$ and $P_2$ are modulated by **Perlin Noise** and Audio Amplitude to create organic turbulence.

#### 2. Audio Analysis (FFT) & Reactivity
* **FFT Analysis:** Uses `p5.FFT` to isolate **Bass** and **LowMid** frequencies.
* **Bass Flash:** When a strong beat is detected, the color palette shifts from Deep Indigo to Neon Magenta, and the wireframe thickness increases.
* **Turbo Mode:** The `wakeTimer` accelerates based on energy levels, making the animation speed sync with the rhythm.

#### 3. State Machine & Camera
The visualization follows a directed graph:
* **State 0 (Approach):** Vector subtraction calculates the laser's path to the center (0,0). The camera creates a "Dolly Zoom" effect towards the impact point.
* **State 1 (Flow):** Triggered by collision detection (`redHead.mag() < sphereR`). The camera pulls back to reveal the full Bézier flow field.

### 🎮 Controls
* **Load Music:** Use the file input to upload any `.mp3` or `.wav`.
* **Play/Pause:** Toggle playback with the styled neon button.
* **Seek:** Use the slider to jump to any part of the song.

---
*Developed for BİL301S - Introduction to Computer Graphics*