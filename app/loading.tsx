// app/login/loading.tsx
import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Image 
            src="favicon.svg" 
            alt="Loading" 
            width={120} 
            height={120} 
            className="animate-pulse"
          />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-blue-800 animate-pulse">
            Loading Efficio.AI
          </h2>
          <p className="text-blue-600 animate-bounce">
            Preparing your workspace...
          </p>
        </div>
        
        <div className="mt-8 flex justify-center space-x-2">
          {[1, 2, 3].map((dot) => (
            <div 
              key={dot} 
              className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
              style={{
                animationDelay: `${dot * 0.2}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}