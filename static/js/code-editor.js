// Quantum Code Editor JavaScript

class QuantumCodeEditor {
    constructor() {
        this.editor = null;
        this.initializeEditor();
        this.bindEvents();
    }

    initializeEditor() {
        const textarea = document.getElementById('codeEditor');
        
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'python',
            theme: 'material',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            lineWrapping: true,
            extraKeys: {
                "Ctrl-Space": "autocomplete",
                "Tab": (cm) => cm.replaceSelection("    "),
                "Ctrl-Enter": () => this.runCode()
            }
        });

        // Enable autocomplete
        this.editor.on('keyup', (cm, event) => {
            if (!cm.state.completionActive && 
                event.keyCode !== 13 && 
                event.keyCode !== 27 && 
                /[a-zA-Z]/.test(event.key)) {
                CodeMirror.commands.autocomplete(cm, null, {completeSingle: false});
            }
        });
    }

    bindEvents() {
        // Run code button
        document.getElementById('runCode').addEventListener('click', () => {
            this.runCode();
        });

        // Algorithm template selection
        document.getElementById('algorithmTemplate').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadTemplate(e.target.value);
            }
        });
    }

    async loadTemplate(templateName) {
        try {
            const response = await fetch('/api/algorithms');
            const algorithms = await response.json();
            
            if (algorithms[templateName]) {
                const algorithm = algorithms[templateName];
                const code = this.generateCodeFromAlgorithm(algorithm);
                this.editor.setValue(code);
            }
        } catch (error) {
            console.error('Failed to load template:', error);
        }
    }

    generateCodeFromAlgorithm(algorithm) {
        let code = `# ${algorithm.name}\n# ${algorithm.description}\n\n`;
        code += `circuit = QuantumCircuit(${this.getRequiredQubits(algorithm.gates)})\n\n`;
        
        algorithm.gates.forEach(gate => {
            if (gate.type === 'CNOT') {
                code += `circuit.cnot(${gate.control}, ${gate.target})  # CNOT gate\n`;
            } else {
                code += `circuit.${gate.type.toLowerCase()}(${gate.qubit})  # ${gate.type} gate\n`;
            }
        });
        
        code += `\ncircuit.measure_all()  # Measure all qubits\n`;
        code += `\n# Run simulation\nresult = circuit.run()\nprint(result)`;
        
        return code;
    }

    getRequiredQubits(gates) {
        let maxQubit = 0;
        gates.forEach(gate => {
            if (gate.type === 'CNOT') {
                maxQubit = Math.max(maxQubit, gate.control, gate.target);
            } else {
                maxQubit = Math.max(maxQubit, gate.qubit);
            }
        });
        return maxQubit + 1;
    }

    async runCode() {
        try {
            const code = this.editor.getValue();
            document.getElementById('runCode').classList.add('loading');
            
            // Parse the code and extract circuit information
            const circuit = this.parseQuantumCode(code);
            
            if (circuit) {
                // Run simulation using the circuit
                const response = await fetch('/api/simulate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(circuit)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.displayCodeResults(data.result);
                } else {
                    this.displayCodeError(data.error);
                }
            } else {
                this.displayCodeError('Could not parse quantum circuit from code');
            }
        } catch (error) {
            this.displayCodeError(error.message);
        } finally {
            document.getElementById('runCode').classList.remove('loading');
        }
    }

    parseQuantumCode(code) {
        try {
            // Simple parser for basic quantum operations
            const lines = code.split('\n');
            const circuit = {
                num_qubits: 2,
                gates: [],
                measurements: []
            };

            let circuitDefined = false;

            for (const line of lines) {
                const trimmed = line.trim();
                
                // Parse QuantumCircuit declaration
                const circuitMatch = trimmed.match(/circuit\s*=\s*QuantumCircuit\((\d+)\)/);
                if (circuitMatch) {
                    circuit.num_qubits = parseInt(circuitMatch[1]);
                    circuitDefined = true;
                    continue;
                }

                if (!circuitDefined) continue;

                // Parse gate operations
                const hMatch = trimmed.match(/circuit\.h\((\d+)\)/);
                if (hMatch) {
                    circuit.gates.push({
                        type: 'H',
                        qubit: parseInt(hMatch[1])
                    });
                }

                const xMatch = trimmed.match(/circuit\.x\((\d+)\)/);
                if (xMatch) {
                    circuit.gates.push({
                        type: 'X',
                        qubit: parseInt(xMatch[1])
                    });
                }

                const yMatch = trimmed.match(/circuit\.y\((\d+)\)/);
                if (yMatch) {
                    circuit.gates.push({
                        type: 'Y',
                        qubit: parseInt(yMatch[1])
                    });
                }

                const zMatch = trimmed.match(/circuit\.z\((\d+)\)/);
                if (zMatch) {
                    circuit.gates.push({
                        type: 'Z',
                        qubit: parseInt(zMatch[1])
                    });
                }

                const cnotMatch = trimmed.match(/circuit\.cnot\((\d+),\s*(\d+)\)/);
                if (cnotMatch) {
                    circuit.gates.push({
                        type: 'CNOT',
                        control: parseInt(cnotMatch[1]),
                        target: parseInt(cnotMatch[2])
                    });
                }

                // Parse measurements
                if (trimmed.includes('measure_all')) {
                    circuit.measurements = Array.from({length: circuit.num_qubits}, (_, i) => i);
                }
            }

            return circuitDefined ? circuit : null;
        } catch (error) {
            console.error('Code parsing error:', error);
            return null;
        }
    }

    displayCodeResults(result) {
        const resultsDiv = document.getElementById('simulationResults');
        const vizDiv = document.getElementById('stateVisualization');
        
        // Display results from code execution
        resultsDiv.innerHTML = `
            <h6>Code Execution Results</h6>
            <div class="results-data">
                <div class="code-output">
                    <strong>Quantum State:</strong><br>
                    ${result.basis_states.map((state, i) => 
                        `|${state}⟩: ${(result.probabilities[i] * 100).toFixed(2)}%`
                    ).join('<br>')}
                </div>
            </div>
        `;
        
        // Update visualization
        this.visualizeCodeResults(result, vizDiv);
        
        resultsDiv.classList.add('success');
        setTimeout(() => resultsDiv.classList.remove('success'), 2000);
    }

    visualizeCodeResults(result, container) {
        container.innerHTML = '<h6>Code Results Visualization</h6>';
        
        const maxProb = Math.max(...result.probabilities);
        
        result.basis_states.forEach((state, i) => {
            const prob = result.probabilities[i];
            const width = maxProb > 0 ? (prob / maxProb) * 100 : 0;
            
            const barContainer = document.createElement('div');
            barContainer.style.marginBottom = '5px';
            
            const bar = document.createElement('div');
            bar.className = 'probability-bar';
            bar.style.width = `${width}%`;
            bar.style.background = '#28a745';
            
            const label = document.createElement('div');
            label.className = 'probability-label';
            label.textContent = `|${state}⟩ ${(prob * 100).toFixed(1)}%`;
            
            bar.appendChild(label);
            barContainer.appendChild(bar);
            container.appendChild(barContainer);
        });
    }

    displayCodeError(error) {
        const resultsDiv = document.getElementById('simulationResults');
        resultsDiv.innerHTML = `
            <div class="error">
                <h6>Code Execution Error</h6>
                <p>${error}</p>
            </div>
        `;
        
        resultsDiv.classList.add('error');
        setTimeout(() => resultsDiv.classList.remove('error'), 3000);
    }

    getCode() {
        return this.editor.getValue();
    }

    setCode(code) {
        this.editor.setValue(code);
    }
}

// Initialize code editor when page loads
let codeEditor;
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure CodeMirror is loaded
    setTimeout(() => {
        codeEditor = new QuantumCodeEditor();
    }, 100);
});