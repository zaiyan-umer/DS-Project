"use client";

import React, { forwardRef, useEffect, useRef, useImperativeHandle } from "react";
import cytoscape, { Core, ElementDefinition } from "cytoscape";

export type GraphHandle = {
  runBFS: (start: string) => Promise<void>;
  runDFS: (start: string) => Promise<void>;
  runWidest: (src: string, dest: string) => Promise<void>;
};

export type GraphProps = {
  reload?: number;
};

type NodeData = { id: string; label?: string };
type EdgeData = { id: string; source: string; target: string; weight: number };

type GraphData = {
  nodes?: { data: NodeData }[];
  edges?: { data: EdgeData }[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const Graph = forwardRef<GraphHandle, GraphProps>(({ reload }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  async function loadGraph() {
    const cy = cyRef.current;
    if (!cy) return;


    const res = await fetch("/api/graph");
    const data: GraphData = await res.json();

    const elements: ElementDefinition[] = [];

    for (const n of data.nodes ?? []) {
      if (n?.data?.id) elements.push({ data: { id: n.data.id, label: n.data.label ?? n.data.id } });
    }

    for (const e of data.edges ?? []) {
      const { source, target, weight } = e.data;
      if (source && target) elements.push({ data: { id: `${source}-${target}`, source, target, weight } });
    }

    cy.elements().remove();
    cy.add(elements);
    cy.layout({ name: "cose" }).run();


  }

  async function highlightNodes(ids: string[]) {
    const cy = cyRef.current;
    if (!cy) return;

    // only remove node highlights (no debug classes)
    cy.elements().removeClass("node-highlight");

    for (const id of ids) {
      const el = cy.getElementById(id);
      if (el.empty()) continue;

      // add highlight while animating, then remove so node returns to normal
      el.addClass("node-highlight");
      try { cy.animate({ center: { eles: el }, duration: 250 }); } catch { }
      await sleep(600);
      el.removeClass("node-highlight");
    }
  }

  async function highlightEdges(edges: { from: string; to: string }[]) {
    const cy = cyRef.current;
    if (!cy) return;

    // clear previous edge highlights so new run sets fresh state
    cy.elements().removeClass("edge-highlight");

    for (const e of edges) {
      const el = cy.getElementById(`${e.from}-${e.to}`);
      if (el.empty()) continue;

      // keep edge-highlight after the step so edges remain green
      el.addClass("edge-highlight");
      try { cy.animate({ center: { eles: el }, duration: 250 }); } catch { }
      await sleep(600);
      // do NOT remove edge-highlight -> edges stay highlighted
    }
  }

  const runBFS = async (start: string) => {
    try {
      const res = await fetch("/api/algorithms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bfs", start }),
      });
      const payload = await res.json().catch(() => null);
      const data = payload?.data ?? payload;
      const order: string[] = Array.isArray(data?.bfs_order) ? data.bfs_order : Array.isArray(data?.order) ? data.order : [];
      if (order.length) await highlightNodes(order);
      return order;
    } catch { }
  };

  const runDFS = async (start: string) => {
    try {
      const res = await fetch("/api/algorithms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "dfs", start }) });
      const payload = await res.json().catch(() => null);
      const data = payload?.data ?? payload;
      const order: string[] = data?.dfs_order ?? data?.order ?? [];
      await highlightNodes(order);
    } catch { }
  };

  const runWidest = async (src: string, dest: string) => {
    try {
      const res = await fetch("/api/algorithms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "widest", src, dest }) });
      const payload = await res.json().catch(() => null);
      const data = payload?.data ?? payload;
      await highlightNodes(data?.widest_path ?? data?.path ?? []);
      await highlightEdges(data?.widest_path_edges ?? data?.path_edges ?? []);
    } catch { }
  };

  useImperativeHandle(ref, () => ({ runBFS, runDFS, runWidest }));

  useEffect(() => {
    function handler(e: any) {
      const detail = e?.detail ?? {};
      const t = detail.type;
      if (t === "bfs") runBFS(detail.start);
      else if (t === "dfs") runDFS(detail.start);
      else if (t === "widest") runWidest(detail.src, detail.dest);
    }
    window.addEventListener("graph-algorithm-request", handler);
    return () => window.removeEventListener("graph-algorithm-request", handler);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    cyRef.current?.destroy();
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        // base node: blue with white border
        {
          selector: "node",
          style: {
            "background-color": "#2563eb",
            label: "data(label)",
            color: "white",
            "text-valign": "center",
            "text-halign": "center",
            width: 30,
            height: 30,
            "border-width": 2,
            "border-color": "#ffffff",
            "z-index": 1,
          },
        },

        // base edge: white thin line + white arrows
        {
          selector: "edge",
          style: {
            label: "data(weight)",
            "line-color": "#ffffff",
            "target-arrow-color": "#ffffff",
            "target-arrow-shape": "triangle",
            width: 3,
            "curve-style": "bezier",
            color: "#ffffff",
            "z-index": 0,
          },
        },

        // Node highlight during animation: scale up, turn red, keep white border
        {
          selector: "node.node-highlight",
          style: {
            "background-color": "#ff0044",
            width: 56,
            height: 56,
            "border-width": 4,
            "border-color": "#ffffff",
            "z-index": 9999,
          },
        },

        // Edge highlight after animation: turn green and slightly thicker
        {
          selector: "edge.edge-highlight",
          style: {
            "line-color": "#22c55e",
            "target-arrow-color": "#22c55e",
            width: 6, // slightly thicker than base 3
            "z-index": 9998,
          },
        },
      ],
      layout: { name: "cose" },
    });
    loadGraph().catch(() => { });
    return () => { cyRef.current?.destroy(); cyRef.current = null; };
  }, [reload]);

  return (<div className="w-full h-[600px] bg-gray-900 rounded-lg border border-gray-700 relative">
    <div style={{ position: "absolute", top: 8, right: 8, zIndex: 9999 }}>
      <button
        onClick={() => loadGraph()}
        style={{ background: "#2563eb", color: "white", padding: "6px 8px", borderRadius: 6 }}
      >
        Reload Graph </button> </div> <div ref={containerRef} className="w-full h-full" /> </div>
  );
});

Graph.displayName = "Graph";
export default Graph;
