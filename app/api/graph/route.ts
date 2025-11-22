import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const GRAPH_PATH = path.join(process.cwd(), "data", "graph.json");

type Node = { data: { id: string; label?: string } };
type Edge = { data: { source: string; target: string; weight: number } };
type Graph = { nodes: Node[]; edges: Edge[] };

// Ensure /data and graph.json exist
async function loadGraph(): Promise<Graph> {
  try {
    const raw = await fs.readFile(GRAPH_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    const empty: Graph = { nodes: [], edges: [] };
    await saveGraph(empty);
    return empty;
  }
}

async function saveGraph(graph: Graph): Promise<void> {
  await fs.mkdir(path.dirname(GRAPH_PATH), { recursive: true });
  await fs.writeFile(GRAPH_PATH, JSON.stringify(graph, null, 2), "utf8");
}

/* ================ GET ================ */
export async function GET() {
  const graph = await loadGraph();
  return NextResponse.json(graph);
}

/* ================ POST (add) ================ */
export async function POST(req: Request) {  
  const body = await req.json();
  const graph = await loadGraph();

  const newNodes = Array.isArray(body.nodes) ? body.nodes : [];
  const newEdges = Array.isArray(body.edges) ? body.edges : [];

  // Add nodes (no duplicates)
  for (const n of newNodes) {
    if (!graph.nodes.find((x) => x.data.id === n.data.id)) {
      graph.nodes.push({
        data: { id: n.data.id, label: n.data.label ?? n.data.id },
      });
    }
  }

  // Add edges (no duplicates)
  for (const e of newEdges) {
    const exists = graph.edges.find(
      (x) =>
        x.data.source === e.data.source && x.data.target === e.data.target
    );
    if (!exists) graph.edges.push(e);
  }

  await saveGraph(graph);
  return NextResponse.json(graph);
}

/* ================ DELETE ================ */
export async function DELETE(req: Request) {
  const { type, id } = await req.json();
  const graph = await loadGraph();
  console.log(type, id);
  

  if (type === "node") {
    graph.nodes = graph.nodes.filter((n) => n.data.id != id);
    graph.edges = graph.edges.filter(
      (e) => e.data.source !== id && e.data.target != id
    );
  }

  if (type === "edge") {
    const [source, target] = id.split("-");
    graph.edges = graph.edges.filter(
      (e) => !(e.data.source == source && e.data.target == target)
    );
  }

  await saveGraph(graph);
  return NextResponse.json(graph);
}

/* ================ PUT (replace entire graph) ================ */
export async function PUT(req: Request) {
  const body = await req.json();
  const graph: Graph = {
    nodes: body.nodes ?? [],
    edges: body.edges ?? [],
  };

  await saveGraph(graph);
  return NextResponse.json(graph);
}
