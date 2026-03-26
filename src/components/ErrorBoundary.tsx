import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { FirestoreErrorInfo } from '../firebase';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let firestoreError: FirestoreErrorInfo | null = null;
      try {
        if (this.state.errorInfo) {
          firestoreError = JSON.parse(this.state.errorInfo);
        }
      } catch (e) {
        // Not a FirestoreErrorInfo JSON
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-outfit">
          <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl shadow-black/5 p-12 border border-gray-100 text-center">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-12 h-12" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Ups! Algo salió mal</h1>
            <p className="text-gray-500 mb-10 text-lg">
              {firestoreError 
                ? 'Se ha producido un error de permisos o de base de datos. Por favor, verifica tu conexión o contacta al administrador.'
                : 'Ha ocurrido un error inesperado en la aplicación.'}
            </p>

            {firestoreError && (
              <div className="bg-red-50 rounded-3xl p-6 mb-10 text-left overflow-hidden">
                <p className="text-xs font-black uppercase tracking-widest text-red-400 mb-3">Detalles del Error</p>
                <div className="space-y-2">
                  <p className="text-sm text-red-700"><span className="font-bold">Operación:</span> {firestoreError.operationType}</p>
                  <p className="text-sm text-red-700"><span className="font-bold">Ruta:</span> {firestoreError.path}</p>
                  <p className="text-xs text-red-500 font-mono break-all mt-4 opacity-70">{firestoreError.error}</p>
                </div>
              </div>
            )}

            {!firestoreError && this.state.error && (
              <div className="bg-gray-50 rounded-3xl p-6 mb-10 text-left overflow-hidden">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Error Técnico</p>
                <p className="text-xs text-gray-500 font-mono break-all">{this.state.error.message}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <RefreshCw className="w-5 h-5" />
                Reintentar
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
              >
                <Home className="w-5 h-5" />
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
