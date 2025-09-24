from flask import Flask, render_template, request, jsonify
import numpy as np
import json
import os
from quantum_simulator import QuantumCircuit, QuantumSimulator
from ai_assistant import AIAssistant

app = Flask(__name__)
app.secret_key = os.environ.get('SESSION_SECRET', 'quantum-simulator-secret-key')

# Initialize quantum simulator and AI assistant
simulator = QuantumSimulator()
ai_assistant = AIAssistant()

@app.route('/')
def index():
    """Main page with circuit builder and code editor"""
    return render_template('index.html')

@app.route('/api/simulate', methods=['POST'])
def simulate_circuit():
    """Simulate a quantum circuit"""
    try:
        circuit_data = request.json
        if not circuit_data:
            return jsonify({'success': False, 'error': 'No circuit data provided'}), 400
        
        circuit = QuantumCircuit.from_dict(circuit_data)
        result = simulator.run(circuit)
        return jsonify({
            'success': True,
            'result': result.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/ai-suggest', methods=['POST'])
def ai_suggest():
    """Get AI suggestions for next quantum gates or code"""
    try:
        context = request.json
        suggestions = ai_assistant.get_suggestions(context)
        return jsonify({
            'success': True,
            'suggestions': suggestions
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/validate-circuit', methods=['POST'])
def validate_circuit():
    """Validate quantum circuit for errors"""
    try:
        circuit_data = request.json
        if not circuit_data:
            return jsonify({'success': False, 'error': 'No circuit data provided'}), 400
            
        circuit = QuantumCircuit.from_dict(circuit_data)
        errors = circuit.validate()
        return jsonify({
            'success': True,
            'errors': errors
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/algorithms')
def get_algorithms():
    """Get available quantum algorithm templates"""
    algorithms = {
        'bell_state': {
            'name': 'Bell State',
            'description': 'Creates an entangled Bell state',
            'gates': [
                {'type': 'H', 'qubit': 0},
                {'type': 'CNOT', 'control': 0, 'target': 1}
            ]
        },
        'grovers_search': {
            'name': "Grover's Search",
            'description': 'Quantum search algorithm',
            'gates': [
                {'type': 'H', 'qubit': 0},
                {'type': 'H', 'qubit': 1},
                {'type': 'Z', 'qubit': 0},
                {'type': 'CNOT', 'control': 0, 'target': 1},
                {'type': 'H', 'qubit': 0},
                {'type': 'H', 'qubit': 1}
            ]
        }
    }
    return jsonify(algorithms)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)