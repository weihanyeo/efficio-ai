'use client';

import React from 'react';
import { FileText, Lightbulb, Check, X } from 'lucide-react';

interface DocumentationSuggestion {
  id: string;
  file: string;
  suggestion: string;
  accepted: boolean | null;
}

export default function DocumentationSuggestions() {
  const [suggestions, setSuggestions] = React.useState<DocumentationSuggestion[]>([
    {
      id: '1',
      file: 'auth/AuthProvider.tsx',
      suggestion: 'Add documentation explaining the token refresh mechanism and how it handles expired sessions.',
      accepted: null
    },
    {
      id: '2',
      file: 'api/auth/[...nextauth].ts',
      suggestion: 'Document the callback URLs and environment variables required for each OAuth provider.',
      accepted: true
    },
    {
      id: '3',
      file: 'components/LoginForm.tsx',
      suggestion: 'Add JSDoc comments for the LoginForm props and explain the authentication flow.',
      accepted: null
    },
    {
      id: '4',
      file: 'middleware.ts',
      suggestion: 'Document the route protection strategy and how to add new protected routes.',
      accepted: false
    }
  ]);

  const handleAccept = (id: string) => {
    setSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === id ? { ...suggestion, accepted: true } : suggestion
      )
    );
  };

  const handleReject = (id: string) => {
    setSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === id ? { ...suggestion, accepted: false } : suggestion
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="text-amber-500 w-5 h-5" />
        <h3 className="font-semibold">AI Documentation Suggestions</h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.map(suggestion => (
          <div 
            key={suggestion.id} 
            className={`p-3 rounded-md border ${
              suggestion.accepted === true 
                ? 'border-green-200 bg-green-50' 
                : suggestion.accepted === false 
                  ? 'border-red-200 bg-red-50'
                  : 'border-border bg-card'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium mb-1">{suggestion.file}</p>
                <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
              </div>
              
              {suggestion.accepted === null && (
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleAccept(suggestion.id)}
                    className="p-1 hover:bg-green-100 rounded-full"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </button>
                  <button 
                    onClick={() => handleReject(suggestion.id)}
                    className="p-1 hover:bg-red-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
              
              {suggestion.accepted === true && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Accepted
                </span>
              )}
              
              {suggestion.accepted === false && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                  Rejected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
