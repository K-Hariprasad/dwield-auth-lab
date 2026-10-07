import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dwield Lab UI Boundary Caught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: '550px', margin: '0 auto' }}>
            <AlertTriangle size={36} color="#EF4444" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#0F172A', marginBottom: '0.5rem' }}>Component Render Error</h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              <RefreshCw size={14} /> Reset Component State
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
