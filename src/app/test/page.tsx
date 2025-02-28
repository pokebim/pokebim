'use client';

import { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Test Page</h1>
      <p className="text-xl mb-4">Count: {count}</p>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
    </div>
  );
} 