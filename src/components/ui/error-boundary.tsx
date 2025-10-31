'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-8 h-8" />
                        Component Rendering Error
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 font-code">
                    <p className="font-sans text-lg">A critical error occurred while trying to render a component, which prevented it from displaying.</p>
                    {this.state.error && (
                        <div>
                            <h3 className="font-bold text-destructive">Error Message:</h3>
                            <pre className="mt-2 rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
                                {this.state.error.toString()}
                            </pre>
                        </div>
                    )}
                    {this.state.errorInfo && (
                        <div>
                            <h3 className="font-bold text-destructive">Component Stack:</h3>
                            <pre className="mt-2 rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
