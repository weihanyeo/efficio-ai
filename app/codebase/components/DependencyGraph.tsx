'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Network, Share2, Lock, Unlock, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  color: string;
  size: number;
}

interface Edge {
  from: string; 
  to: string;
  width: number;
  color: string;
}

interface NodePosition {
  x: number;
  y: number;
}

export default function DependencyGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [isDragging, setIsDragging] = useState(false);
  
  // Sample data for the dependency graph
  const nodes: Node[] = [
    { id: 'auth', label: 'AuthProvider', color: '#3b82f6', size: 20 },
    { id: 'nextauth', label: '[...nextauth]', color: '#3b82f6', size: 18 },
    { id: 'login', label: 'LoginForm', color: '#3b82f6', size: 16 },
    { id: 'middleware', label: 'middleware', color: '#3b82f6', size: 15 },
    { id: 'dashboard', label: 'Dashboard', color: '#94a3b8', size: 14 },
    { id: 'profile', label: 'UserProfile', color: '#94a3b8', size: 12 },
    { id: 'api', label: 'API Routes', color: '#94a3b8', size: 14 },
    { id: 'layout', label: 'Layout', color: '#94a3b8', size: 13 },
    { id: 'navbar', label: 'Navbar', color: '#94a3b8', size: 10 }
  ];
  
  const edges: Edge[] = [
    { from: 'auth', to: 'nextauth', width: 3, color: '#3b82f6' },
    { from: 'auth', to: 'login', width: 3, color: '#3b82f6' },
    { from: 'auth', to: 'middleware', width: 3, color: '#3b82f6' },
    { from: 'nextauth', to: 'api', width: 2, color: '#94a3b8' },
    { from: 'middleware', to: 'dashboard', width: 2, color: '#94a3b8' },
    { from: 'auth', to: 'profile', width: 2, color: '#94a3b8' },
    { from: 'login', to: 'layout', width: 1, color: '#94a3b8' },
    { from: 'layout', to: 'navbar', width: 1, color: '#94a3b8' }
  ];

  // Initialize positions
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const initialPositions: Record<string, NodePosition> = {};
    
    // Initialize positions in a circular layout
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;
    
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      initialPositions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    
    setPositions(initialPositions);
  }, []);

  // Draw the graph
  useEffect(() => {
    if (!canvasRef.current || Object.keys(positions).length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = 300;
      
      // If positions are empty, initialize them
      if (Object.keys(positions).length === 0) {
        const newPositions: Record<string, NodePosition> = {};
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.35;
        
        nodes.forEach((node, index) => {
          const angle = (index / nodes.length) * 2 * Math.PI;
          newPositions[node.id] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          };
        });
        
        setPositions(newPositions);
      }
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Draw function
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply zoom
      ctx.save();
      ctx.scale(zoomLevel, zoomLevel);
      
      // Draw edges
      edges.forEach(edge => {
        const posA = positions[edge.from];
        const posB = positions[edge.to];
        
        if (posA && posB) {
          ctx.beginPath();
          ctx.moveTo(posA.x / zoomLevel, posA.y / zoomLevel);
          ctx.lineTo(posB.x / zoomLevel, posB.y / zoomLevel);
          ctx.strokeStyle = edge.color;
          ctx.lineWidth = edge.width;
          ctx.stroke();
        }
      });
      
      // Draw nodes
      nodes.forEach(node => {
        const pos = positions[node.id];
        
        if (pos) {
          // Draw circle
          ctx.beginPath();
          ctx.arc(pos.x / zoomLevel, pos.y / zoomLevel, node.size, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.fill();
          
          // Draw label
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, pos.x / zoomLevel, pos.y / zoomLevel);
        }
      });
      
      ctx.restore();
    };
    
    draw();
    
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [positions, zoomLevel]);

  // Handle mouse events for dragging
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    
    const handleMouseDown = (e: MouseEvent) => {
      if (isLocked) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      // Check if mouse is over a node
      for (const node of nodes) {
        const pos = positions[node.id];
        if (!pos) continue;
        
        const dx = pos.x - mouseX;
        const dy = pos.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= node.size * zoomLevel) {
          setDraggedNode(node.id);
          setIsDragging(true);
          break;
        }
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedNode || isLocked) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      setPositions(prev => ({
        ...prev,
        [draggedNode]: { x: mouseX, y: mouseY }
      }));
    };
    
    const handleMouseUp = () => {
      setDraggedNode(null);
      setIsDragging(false);
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedNode, isDragging, isLocked, nodes, positions, zoomLevel]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const toggleLock = () => {
    setIsLocked(prev => !prev);
  };
  
  const resetPositions = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const newPositions: Record<string, NodePosition> = {};
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;
    
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      newPositions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    
    setPositions(newPositions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Network className="text-indigo-500 w-5 h-5" />
          <h3 className="font-semibold">Dependency Graph</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLock} 
            className="p-1 hover:bg-secondary rounded-md"
            title={isLocked ? "Unlock to enable dragging" : "Lock positions"}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button 
            onClick={handleZoomIn} 
            className="p-1 hover:bg-secondary rounded-md"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={handleZoomOut} 
            className="p-1 hover:bg-secondary rounded-md"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={resetPositions} 
            className="p-1 hover:bg-secondary rounded-md"
            title="Reset positions"
          >
            <Move className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Visualization of relationships between modified components and the existing codebase.
          Blue nodes represent modified components. {!isLocked && "Drag nodes to reposition them."}
        </p>
        
        <div className="border border-border rounded-md overflow-hidden bg-card/50 relative">
          <canvas 
            ref={canvasRef} 
            className="w-full h-[300px]"
            style={{ cursor: isLocked ? 'default' : isDragging ? 'grabbing' : 'grab' }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span>Modified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#94a3b8]"></div>
            <span>Affected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
