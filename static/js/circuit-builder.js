// Quantum Circuit Builder JavaScript

class QuantumCircuitBuilder {
    constructor() {
        this.circuit = {
            num_qubits: 2,
            gates: [],
            measurements: []
        };
        this.selectedGate = null;
        this.canvas = null;
        this.svg = null;
        this.initializeCanvas();
        this.bindEvents();
        this.updateCanvas();
    }

    initializeCanvas() {
        const canvas = document.getElementById('circuitCanvas');
        this.canvas = canvas;
        
        // Create SVG element
        this.svg = d3.select(canvas)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('min-height', '300px');
        
        // Add grid background
        this.addGrid();
    }

    addGrid() {
        const defs = this.svg.append('defs');
        const pattern = defs.append('pattern')
            .attr('id', 'grid')
            .attr('width', 50)
            .attr('height', 50)
            .attr('patternUnits', 'userSpaceOnUse');
        
        pattern.append('path')
            .attr('d', 'M 50 0 L 0 0 0 50')
            .attr('fill', 'none')
            .attr('stroke', '#e9ecef')
            .attr('stroke-width', 1);
        
        this.svg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'url(#grid)');
    }

    bindEvents() {
        // Gate button selection
        document.querySelectorAll('.gate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove previous selection
                document.querySelectorAll('.gate-btn').forEach(b => b.classList.remove('selected'));
                
                // Select current gate
                e.target.classList.add('selected');
                this.selectedGate = e.target.dataset.gate;
            });
        });

        // Qubit count change
        document.getElementById('qubitCount').addEventListener('change', (e) => {
            this.circuit.num_qubits = parseInt(e.target.value);
            this.updateCanvas();
        });

        // Clear circuit
        document.getElementById('clearCircuit').addEventListener('click', () => {
            this.circuit.gates = [];
            this.circuit.measurements = [];
            this.updateCanvas();
            this.updateAISuggestions();
        });

        // Run simulation
        document.getElementById('runSimulation').addEventListener('click', () => {
            this.runSimulation();
        });

        // Canvas click for gate placement
        this.svg.on('click', (event) => {
            if (this.selectedGate) {
                this.handleCanvasClick(event);
            }
        });
    }

    handleCanvasClick(event) {
        const [x, y] = d3.pointer(event);
        const qubit = this.getQubitFromY(y);
        
        if (qubit >= 0 && qubit < this.circuit.num_qubits) {
            if (this.selectedGate === 'CNOT') {
                // Handle CNOT gate placement (requires two qubits)
                this.handleCNOTPlacement(qubit, x);
            } else {
                // Single qubit gate
                this.addGate(this.selectedGate, qubit, x);
            }
        }
    }

    getQubitFromY(y) {
        const qubitSpacing = 60;
        const startY = 50;
        return Math.floor((y - startY + qubitSpacing/2) / qubitSpacing);
    }

    handleCNOTPlacement(qubit, x) {
        // For simplicity, if we have 2+ qubits, place CNOT between qubit 0 and 1
        if (this.circuit.num_qubits >= 2) {
            this.addCNOTGate(0, 1, x);
        }
    }

    addGate(gateType, qubit, x) {
        const position = Math.floor(x / 80); // Grid-based positioning
        
        this.circuit.gates.push({
            type: gateType,
            qubit: qubit,
            position: position
        });
        
        this.updateCanvas();
        this.updateAISuggestions();
    }

    addCNOTGate(control, target, x) {
        const position = Math.floor(x / 80);
        
        this.circuit.gates.push({
            type: 'CNOT',
            control: control,
            target: target,
            position: position
        });
        
        this.updateCanvas();
        this.updateAISuggestions();
    }

    updateCanvas() {
        // Clear existing circuit elements
        this.svg.selectAll('.circuit-element').remove();
        
        // Draw qubit wires
        this.drawQubitWires();
        
        // Draw gates
        this.drawGates();
    }

    drawQubitWires() {
        const qubitSpacing = 60;
        const startY = 50;
        const wireLength = 600;
        
        for (let i = 0; i < this.circuit.num_qubits; i++) {
            const y = startY + i * qubitSpacing;
            
            // Draw wire line
            this.svg.append('line')
                .attr('class', 'circuit-element qubit-wire')
                .attr('x1', 40)
                .attr('y1', y)
                .attr('x2', 40 + wireLength)
                .attr('y2', y);
            
            // Draw qubit label
            this.svg.append('text')
                .attr('class', 'circuit-element qubit-label')
                .attr('x', 20)
                .attr('y', y + 5)
                .text(`|q${i}⟩`);
        }
    }

    drawGates() {
        const qubitSpacing = 60;
        const startY = 50;
        const gateWidth = 40;
        const gateHeight = 30;
        
        this.circuit.gates.forEach((gate, index) => {
            if (gate.type === 'CNOT') {
                this.drawCNOTGate(gate, startY, qubitSpacing);
            } else {
                this.drawSingleGate(gate, startY, qubitSpacing, gateWidth, gateHeight);
            }
        });
    }

    drawSingleGate(gate, startY, qubitSpacing, gateWidth, gateHeight) {
        const x = 60 + (gate.position || 0) * 80;
        const y = startY + gate.qubit * qubitSpacing - gateHeight/2;
        
        const gateGroup = this.svg.append('g')
            .attr('class', 'circuit-element gate')
            .attr('transform', `translate(${x}, ${y})`);
        
        // Gate rectangle
        gateGroup.append('rect')
            .attr('width', gateWidth)
            .attr('height', gateHeight)
            .attr('rx', 4);
        
        // Gate label
        gateGroup.append('text')
            .attr('x', gateWidth/2)
            .attr('y', gateHeight/2)
            .text(gate.type);
    }

    drawCNOTGate(gate, startY, qubitSpacing) {
        const x = 60 + (gate.position || 0) * 80;
        const controlY = startY + gate.control * qubitSpacing;
        const targetY = startY + gate.target * qubitSpacing;
        
        const gateGroup = this.svg.append('g')
            .attr('class', 'circuit-element cnot-gate');
        
        // Connection line
        gateGroup.append('line')
            .attr('class', 'connection')
            .attr('x1', x + 20)
            .attr('y1', controlY)
            .attr('x2', x + 20)
            .attr('y2', targetY);
        
        // Control dot
        gateGroup.append('circle')
            .attr('class', 'control')
            .attr('cx', x + 20)
            .attr('cy', controlY)
            .attr('r', 4);
        
        // Target circle
        gateGroup.append('circle')
            .attr('class', 'target')
            .attr('cx', x + 20)
            .attr('cy', targetY)
            .attr('r', 15);
        
        // Target cross
        gateGroup.append('line')
            .attr('class', 'target')
            .attr('x1', x + 5)
            .attr('y1', targetY)
            .attr('x2', x + 35)
            .attr('y2', targetY);
        
        gateGroup.append('line')
            .attr('class', 'target')
            .attr('x1', x + 20)
            .attr('y1', targetY - 15)
            .attr('x2', x + 20)
            .attr('y2', targetY + 15);
    }

    async runSimulation() {
        try {
            document.getElementById('runSimulation').classList.add('loading');
            
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.circuit)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayResults(data.result);
            } else {
                this.displayError(data.error);
            }
        } catch (error) {
            this.displayError(error.message);
        } finally {
            document.getElementById('runSimulation').classList.remove('loading');
        }
    }

    displayResults(result) {
        const resultsDiv = document.getElementById('simulationResults');
        const vizDiv = document.getElementById('stateVisualization');
        
        // Display probability results
        resultsDiv.innerHTML = `
            <h6>Quantum State Probabilities</h6>
            <div class="results-data">
                ${result.basis_states.map((state, i) => 
                    `<div class="basis-state">
                        |${state}⟩: ${(result.probabilities[i] * 100).toFixed(2)}%
                    </div>`
                ).join('')}
            </div>
        `;
        
        // Visualize state probabilities
        this.visualizeState(result, vizDiv);
        
        resultsDiv.classList.add('success');
        setTimeout(() => resultsDiv.classList.remove('success'), 2000);
    }

    visualizeState(result, container) {
        container.innerHTML = '<h6>State Visualization</h6>';
        
        const maxProb = Math.max(...result.probabilities);
        
        result.basis_states.forEach((state, i) => {
            const prob = result.probabilities[i];
            const width = maxProb > 0 ? (prob / maxProb) * 100 : 0;
            
            const barContainer = document.createElement('div');
            barContainer.style.marginBottom = '5px';
            
            const bar = document.createElement('div');
            bar.className = 'probability-bar';
            bar.style.width = `${width}%`;
            
            const label = document.createElement('div');
            label.className = 'probability-label';
            label.textContent = `|${state}⟩ ${(prob * 100).toFixed(1)}%`;
            
            bar.appendChild(label);
            barContainer.appendChild(bar);
            container.appendChild(barContainer);
        });
    }

    displayError(error) {
        const resultsDiv = document.getElementById('simulationResults');
        resultsDiv.innerHTML = `
            <div class="error">
                <h6>Simulation Error</h6>
                <p>${error}</p>
            </div>
        `;
        
        resultsDiv.classList.add('error');
        setTimeout(() => resultsDiv.classList.remove('error'), 3000);
    }

    async updateAISuggestions() {
        try {
            const context = {
                circuit_gates: this.circuit.gates,
                num_qubits: this.circuit.num_qubits,
                measurements: this.circuit.measurements
            };
            
            const response = await fetch('/api/ai-suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(context)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displaySuggestions(data.suggestions);
            }
        } catch (error) {
            console.error('Failed to get AI suggestions:', error);
        }
    }

    displaySuggestions(suggestions) {
        const suggestionsDiv = document.getElementById('aiSuggestions');
        
        if (suggestions.length === 0) {
            suggestionsDiv.innerHTML = '<p class="text-muted">No suggestions available.</p>';
            return;
        }
        
        suggestionsDiv.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" onclick="circuitBuilder.applySuggestion(${JSON.stringify(suggestion).replace(/"/g, '&quot;')})">
                <div class="suggestion-text">${suggestion.suggestion}</div>
                <div class="suggestion-confidence">Confidence: ${(suggestion.confidence * 100).toFixed(0)}%</div>
            </div>
        `).join('');
    }

    applySuggestion(suggestion) {
        if (suggestion.type === 'gate') {
            if (suggestion.gate === 'CNOT') {
                this.addCNOTGate(suggestion.control, suggestion.target, 200);
            } else {
                this.addGate(suggestion.gate, suggestion.qubit, 200);
            }
        }
    }
}

// Initialize circuit builder when page loads
let circuitBuilder;
document.addEventListener('DOMContentLoaded', () => {
    circuitBuilder = new QuantumCircuitBuilder();
});