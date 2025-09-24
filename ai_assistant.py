import openai
import os
from typing import Dict, List, Any
import json

class AIAssistant:
    """AI assistant for quantum computing suggestions"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY', ''))
        self.context_history = []
    
    def get_suggestions(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get AI suggestions based on current context"""
        try:
            # For now, provide rule-based suggestions until OpenAI key is available
            return self._get_rule_based_suggestions(context)
        except Exception as e:
            print(f"AI suggestion error: {e}")
            return self._get_rule_based_suggestions(context)
    
    def _get_rule_based_suggestions(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Provide rule-based suggestions when AI is not available"""
        suggestions = []
        
        circuit_gates = context.get('circuit_gates', [])
        current_code = context.get('code', '')
        num_qubits = context.get('num_qubits', 2)
        
        # Analyze current circuit and suggest next steps
        if not circuit_gates:
            suggestions.append({
                'type': 'gate',
                'suggestion': 'Start with a Hadamard gate to create superposition',
                'gate': 'H',
                'qubit': 0,
                'confidence': 0.9
            })
        else:
            last_gate = circuit_gates[-1] if circuit_gates else None
            
            # If we have a Hadamard on qubit 0, suggest CNOT for entanglement
            has_h_on_0 = any(g.get('type') == 'H' and g.get('qubit') == 0 for g in circuit_gates)
            has_cnot = any(g.get('type') == 'CNOT' for g in circuit_gates)
            
            if has_h_on_0 and not has_cnot and num_qubits > 1:
                suggestions.append({
                    'type': 'gate',
                    'suggestion': 'Add CNOT gate to create entanglement between qubits',
                    'gate': 'CNOT',
                    'control': 0,
                    'target': 1,
                    'confidence': 0.8
                })
            
            # Suggest measurement if circuit has gates but no measurements
            if circuit_gates and not context.get('measurements', []):
                suggestions.append({
                    'type': 'measurement',
                    'suggestion': 'Add measurements to observe the quantum state',
                    'qubits': list(range(num_qubits)),
                    'confidence': 0.7
                })
        
        # Code completion suggestions
        if 'circuit' in current_code.lower() and 'h' in current_code.lower():
            suggestions.append({
                'type': 'code',
                'suggestion': 'Add CNOT gate for entanglement',
                'code': 'circuit.cnot(0, 1)',
                'confidence': 0.8
            })
        
        return suggestions
    
    def _get_ai_suggestions(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get suggestions from OpenAI API"""
        prompt = self._build_prompt(context)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a quantum computing expert assistant. Provide helpful suggestions for quantum circuit design and quantum programming."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            # Parse response and return structured suggestions
            return self._parse_ai_response(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return []
    
    def _build_prompt(self, context: Dict[str, Any]) -> str:
        """Build prompt for AI based on context"""
        circuit_gates = context.get('circuit_gates', [])
        code = context.get('code', '')
        num_qubits = context.get('num_qubits', 2)
        
        prompt = f"""
        Current quantum circuit context:
        - Number of qubits: {num_qubits}
        - Current gates: {circuit_gates}
        - Current code: {code}
        
        Please suggest the next best quantum gate or code completion for this quantum circuit.
        Focus on common quantum algorithms like Bell states, Grover's search, or quantum error correction.
        Provide suggestions in JSON format with type, suggestion text, and confidence score.
        """
        
        return prompt
    
    def _parse_ai_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse AI response into structured suggestions"""
        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return [json.loads(json_match.group())]
            else:
                # Fallback to simple text suggestion
                return [{
                    'type': 'general',
                    'suggestion': response,
                    'confidence': 0.5
                }]
        except:
            return [{
                'type': 'general',
                'suggestion': response,
                'confidence': 0.5
            }]