import numpy as np
from typing import List, Dict, Any, Tuple
import json

class QuantumGate:
    """Represents a quantum gate with its matrix representation"""
    
    GATES = {
        'I': np.array([[1, 0], [0, 1]], dtype=complex),  # Identity
        'X': np.array([[0, 1], [1, 0]], dtype=complex),  # Pauli-X
        'Y': np.array([[0, -1j], [1j, 0]], dtype=complex),  # Pauli-Y
        'Z': np.array([[1, 0], [0, -1]], dtype=complex),  # Pauli-Z
        'H': np.array([[1, 1], [1, -1]], dtype=complex) / np.sqrt(2),  # Hadamard
        'S': np.array([[1, 0], [0, 1j]], dtype=complex),  # S gate
        'T': np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]], dtype=complex),  # T gate
    }
    
    @staticmethod
    def cnot_matrix():
        """CNOT gate matrix for 2-qubit system"""
        return np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 1],
            [0, 0, 1, 0]
        ], dtype=complex)
    
    @staticmethod
    def apply_single_gate(gate_name: str, state: np.ndarray, qubit: int, num_qubits: int) -> np.ndarray:
        """Apply a single-qubit gate to a quantum state"""
        if gate_name not in QuantumGate.GATES:
            raise ValueError(f"Unknown gate: {gate_name}")
        
        gate = QuantumGate.GATES[gate_name]
        
        # Create the full gate matrix for the system
        full_gate = np.eye(1, dtype=complex)
        for i in range(num_qubits):
            if i == qubit:
                full_gate = np.kron(full_gate, gate)
            else:
                full_gate = np.kron(full_gate, QuantumGate.GATES['I'])
        
        return full_gate @ state
    
    @staticmethod
    def apply_cnot(state: np.ndarray, control: int, target: int, num_qubits: int) -> np.ndarray:
        """Apply CNOT gate to a quantum state"""
        if num_qubits < 2:
            raise ValueError("CNOT requires at least 2 qubits")
        
        # For simplicity, handle 2-qubit case directly
        if num_qubits == 2:
            return QuantumGate.cnot_matrix() @ state
        
        # For more qubits, we need to construct the appropriate matrix
        # This is a simplified implementation
        size = 2 ** num_qubits
        cnot_full = np.eye(size, dtype=complex)
        
        for i in range(size):
            binary = format(i, f'0{num_qubits}b')
            control_bit = int(binary[control])
            target_bit = int(binary[target])
            
            if control_bit == 1:
                # Flip target bit
                new_binary = list(binary)
                new_binary[target] = str(1 - target_bit)
                j = int(''.join(new_binary), 2)
                cnot_full[j, i] = 1
                cnot_full[i, i] = 0
        
        return cnot_full @ state

class QuantumCircuit:
    """Represents a quantum circuit"""
    
    def __init__(self, num_qubits: int):
        self.num_qubits = num_qubits
        self.gates = []
        self.measurements = []
    
    def add_gate(self, gate_type: str, qubit: int, **kwargs):
        """Add a quantum gate to the circuit"""
        self.gates.append({
            'type': gate_type,
            'qubit': qubit,
            **kwargs
        })
    
    def add_cnot(self, control: int, target: int):
        """Add a CNOT gate to the circuit"""
        self.gates.append({
            'type': 'CNOT',
            'control': control,
            'target': target
        })
    
    def add_measurement(self, qubit: int):
        """Add a measurement to the circuit"""
        self.measurements.append(qubit)
    
    def validate(self) -> List[str]:
        """Validate the circuit and return any errors"""
        errors = []
        
        for gate in self.gates:
            if gate['type'] == 'CNOT':
                if gate['control'] >= self.num_qubits or gate['target'] >= self.num_qubits:
                    errors.append(f"CNOT gate uses qubit index outside circuit range")
                if gate['control'] == gate['target']:
                    errors.append(f"CNOT gate cannot have same control and target qubit")
            else:
                if gate['qubit'] >= self.num_qubits:
                    errors.append(f"{gate['type']} gate uses qubit index outside circuit range")
        
        return errors
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'QuantumCircuit':
        """Create circuit from dictionary representation"""
        circuit = cls(data['num_qubits'])
        circuit.gates = data.get('gates', [])
        circuit.measurements = data.get('measurements', [])
        return circuit
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert circuit to dictionary representation"""
        return {
            'num_qubits': self.num_qubits,
            'gates': self.gates,
            'measurements': self.measurements
        }

class QuantumState:
    """Represents a quantum state"""
    
    def __init__(self, num_qubits: int):
        self.num_qubits = num_qubits
        self.amplitudes = np.zeros(2 ** num_qubits, dtype=complex)
        self.amplitudes[0] = 1.0  # Start in |0...0⟩ state
    
    def measure(self, qubit: int) -> int:
        """Measure a qubit (simplified - just return probabilities)"""
        probs = np.abs(self.amplitudes) ** 2
        return probs
    
    def get_probabilities(self) -> np.ndarray:
        """Get measurement probabilities for all basis states"""
        return np.abs(self.amplitudes) ** 2
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert state to dictionary representation"""
        probs = self.get_probabilities()
        return {
            'num_qubits': self.num_qubits,
            'probabilities': probs.tolist(),
            'basis_states': [format(i, f'0{self.num_qubits}b') for i in range(len(probs))]
        }

class QuantumSimulator:
    """Quantum circuit simulator"""
    
    def run(self, circuit: QuantumCircuit) -> QuantumState:
        """Run a quantum circuit and return the final state"""
        state = QuantumState(circuit.num_qubits)
        
        # Apply gates sequentially
        for gate in circuit.gates:
            if gate['type'] == 'CNOT':
                state.amplitudes = QuantumGate.apply_cnot(
                    state.amplitudes, 
                    gate['control'], 
                    gate['target'], 
                    circuit.num_qubits
                )
            else:
                state.amplitudes = QuantumGate.apply_single_gate(
                    gate['type'],
                    state.amplitudes,
                    gate['qubit'],
                    circuit.num_qubits
                )
        
        return state