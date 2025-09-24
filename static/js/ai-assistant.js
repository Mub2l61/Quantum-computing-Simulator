// AI Assistant Integration JavaScript

class AIAssistantInterface {
    constructor() {
        this.suggestionHistory = [];
        this.currentContext = {};
        this.isProcessing = false;
    }

    async getSuggestions(context) {
        if (this.isProcessing) {
            return [];
        }

        try {
            this.isProcessing = true;
            this.currentContext = context;

            const response = await fetch('/api/ai-suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(context)
            });

            const data = await response.json();

            if (data.success) {
                this.suggestionHistory.push({
                    context: context,
                    suggestions: data.suggestions,
                    timestamp: new Date().toISOString()
                });
                return data.suggestions;
            } else {
                console.error('AI suggestion error:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Failed to get AI suggestions:', error);
            return [];
        } finally {
            this.isProcessing = false;
        }
    }

    async getCodeCompletion(codeContext) {
        const context = {
            type: 'code_completion',
            code: codeContext.code,
            cursor_position: codeContext.cursorPosition,
            line_content: codeContext.lineContent
        };

        return await this.getSuggestions(context);
    }

    async getCircuitSuggestions(circuitContext) {
        const context = {
            type: 'circuit_suggestion',
            circuit_gates: circuitContext.gates,
            num_qubits: circuitContext.numQubits,
            measurements: circuitContext.measurements,
            last_action: circuitContext.lastAction
        };

        return await this.getSuggestions(context);
    }

    async getNextStepPrediction(fullContext) {
        const context = {
            type: 'next_step_prediction',
            circuit_gates: fullContext.circuitGates,
            code: fullContext.code,
            user_patterns: this.analyzeUserPatterns(),
            session_history: this.suggestionHistory.slice(-5) // Last 5 interactions
        };

        return await this.getSuggestions(context);
    }

    analyzeUserPatterns() {
        // Analyze user interaction patterns from suggestion history
        const patterns = {
            preferred_gates: {},
            coding_style: 'pythonic',
            complexity_preference: 'intermediate',
            algorithm_interests: []
        };

        this.suggestionHistory.forEach(interaction => {
            const context = interaction.context;
            
            // Track gate usage patterns
            if (context.circuit_gates) {
                context.circuit_gates.forEach(gate => {
                    patterns.preferred_gates[gate.type] = 
                        (patterns.preferred_gates[gate.type] || 0) + 1;
                });
            }

            // Track algorithm interests
            if (context.algorithm_type) {
                patterns.algorithm_interests.push(context.algorithm_type);
            }
        });

        return patterns;
    }

    generatePredictiveHints(currentState) {
        const hints = [];
        
        // Circuit-based predictions
        if (currentState.circuitGates) {
            const gates = currentState.circuitGates;
            
            // Pattern: H gate often followed by CNOT for entanglement
            const hasHadamard = gates.some(g => g.type === 'H');
            const hasCNOT = gates.some(g => g.type === 'CNOT');
            
            if (hasHadamard && !hasCNOT && currentState.numQubits > 1) {
                hints.push({
                    type: 'predictive',
                    suggestion: 'You might want to add a CNOT gate next to create entanglement',
                    confidence: 0.8,
                    reasoning: 'H gates often create superposition followed by entanglement'
                });
            }

            // Pattern: Bell state detection
            if (hasHadamard && hasCNOT) {
                hints.push({
                    type: 'predictive',
                    suggestion: 'This looks like a Bell state circuit - consider adding measurements',
                    confidence: 0.9,
                    reasoning: 'H + CNOT is a common Bell state pattern'
                });
            }
        }

        // Code-based predictions
        if (currentState.code) {
            const code = currentState.code.toLowerCase();
            
            if (code.includes('circuit') && !code.includes('measure')) {
                hints.push({
                    type: 'predictive',
                    suggestion: 'Add measurements to observe the quantum state',
                    confidence: 0.7,
                    reasoning: 'Circuits typically need measurements to extract results'
                });
            }

            if (code.includes('h(') && code.includes('cnot(')) {
                hints.push({
                    type: 'predictive',
                    suggestion: 'Consider running a simulation to see the entangled state',
                    confidence: 0.8,
                    reasoning: 'H + CNOT creates interesting quantum correlations'
                });
            }
        }

        return hints;
    }

    formatSuggestionForDisplay(suggestion) {
        const icons = {
            'gate': '🚪',
            'code': '💻',
            'measurement': '📊',
            'optimization': '⚡',
            'debugging': '🐛',
            'algorithm': '🧮',
            'predictive': '🔮'
        };

        const icon = icons[suggestion.type] || '💡';
        const confidence = Math.round(suggestion.confidence * 100);
        
        return {
            html: `
                <div class="suggestion-item ai-suggestion" data-type="${suggestion.type}">
                    <div class="suggestion-header">
                        <span class="suggestion-icon">${icon}</span>
                        <span class="suggestion-confidence">${confidence}%</span>
                    </div>
                    <div class="suggestion-text">${suggestion.suggestion}</div>
                    ${suggestion.reasoning ? `<div class="suggestion-reasoning">${suggestion.reasoning}</div>` : ''}
                </div>
            `,
            action: suggestion.action || null
        };
    }

    setupRealTimeAssistance() {
        // Monitor circuit changes
        if (window.circuitBuilder) {
            const originalUpdateCanvas = window.circuitBuilder.updateCanvas;
            window.circuitBuilder.updateCanvas = function() {
                originalUpdateCanvas.call(this);
                aiAssistant.onCircuitChange(this.circuit);
            };
        }

        // Monitor code changes
        if (window.codeEditor && window.codeEditor.editor) {
            window.codeEditor.editor.on('change', () => {
                clearTimeout(this.codeChangeTimeout);
                this.codeChangeTimeout = setTimeout(() => {
                    aiAssistant.onCodeChange(window.codeEditor.getCode());
                }, 1000); // Debounce for 1 second
            });
        }
    }

    async onCircuitChange(circuit) {
        try {
            const suggestions = await this.getCircuitSuggestions({
                gates: circuit.gates,
                numQubits: circuit.num_qubits,
                measurements: circuit.measurements,
                lastAction: 'circuit_modified'
            });

            this.displaySuggestions(suggestions);
        } catch (error) {
            console.error('Error getting circuit suggestions:', error);
        }
    }

    async onCodeChange(code) {
        try {
            const suggestions = await this.getCodeCompletion({
                code: code,
                cursorPosition: window.codeEditor.editor.getCursor(),
                lineContent: window.codeEditor.editor.getLine(window.codeEditor.editor.getCursor().line)
            });

            // Show subtle code suggestions
            this.showCodeSuggestions(suggestions);
        } catch (error) {
            console.error('Error getting code suggestions:', error);
        }
    }

    displaySuggestions(suggestions) {
        const container = document.getElementById('aiSuggestions');
        if (!container) return;

        if (suggestions.length === 0) {
            container.innerHTML = '<p class="text-muted">No suggestions available.</p>';
            return;
        }

        const formattedSuggestions = suggestions.map(s => this.formatSuggestionForDisplay(s));
        
        container.innerHTML = formattedSuggestions.map((formatted, index) => {
            return `<div class="suggestion-wrapper" onclick="aiAssistant.applySuggestion(${index}, ${JSON.stringify(suggestions[index]).replace(/"/g, '&quot;')})">${formatted.html}</div>`;
        }).join('');

        // Add animation
        container.classList.add('fade-in');
        setTimeout(() => container.classList.remove('fade-in'), 300);
    }

    showCodeSuggestions(suggestions) {
        // Create a floating suggestion panel for code
        const existingPanel = document.getElementById('codeSuggestionPanel');
        if (existingPanel) {
            existingPanel.remove();
        }

        if (suggestions.length === 0) return;

        const panel = document.createElement('div');
        panel.id = 'codeSuggestionPanel';
        panel.className = 'code-suggestion-panel';
        panel.innerHTML = `
            <div class="suggestion-header">
                <span>💡 Code Suggestions</span>
                <button onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="suggestion-content">
                ${suggestions.map(s => `
                    <div class="code-suggestion-item" onclick="aiAssistant.applyCodeSuggestion('${s.code || s.suggestion}')">
                        ${s.suggestion}
                    </div>
                `).join('')}
            </div>
        `;

        // Position the panel
        const editorElement = document.querySelector('.CodeMirror');
        if (editorElement) {
            panel.style.position = 'absolute';
            panel.style.top = '10px';
            panel.style.right = '10px';
            panel.style.maxWidth = '300px';
            panel.style.background = 'white';
            panel.style.border = '1px solid #ccc';
            panel.style.borderRadius = '4px';
            panel.style.padding = '10px';
            panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            panel.style.zIndex = '1000';

            editorElement.parentElement.style.position = 'relative';
            editorElement.parentElement.appendChild(panel);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (panel.parentElement) {
                    panel.remove();
                }
            }, 5000);
        }
    }

    applySuggestion(index, suggestion) {
        try {
            if (suggestion.type === 'gate' && window.circuitBuilder) {
                if (suggestion.gate === 'CNOT') {
                    window.circuitBuilder.addCNOTGate(
                        suggestion.control || 0, 
                        suggestion.target || 1, 
                        200
                    );
                } else {
                    window.circuitBuilder.addGate(
                        suggestion.gate, 
                        suggestion.qubit || 0, 
                        200
                    );
                }
            } else if (suggestion.type === 'code' && window.codeEditor) {
                const editor = window.codeEditor.editor;
                const cursor = editor.getCursor();
                editor.replaceRange(suggestion.code || suggestion.suggestion, cursor);
            }

            // Track successful application
            this.trackSuggestionUsage(suggestion, 'applied');
        } catch (error) {
            console.error('Error applying suggestion:', error);
            this.trackSuggestionUsage(suggestion, 'error');
        }
    }

    applyCodeSuggestion(code) {
        if (window.codeEditor && window.codeEditor.editor) {
            const editor = window.codeEditor.editor;
            const cursor = editor.getCursor();
            editor.replaceRange(code, cursor);
        }
    }

    trackSuggestionUsage(suggestion, outcome) {
        // Track suggestion usage for improving AI predictions
        this.suggestionHistory.push({
            suggestion: suggestion,
            outcome: outcome,
            timestamp: new Date().toISOString(),
            context: this.currentContext
        });

        // Keep only last 100 interactions
        if (this.suggestionHistory.length > 100) {
            this.suggestionHistory = this.suggestionHistory.slice(-100);
        }
    }

    getSuggestionHistory() {
        return this.suggestionHistory;
    }

    clearHistory() {
        this.suggestionHistory = [];
        this.currentContext = {};
    }
}

// Global AI assistant instance
let aiAssistant;

document.addEventListener('DOMContentLoaded', () => {
    aiAssistant = new AIAssistantInterface();
    
    // Set up real-time assistance after other components are loaded
    setTimeout(() => {
        aiAssistant.setupRealTimeAssistance();
    }, 1000);
});