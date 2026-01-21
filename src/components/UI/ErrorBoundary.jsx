import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Game Crash:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-screen bg-neutral-900 text-white p-6 text-center">
            <h1 className="text-4xl font-bold mb-4 text-red-500">Oops!</h1>
            <p className="text-lg opacity-80 mb-8 max-w-md">
                The game encountered an unexpected error. Don't worry, your progress might be saved.
            </p>
            <button 
                onClick={this.handleReload}
                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors uppercase tracking-widest text-sm"
            >
                Reload Game
            </button>
            <div className="mt-8 p-4 bg-black/30 rounded-lg text-xs font-mono text-left opacity-50 max-w-lg overflow-auto max-h-32">
                {this.state.error?.toString()}
            </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
