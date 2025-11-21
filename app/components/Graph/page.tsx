"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import cytoscape, { Core, ElementDefinition } from "cytoscape";

export type GraphHandle = {
  runBFS: (start: string) => Promise<void>;
  runDFS: (start: string) => Promise<void>;
  runWidest: (src: string, dest: string) => Promise<void>;
};

export type GraphProps = {
  reload?: number; // Increment to reload graph
};

type NodeData = { id: string; label?: string };
type EdgeData = { id: string; source: string; target: string; weight: number };

type GraphData = {
  nodes?: { data: NodeData }[];
  edges?: { data: EdgeData }[];
};

// Simple sleep helper for highlighting animation
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const Graph = forwardRef<GraphHandle, GraphProps>(({ reload }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  // ------------------------------
  // Load graph from backend
  // ------------------------------
  async function loadGraph() {
    const cy = cyRef.current;
    if (!cy) return;

    const res = await fetch("/api/graph");
    const data: GraphData = await res.json();

    const elements: ElementDefinition[] = [];

    for (const n of data.nodes ?? []) {
      if (n?.data?.id) {
        elements.push({ data: { id: n.data.id, label: n.data.label ?? n.data.id } });
      }
    }

    for (const e of data.edges ?? []) {
      const { source, target, weight } = e.data;
      if (source && target) {
        elements.push({
          data: { id: `${source}-${target}`, source, target, weight },
        });
      }
    }

    cy.elements().remove();
    cy.add(elements);
    cy.layout({ name: "cose" }).run();
  }

  // ------------------------------
  // Highlight helpers
  // ------------------------------
  async function highlightNodes(ids: string[]) {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().removeClass("highlight");
    for (const id of ids) {
      cy.$(`#${id}`).addClass("highlight");
      await sleep(500);
    }
  }

  async function highlightEdges(edges: { from: string; to: string }[]) {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().removeClass("highlight");
    for (const e of edges) {
      cy.$(`#${e.from}-${e.to}`).addClass("highlight");
      await sleep(500);
    }
  }

  // ------------------------------
  // Algorithm API functions
  // ------------------------------
  async function runBFS(start: string) {
    const res = await fetch(`/api/run/bfs?start=${start}`);
    const data = await res.json();
    await highlightNodes(Array.isArray(data.bfs_order) ? data.bfs_order.map(String) : []);
  }

  async function runDFS(start: string) {
    const res = await fetch(`/api/run/dfs?start=${start}`);
    const data = await res.json();
    await highlightNodes(Array.isArray(data.dfs_order) ? data.dfs_order.map(String) : []);
  }

  async function runWidest(src: string, dest: string) {
    const res = await fetch(`/api/run/widest?src=${src}&dest=${dest}`);
    const data = await res.json();
    await highlightNodes(Array.isArray(data.widest_path) ? data.widest_path.map(String) : []);
    await highlightEdges(Array.isArray(data.widest_path_edges) ? data.widest_path_edges : []);
  }

  // ------------------------------
  // Expose API to parent via ref
  // ------------------------------
  useImperativeHandle(ref, () => ({
    runBFS,
    runDFS,
    runWidest,
  }));

  // ------------------------------
  // Initialize Cytoscape on mount & reload
  // ------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy old instance if exists
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#2563eb",
            label: "data(label)",
            color: "white",
            "text-valign": "center",
            "text-halign": "center",
          },
        },
        {
          selector: "edge",
          style: {
            label: "data(weight)",
            "line-color": "#9ca3af",
            "target-arrow-color": "#9ca3af",
            "target-arrow-shape": "triangle",
            width: 3,
            "curve-style": "bezier",
            color: "#9ca3af",
          },
        },
        {
          selector: ".highlight",
          style: {
            "background-color": "#22c55e",
            "line-color": "#22c55e",
            "target-arrow-color": "#22c55e",
            width: 6,
          },
        },
      ],
      layout: { name: "cose" },
    });

    loadGraph().catch((err) => console.error("Failed to load graph:", err));

    return () => {
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, [reload]); // <-- reload dependency triggers full reload

  // ------------------------------
  // Render container
  // ------------------------------
  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-lg border border-gray-700">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});

Graph.displayName = "Graph";
export default Graph;
