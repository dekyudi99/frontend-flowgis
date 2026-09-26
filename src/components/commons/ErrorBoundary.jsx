import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/elements/Button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full flex flex-col items-center justify-center p-6 bg-rose-50/50 border border-rose-200 rounded-2xl text-center my-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">Terjadi Kesalahan pada Tampilan</h3>
          <p className="text-xs text-gray-600 max-w-md mb-4 font-mono">
            {this.state.error?.message || 'Komponen gagal dimuat dengan sempurna.'}
          </p>
          <Button 
            size="sm" 
            onClick={this.handleReset}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Halaman
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
