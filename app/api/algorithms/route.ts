// app/api/algorithms/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

const GRAPH_PATH = path.join(process.cwd(), "data", "graph.json");

type Graph = {
  nodes: { data: { id: string } }[];
  edges: { data: { source: string; target: string; weight: number } }[];
};

// Build adjacency list (undirected)
function buildAdj(graph: Graph) {
  const adj: Record<string, { to: string; weight: number }[]> = {};
  graph.nodes.forEach(n => adj[n.data.id] = []);
  graph.edges.forEach(e => {
    const { source, target, weight } = e.data;
    adj[source].push({ to: target, weight });
    adj[target].push({ to: source, weight }); // undirected
  });
  return adj;
}

// BFS
function bfs(graph: Graph, start: string): string[] {
  console.log("in bfs");
  const adj = buildAdj(graph);
  const visited = new Set<string>();
  const order: string[] = [];
  const q: string[] = [start];

  while (q.length > 0) {
    const node = q.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    order.push(node);
    adj[node].forEach(n => !visited.has(n.to) && q.push(n.to));
  }
  return order;
}

// DFS
function dfs(graph: Graph, start: string): string[] {
  const adj = buildAdj(graph);
  const visited = new Set<string>();
  const order: string[] = [];

  function visit(node: string) {
    visited.add(node);
    order.push(node);
    adj[node].forEach(n => !visited.has(n.to) && visit(n.to));
  }
  visit(start);
  return order;
}

// Widest Path (max capacity) — modified Dijkstra
function widestPath(graph: Graph, src: string, dest: string) {
  const adj = buildAdj(graph);
  const capacity: Record<string, number> = {};
  const prev: Record<string, string | null> = {};

  Object.keys(adj).forEach(n => capacity[n] = 0);
  capacity[src] = Infinity;

  const pq: [number, string][] = [[Infinity, src]]; // [capacity, node]

  while (pq.length > 0) {
    pq.sort((a, b) => b[0] - a[0]);
    const [cap, node] = pq.shift()!;
    if (cap < capacity[node]) continue;

    adj[node].forEach(nei => {
      const newCap = Math.min(cap, nei.weight);
      if (newCap > capacity[nei.to]) {
        capacity[nei.to] = newCap;
        prev[nei.to] = node;
        pq.push([newCap, nei.to]);
      }
    });
  }

  if (capacity[dest] === 0) return { path: [], edges: [], capacity: 0 };

  // Reconstruct path
  const path: string[] = [];
  const edges: { from: string; to: string }[] = [];
  let curr: string | null = dest;
  while (curr !== null) {
    path.unshift(curr);
    if (prev[curr] !== undefined) {
      const from = prev[curr]!;
      edges.unshift({ from, to: curr });
    }
    curr = prev[curr] ?? null;
  }

  return { path, edges, capacity: capacity[dest] };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = await readFile(GRAPH_PATH, "utf8");
    const graph: Graph = JSON.parse(raw);

    if (body.type === "bfs") {
      return NextResponse.json({ bfs_order: bfs(graph, body.start) });
    }
    if (body.type === "dfs") {
      return NextResponse.json({ dfs_order: dfs(graph, body.start) });
    }
    if (body.type === "widest") {
      const result = widestPath(graph, body.src, body.dest);
      return NextResponse.json({
        widest_path: result.path,
        widest_path_edges: result.edges,
        widest_path_capacity: result.capacity,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}