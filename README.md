# Telephone Network Routing & Traversal System

**A graph-based telephone network simulator**  
Built with React, Next.js, Cytoscape.js and C++ backend  
*Data Structures & Algorithms Project*

## Overview

This project simulates a telephone communication network modeled as a **weighted undirected graph**:

- Nodes → Switching stations  
- Edges → Transmission lines  
- Edge weights → Bandwidth (Mbps)

### Supported Operations
- Maximum Bandwidth Path (Widest Path) using modified Dijkstra’s algorithm  
- BFS and DFS traversals with step-by-step animation  
- Fully interactive graph visualization  
- C++ backend handling all core algorithms  
- JSON-based communication between frontend and backend  

## Features

### Frontend (Next.js + React + Cytoscape.js)
- Add/remove nodes and edges interactively  
- Set custom bandwidth on edges  
- Real-time graph rendering with automatic layouts  
- Edge labels showing bandwidth values  
- Highlight maximum-bandwidth path  
- Animated BFS & DFS traversal  
- Export current graph as JSON  

### Backend (C++17)
- Graph stored using adjacency lists  
- Modified Dijkstra for Widest Path Problem (max-heap)  
- Standard BFS and DFS implementations  
- JSON input/output via `nlohmann/json`  
- High performance using STL containers  

### Integration
- Next.js API route spawns C++ executable (`child_process`)  
- Seamless JSON request/response cycle  
- Instant visualization of algorithm results  

## Tech Stack

- **Frontend**: Next.js, React, Cytoscape.js, TailwindCSS  
- **Backend**: C++17, nlohmann/json, STL  
- **Communication**: JSON + Node.js `child_process.exec()`  

## Algorithms

| Algorithm            | Purpose                         | Time Complexity |
|----------------------|----------------------------------|-----------------|
| Modified Dijkstra    | Maximum bandwidth path           | O(E log V)      |
| BFS                  | Level-order traversal            | O(V + E)        |
| DFS                  | Depth-first traversal            | O(V + E)        |

Academic project - free to use, study, and modify for educational purposes.
