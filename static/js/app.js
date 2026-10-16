/**
 * Quantum Computing Simulator (QCS) - Master HUD Controller App
 */

document.addEventListener('DOMContentLoaded', () => {
    window.qcsApp = new QCSHudApp();
});

class QCSHudApp {
    constructor() {
        this.currentQubits = 2;
        this.currentCircuit = {
            num_qubits: 2,
            gates: []
        };
        this.activeGate = 'H';

        this.initTabs();
        this.initGatePalette();
        this.initQubitSlider();
        this.initAlgorithmButtons();
        this.initCircuitControls();
        this.initTabletPanel();
        this.initViewportControls();
        this.initWaveformCanvas();

        // Initial simulation run to populate UI
        setTimeout(() => {
            this.runCurrentSimulation();
        }, 500);
    }

    initTabs() {
        const navBtns = document.querySelectorAll('.nav-link-btn');
        const tabPanes = document.querySelectorAll('.tab-pane-view');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                navBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.add('d-none'));

                btn.classList.add('active');
                const activePane = document.getElementById(targetTab);
                if (activePane) {
                    activePane.classList.remove('d-none');
                }

                if (targetTab === 'codeView' && window.codeEditor && window.codeEditor.editor) {
                    setTimeout(() => window.codeEditor.editor.refresh(), 100);
                }
            });
        });
    }

    initGatePalette() {
        const categoryBtns = document.querySelectorAll('.gate-category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        const gateChips = document.querySelectorAll('.gate-chip');
        gateChips.forEach(chip => {
            chip.addEventListener('click', () => {
                gateChips.forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                this.activeGate = chip.getAttribute('data-gate');

                if (window.circuitBuilder) {
                    window.circuitBuilder.selectedGate = this.activeGate;
                }
            });
        });
    }

    initQubitSlider() {
        const slider = document.getElementById('qubitRangeInput');
        const label = document.getElementById('qubitCountLabel');
        const select = document.getElementById('qubitSelect');

        if (slider) {
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.currentQubits = val;
                if (label) label.textContent = `${val} Qubits`;
                if (select) select.value = val;

                this.currentCircuit.num_qubits = val;
                if (window.latticeViz) window.latticeViz.updateQubitCount(val);
                if (window.circuitBuilder) {
                    window.circuitBuilder.circuit.num_qubits = val;
                    window.circuitBuilder.updateCanvas();
                }
            });
        }

        if (select) {
            select.addEventListener('change', (e) => {
                const val = parseInt(e.target.value);
                this.currentQubits = val;
                if (slider) slider.value = val;
                if (label) label.textContent = `${val} Qubits`;

                this.currentCircuit.num_qubits = val;
                if (window.latticeViz) window.latticeViz.updateQubitCount(val);
                if (window.circuitBuilder) {
                    window.circuitBuilder.circuit.num_qubits = val;
                    window.circuitBuilder.updateCanvas();
                }
            });
        }
    }

    initAlgorithmButtons() {
        const algoBtns = document.querySelectorAll('.algo-btn');
        algoBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                algoBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const algoKey = btn.getAttribute('data-algo');
                await this.loadAlgorithmTemplate(algoKey);
            });
        });
    }

    async loadAlgorithmTemplate(algoKey) {
        try {
            const resp = await fetch('/api/algorithms');
            const data = await resp.json();

            if (data[algoKey]) {
                const algo = data[algoKey];
                this.currentCircuit = {
                    num_qubits: algo.gates.reduce((max, g) => {
                        if (g.type === 'CNOT') return Math.max(max, g.control + 1, g.target + 1);
                        return Math.max(max, (g.qubit || 0) + 1);
                    }, 2),
                    gates: algo.gates
                };

                this.currentQubits = this.currentCircuit.num_qubits;

                const slider = document.getElementById('qubitRangeInput');
                const label = document.getElementById('qubitCountLabel');
                const select = document.getElementById('qubitSelect');
                if (slider) slider.value = this.currentQubits;
                if (label) label.textContent = `${this.currentQubits} Qubits`;
                if (select) select.value = this.currentQubits;

                if (window.latticeViz) window.latticeViz.updateQubitCount(this.currentQubits);
                if (window.circuitBuilder) {
                    window.circuitBuilder.circuit = { ...this.currentCircuit };
                    window.circuitBuilder.updateCanvas();
                }

                if (window.codeEditor && window.codeEditor.generateCodeFromAlgorithm) {
                    const code = window.codeEditor.generateCodeFromAlgorithm(algo);
                    window.codeEditor.setCode(code);
                }

                await this.runCurrentSimulation();
            }
        } catch (err) {
            console.error("Error loading algorithm template:", err);
        }
    }

    initCircuitControls() {
        const runBtn = document.getElementById('runCircuitBtn');
        const clearBtn = document.getElementById('clearCircuitBtn');

        if (runBtn) {
            runBtn.addEventListener('click', () => {
                if (window.circuitBuilder) {
                    this.currentCircuit = window.circuitBuilder.circuit;
                }
                this.runCurrentSimulation();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.currentCircuit.gates = [];
                if (window.circuitBuilder) {
                    window.circuitBuilder.circuit.gates = [];
                    window.circuitBuilder.updateCanvas();
                }
                this.runCurrentSimulation();
            });
        }
    }

    async runCurrentSimulation() {
        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.currentCircuit)
            });

            const data = await response.json();
            if (data.success) {
                this.updateUIWithSimulationResult(data.result);
            }
        } catch (err) {
            console.error("Simulation request failed:", err);
        }
    }

    updateUIWithSimulationResult(result) {
        // Update 3D Bloch Lattice Visualizer
        if (window.latticeViz && result.bloch_coordinates) {
            window.latticeViz.updateBlochStates(result.bloch_coordinates);
            if (result.probabilities && result.probabilities.length >= 4) {
                // Animate entanglement lines if entangled state
                const isEntangled = result.entropy > 0.1 || (result.probabilities[0] > 0.4 && result.probabilities[3] > 0.4);
                window.latticeViz.updateEntanglementLines(isEntangled);
            }
        }

        // Update Probability Bars
        this.updateProbabilityBars(result.probabilities, result.basis_states);

        // Update Metrics & Tomography
        this.updateMetrics(result);

        // Update Waveform Oscilloscope Chart
        this.updateWaveformChart(result.amplitudes);

        // Update AI Copilot Panel
        this.updateAICopilot(result);
    }

    updateProbabilityBars(probabilities, basisStates) {
        const container = document.getElementById('probBarsContainer');
        const tabletContainer = document.getElementById('tabletProbBars');
        if (!probabilities || !basisStates) return;

        let html = '';
        let tabletHtml = '';

        basisStates.forEach((state, i) => {
            const prob = probabilities[i] || 0;
            const pct = (prob * 100).toFixed(1);

            html += `
                <div class="prob-row">
                    <span class="prob-state">|${state}⟩</span>
                    <div class="prob-track">
                        <div class="prob-fill" style="width: ${pct}%"></div>
                    </div>
                    <span class="prob-val">${pct}%</span>
                </div>
            `;

            if (i < 4) {
                tabletHtml += `
                    <div class="t-prob-item">
                        <span class="t-lbl">|${state}⟩</span>
                        <div class="t-bar"><div class="t-fill" style="width: ${pct}%"></div></div>
                        <span class="t-val">${pct}%</span>
                    </div>
                `;
            }
        });

        if (container) container.innerHTML = html;
        if (tabletContainer) tabletContainer.innerHTML = tabletHtml;
    }

    updateMetrics(result) {
        const fidelityVal = document.getElementById('fidelityValue');
        const fidelityFill = document.getElementById('fidelityProgressFill');
        const entropyVal = document.getElementById('entropyValue');
        const errorVal = document.getElementById('errorRateValue');

        if (fidelityVal && result.fidelity !== undefined) {
            const fidPct = (result.fidelity * 100).toFixed(1);
            fidelityVal.textContent = `${fidPct}%`;
            if (fidelityFill) fidelityFill.style.width = `${fidPct}%`;
        }

        if (entropyVal && result.entropy !== undefined) {
            entropyVal.textContent = result.entropy.toFixed(3);
        }

        if (errorVal && result.error_rate !== undefined) {
            errorVal.textContent = `${(result.error_rate * 100).toFixed(2)}%`;
        }

        // Update State Vector Tomography Table
        const tbody = document.getElementById('stateVectorTableBody');
        if (tbody && result.amplitudes) {
            let tableHtml = '';
            result.amplitudes.forEach((amp, i) => {
                const stateStr = result.basis_states[i] || `|${i}⟩`;
                const sign = amp.imag >= 0 ? '+' : '-';
                const complexStr = `${amp.real.toFixed(2)} ${sign} ${Math.abs(amp.imag).toFixed(2)}i`;
                const magStr = (amp.magnitude * 100).toFixed(1) + '%';
                const phaseDeg = (amp.phase * 180 / Math.PI).toFixed(1) + '°';

                tableHtml += `
                    <tr>
                        <td class="text-cyan font-mono">|${stateStr}⟩</td>
                        <td class="font-mono">${complexStr}</td>
                        <td class="font-mono text-end">${magStr}</td>
                        <td class="font-mono text-end text-pink">${phaseDeg}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = tableHtml;
        }
    }

    initWaveformCanvas() {
        this.waveformCanvas = document.getElementById('waveformCanvas');
        if (this.waveformCanvas) {
            this.waveformCtx = this.waveformCanvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    }

    resizeCanvas() {
        if (this.waveformCanvas && this.waveformCanvas.parentElement) {
            this.waveformCanvas.width = this.waveformCanvas.parentElement.clientWidth;
            this.waveformCanvas.height = this.waveformCanvas.parentElement.clientHeight || 110;
        }
    }

    updateWaveformChart(amplitudes) {
        if (!this.waveformCanvas || !this.waveformCtx) return;
        const ctx = this.waveformCtx;
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += 30) {
            ctx.moveTo(x, 0); ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 20) {
            ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Draw zero baseline
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Draw Sine Waveform corresponding to quantum amplitudes
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const numPoints = 120;
        const amp0 = amplitudes && amplitudes[0] ? amplitudes[0].magnitude : 0.707;
        const amp1 = amplitudes && amplitudes[1] ? amplitudes[1].magnitude : 0.707;
        const phase0 = amplitudes && amplitudes[0] ? amplitudes[0].phase : 0;

        for (let i = 0; i <= numPoints; i++) {
            const x = (i / numPoints) * width;
            const t = (i / numPoints) * Math.PI * 4;
            const y = height / 2 - (Math.sin(t + phase0) * amp0 * 35 + Math.cos(t * 2) * amp1 * 15);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw second harmonic wave (Phase)
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
            const x = (i / numPoints) * width;
            const t = (i / numPoints) * Math.PI * 4;
            const y = height / 2 - (Math.cos(t * 1.5 - phase0) * amp1 * 25);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    updateAICopilot(result) {
        const list = document.getElementById('aiSuggestionsList');
        if (!list) return;

        let suggestions = [];
        if (result.entropy > 0.8) {
            suggestions.push({
                text: "Maximal entanglement detected. State is suitable for Quantum Teleportation.",
                confidence: "98%"
            });
        }
        if (result.fidelity < 0.95) {
            suggestions.push({
                text: "Noise ratio increased. Recommend error mitigation pulse sequences.",
                confidence: "88%"
            });
        }
        suggestions.push({
            text: "Optimal gate depth reached. Consider parallelizing CNOT operations.",
            confidence: "92%"
        });

        let html = '';
        suggestions.forEach(s => {
            html += `
                <div class="hud-card p-2 mb-1" style="border-left: 3px solid var(--cyan); background: rgba(0,242,254,0.05)">
                    <div class="d-flex justify-content-between align-items-center">
                        <span style="font-size: 11px; color: var(--text-main);">${s.text}</span>
                        <span class="badge-tech">${s.confidence}</span>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    }

    initTabletPanel() {
        const panel = document.getElementById('qubitProfileTablet');
        const toggleBtn = document.getElementById('toggleTabletBtn');
        const closeBtn = document.getElementById('closeTabletBtn');

        if (toggleBtn && panel) {
            toggleBtn.addEventListener('click', () => {
                panel.classList.toggle('collapsed');
            });
        }

        if (closeBtn && panel) {
            closeBtn.addEventListener('click', () => {
                panel.classList.add('collapsed');
            });
        }
    }

    initViewportControls() {
        const autoRotateBtn = document.getElementById('autoRotateBtn');
        const resetViewBtn = document.getElementById('resetViewBtn');

        if (autoRotateBtn) {
            autoRotateBtn.addEventListener('click', () => {
                if (window.latticeViz) {
                    const isRotating = window.latticeViz.toggleAutoRotate();
                    autoRotateBtn.classList.toggle('active', isRotating);
                }
            });
        }

        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                if (window.latticeViz) {
                    window.latticeViz.resetCamera();
                }
            });
        }
    }
}
