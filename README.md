# QCS - Quantum Computing Simulator

An advanced, computerized, high-tech quantum computing simulator featuring a real-time 3D multi-qubit Bloch sphere lattice visualizer, interactive circuit builder, Python/Qiskit code editor, state tomography diagnostics, and AI-assisted copilot.

![QCS HUD Interface](attached_assets/quantum-computing.jpg)

---

## 🚀 Key Features

* **3D Multi-Qubit World Lattice (`Three.js`)**:
  * Real-time 3D Bloch sphere representation for multi-qubit systems.
  * Inner glowing nuclei, animated coordinate axes ($x, y, z$), state vector arrows, and dynamic entanglement lines connecting correlated qubits.
  * Particle swarm and noise field visual representations.

* **Interactive HUD Layout**:
  * Sci-fi dark cybernetic HUD design with glassmorphism panels, Orbitron & JetBrains Mono typography, glowing neon accents, and responsive layout.
  * Real-time measurement probability bar charts, coherence sliders, error rate meters, and entanglement fidelity indicators.
  * Canvas-based real-time measurement oscilloscope for tracking state amplitude waveforms and phase trends.

* **Quantum Circuit Builder**:
  * Drag-and-drop / click-to-place quantum gate interface supporting single-qubit gates ($H$, $X$, $Y$, $Z$, $S$, $T$) and multi-qubit gates ($\text{CNOT}$, $\text{SWAP}$, $CZ$).
  * Dynamic SVG circuit wire rendering using `D3.js`.

* **Quantum Code Editor**:
  * Integrated CodeMirror Python/Qiskit code editor with syntax highlighting and auto-completion.
  * Execute quantum circuit scripts directly from the browser.

* **State Tomography Diagnostics**:
  * Complex amplitude outputs, phase angles, density matrix $\rho$ calculations, and reduced density matrix Bloch sphere coordinates.

* **AI Quantum Copilot**:
  * Context-aware recommendations for circuit optimizations, gate placement suggestions, and noise mitigation tips.

---

## 🛠️ Architecture & Tech Stack

* **Backend**: Python 3.12, Flask, NumPy (Quantum State Vector & Density Matrix calculations)
* **Frontend**: JavaScript (ES6+), Three.js (3D Graphics), D3.js (Circuit SVG), CodeMirror (Editor), Bootstrap 5, FontAwesome
* **Environment & Package Manager**: `uv`

---

## 📦 Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd quantum-computing-simulator
   ```

2. **Run Application using `uv`**:
   ```bash
   uv run python app.py
   ```

3. **Open in Browser**:
   Navigate to `http://127.0.0.1:5000/` in your web browser.

---

## 🧪 Quantum Algorithm Templates Included

* **Bell State ($Q01-Q02$)**: Creates maximally entangled Bell pairs $(|00\rangle + |11\rangle)/\sqrt{2}$.
* **Grover's Search**: Amplification search algorithm for unstructured databases.
* **GHZ Entanglement**: 3-qubit Greenberger–Horne–Zeilinger state $(|000\rangle + |111\rangle)/\sqrt{2}$.
* **Quantum Teleportation**: Transfers unknown quantum state across entangled pairs.

---

## 📄 License

MIT License. See `LICENSE` for details.
