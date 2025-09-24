# Overview

This is an AI-powered quantum computing simulator that combines an interactive circuit builder with an intelligent code editor. The application allows developers to create quantum circuits using a drag-and-drop interface, write quantum code with AI assistance, and simulate quantum computations in real-time. The system features predictive AI capabilities that suggest next moves, optimize circuits, and provide context-aware recommendations based on developer behavior and quantum computing best practices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend uses a modular JavaScript architecture with separate components for different functionalities:
- **Circuit Builder**: Uses D3.js for SVG-based quantum circuit visualization with drag-and-drop gate placement
- **Code Editor**: Integrates CodeMirror for Python/quantum programming language support with syntax highlighting and auto-completion
- **AI Assistant Interface**: Provides real-time suggestions and predictive recommendations through REST API calls
- **Quantum Simulator Interface**: Handles circuit validation and simulation requests with real-time result visualization

## Backend Architecture
Built on Flask with a service-oriented architecture:
- **Flask Web Server**: Serves the main application and handles API routing
- **Quantum Simulator Engine**: Core simulation logic using numpy for matrix operations and quantum state calculations
- **AI Assistant Service**: Provides both OpenAI-powered and rule-based fallback suggestions for circuit optimization and code completion
- **API Layer**: RESTful endpoints for circuit simulation, AI suggestions, and circuit validation

## Data Models
- **QuantumCircuit**: Represents quantum circuits with gates, qubits, and measurements in dictionary format
- **QuantumGate**: Implements quantum gate operations with matrix representations for common gates (H, X, Y, Z, CNOT, etc.)
- **Simulation Results**: Structured data containing quantum state probabilities and measurement outcomes

## AI Integration Strategy
The system implements a hybrid AI approach:
- **Primary**: OpenAI API integration for advanced quantum algorithm suggestions and code completion
- **Fallback**: Rule-based system analyzing circuit patterns and providing context-aware recommendations
- **Learning**: Context history tracking to improve suggestion accuracy over time

# External Dependencies

## Core Technologies
- **Flask**: Web framework for Python backend
- **NumPy**: Scientific computing for quantum state calculations and matrix operations
- **Bootstrap 5**: Frontend styling and responsive design
- **D3.js**: Data visualization for quantum circuit diagrams
- **CodeMirror**: Code editor with syntax highlighting and auto-completion

## AI Services
- **OpenAI API**: Optional integration for advanced AI suggestions and code completion (requires OPENAI_API_KEY environment variable)

## Frontend Libraries
- **Font Awesome**: Icon library for UI elements
- **jQuery**: DOM manipulation and AJAX requests

## Development Environment
- **Environment Variables**: 
  - `OPENAI_API_KEY`: Optional OpenAI API key for enhanced AI features
  - `SESSION_SECRET`: Flask session security key