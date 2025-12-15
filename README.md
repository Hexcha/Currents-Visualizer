# BİL301S Assignment 1: Generative Visualization
## Tame Impala - Currents Audio-Reactive Simulation

This project is a generative art assignment developed for the **Introduction to Computer Graphics (BİL301S)** course. It is a dynamic, code-based recreation and reinterpretation of the iconic album cover **Tame Impala - *Currents***.

### Inspiration & Concept
The core concept involves transforming the static illusion of the original album art—a metal sphere disrupting a fluid medium—into a living, breathing, audio-reactive experience. The project uses physics-based particle systems and cubic Bézier curves to simulate fluid dynamics and speed.

### Technical Implementation

The project is built using **p5.js** and implements several key graphics algorithms:

#### 1. Cubic Bézier Flow Field
* The background consists of **350+ individual Bézier curves**.
* Control points ($P_1, P_2$) are dynamically modulated using **Perlin Noise** to create organic turbulence.
* The curves react to audio frequencies, expanding and vibrating with the music.

#### 2. Continuous Contour Flow (Motion Illusion)
To create the illusion that the stationary sphere is moving at high velocity:
* A custom `ShockwaveParticle` system was designed.
* Particles spawn continuously from the sphere's front contour.
* **Vector Math:** The velocity vectors are calculated to be tangent to the sphere's surface, flowing backwards into the exact trajectory of the Bézier curves. This creates a seamless "aerodynamic drag" effect.

#### 3. Audio Reactivity (FFT Analysis)
* Utilizes `p5.FFT` to analyze the audio spectrum.
* Specific focus on **Bass** and **LowMid** frequencies to trigger visual events.
* **Reaction:** On strong beats, the color palette shifts from deep indigo/purple to bright magenta/white, and the flow speed accelerates (Turbo Mode).

### Simulation States
The visualization follows a cinematic sequence:
1.  **Approach:** A red laser approaches the center from a random angle.
2.  **Impact:** The laser strikes, the sphere materializes.
3.  **Flow:** The full energy wake and particle systems are engaged.

### How to Run
1.  Clone this repository.
2.  Open `index.html` in your browser (or use a local server like Live Server).
3.  Click the file input button to upload an `.mp3` or `.wav` file.
4.  Enjoy the visualization.

---
*Developed by Taner Ayranci*