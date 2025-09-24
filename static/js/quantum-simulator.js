// Quantum Simulator Integration JavaScript

class QuantumSimulatorInterface {
    constructor() {
        this.currentSimulation = null;
        this.simulationHistory = [];
    }

    async validateCircuit(circuit) {
        try {
            const response = await fetch('/api/validate-circuit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(circuit)
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Circuit validation error:', error);
            return { success: false, error: error.message };
        }
    }

    async runSimulation(circuit, options = {}) {
        try {
            // Validate circuit first
            const validation = await this.validateCircuit(circuit);
            if (!validation.success) {
                throw new Error(`Circuit validation failed: ${validation.error}`);
            }

            if (validation.errors && validation.errors.length > 0) {
                throw new Error(`Circuit has errors: ${validation.errors.join(', ')}`);
            }

            // Run simulation
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(circuit)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentSimulation = {
                    circuit: circuit,
                    result: data.result,
                    timestamp: new Date().toISOString(),
                    options: options
                };
                
                this.simulationHistory.push(this.currentSimulation);
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Simulation error:', error);
            throw error;
        }
    }

    getSimulationHistory() {
        return this.simulationHistory;
    }

    clearHistory() {
        this.simulationHistory = [];
        this.currentSimulation = null;
    }

    exportResults(format = 'json') {
        if (!this.currentSimulation) {
            throw new Error('No simulation results to export');
        }

        switch (format) {
            case 'json':
                return JSON.stringify(this.currentSimulation, null, 2);
            case 'csv':
                return this.exportToCSV();
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    exportToCSV() {
        const result = this.currentSimulation.result;
        let csv = 'Basis State,Probability\n';
        
        result.basis_states.forEach((state, i) => {
            csv += `"${state}",${result.probabilities[i]}\n`;
        });
        
        return csv;
    }

    calculateEntanglement(result) {
        // Simple entanglement measure for 2-qubit systems
        if (result.num_qubits !== 2) {
            return null;
        }

        const probs = result.probabilities;
        
        // For a 2-qubit system, check if state is separable
        // A state is entangled if it cannot be written as |ψ⟩ = |a⟩ ⊗ |b⟩
        
        // Calculate von Neumann entropy (simplified)
        let entropy = 0;
        probs.forEach(p => {
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        });
        
        return {
            entropy: entropy,
            isEntangled: entropy > 0.1, // Simple threshold
            entanglementMeasure: entropy / Math.log2(4) // Normalized
        };
    }

    analyzeCircuitComplexity(circuit) {
        const gateCount = circuit.gates.length;
        const qubitCount = circuit.num_qubits;
        const uniqueGates = new Set(circuit.gates.map(g => g.type));
        const twoQubitGates = circuit.gates.filter(g => g.type === 'CNOT').length;
        
        return {
            gateCount,
            qubitCount,
            uniqueGates: Array.from(uniqueGates),
            twoQubitGates,
            depth: this.calculateCircuitDepth(circuit),
            complexity: gateCount * Math.log2(qubitCount || 1)
        };
    }

    calculateCircuitDepth(circuit) {
        // Calculate the depth of the circuit (number of time steps)
        const qubitLastUsed = new Array(circuit.num_qubits).fill(0);
        let maxDepth = 0;
        
        circuit.gates.forEach((gate, index) => {
            let currentDepth = 0;
            
            if (gate.type === 'CNOT') {
                currentDepth = Math.max(
                    qubitLastUsed[gate.control],
                    qubitLastUsed[gate.target]
                ) + 1;
                qubitLastUsed[gate.control] = currentDepth;
                qubitLastUsed[gate.target] = currentDepth;
            } else {
                currentDepth = qubitLastUsed[gate.qubit] + 1;
                qubitLastUsed[gate.qubit] = currentDepth;
            }
            
            maxDepth = Math.max(maxDepth, currentDepth);
        });
        
        return maxDepth;
    }

    generateQuantumReport(circuit, result) {
        const complexity = this.analyzeCircuitComplexity(circuit);
        const entanglement = this.calculateEntanglement(result);
        
        return {
            timestamp: new Date().toISOString(),
            circuit: {
                qubits: circuit.num_qubits,
                gates: circuit.gates.length,
                depth: complexity.depth,
                complexity: complexity.complexity
            },
            results: {
                probabilities: result.probabilities,
                basisStates: result.basis_states,
                entropy: entanglement ? entanglement.entropy : null,
                isEntangled: entanglement ? entanglement.isEntangled : null
            },
            analysis: {
                dominantState: this.findDominantState(result),
                uniformity: this.calculateUniformity(result.probabilities),
                recommendations: this.generateRecommendations(circuit, result)
            }
        };
    }

    findDominantState(result) {
        const maxProb = Math.max(...result.probabilities);
        const maxIndex = result.probabilities.indexOf(maxProb);
        
        return {
            state: result.basis_states[maxIndex],
            probability: maxProb
        };
    }

    calculateUniformity(probabilities) {
        const n = probabilities.length;
        const uniform = 1 / n;
        
        // Calculate how close the distribution is to uniform
        const deviation = probabilities.reduce((sum, p) => {
            return sum + Math.abs(p - uniform);
        }, 0);
        
        return 1 - (deviation / 2); // Normalized uniformity measure
    }

    generateRecommendations(circuit, result) {
        const recommendations = [];
        const complexity = this.analyzeCircuitComplexity(circuit);
        
        // Check for circuit optimization opportunities
        if (complexity.gateCount > 10) {
            recommendations.push("Consider circuit optimization - high gate count detected");
        }
        
        if (complexity.depth > 5) {
            recommendations.push("Circuit depth is high - consider parallelizing gates");
        }
        
        // Check for quantum properties
        const uniformity = this.calculateUniformity(result.probabilities);
        if (uniformity < 0.3) {
            recommendations.push("State distribution is highly non-uniform - check if this is intended");
        }
        
        // Check for potential errors
        const totalProb = result.probabilities.reduce((sum, p) => sum + p, 0);
        if (Math.abs(totalProb - 1.0) > 0.01) {
            recommendations.push("Probability normalization issue detected");
        }
        
        return recommendations;
    }
}

// Global simulator interface instance
let quantumSimulator;

document.addEventListener('DOMContentLoaded', () => {
    quantumSimulator = new QuantumSimulatorInterface();
    
    // Add export functionality
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-sm btn-outline-info';
    exportBtn.textContent = 'Export Results';
    exportBtn.onclick = () => exportSimulationResults();
    
    // Add to toolbar if it exists
    const toolbar = document.querySelector('.panel-header .toolbar');
    if (toolbar) {
        toolbar.appendChild(exportBtn);
    }
});

function exportSimulationResults() {
    try {
        if (!quantumSimulator.currentSimulation) {
            alert('No simulation results to export');
            return;
        }
        
        const data = quantumSimulator.exportResults('json');
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `quantum_simulation_${new Date().toISOString().slice(0, 19)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert(`Export failed: ${error.message}`);
    }
}