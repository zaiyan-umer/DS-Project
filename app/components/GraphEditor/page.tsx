"use client"

import React, { useState, useEffect } from "react"
import { Menu } from "lucide-react"

type Props = { onSaved?: () => void }

type NodePayload = { id: string; label?: string }
type EdgePayload = { source: string; target: string; weight: number }

type DeletePayload = { type: "node" | "edge"; id: string }
type AlgorithmPayload =
| { type: "bfs" | "dfs"; start: string }
| { type: "widest"; src: string; dest: string }

const GraphEditor: React.FC<Props> = ({ onSaved }) => {
const [open, setOpen] = useState(false)

// Node / Edge / Delete states
const [node, setNode] = useState<NodePayload>({ id: "", label: "" })
const [edge, setEdge] = useState<EdgePayload>({ source: "", target: "", weight: 0 })
const [deleteItem, setDeleteItem] = useState<DeletePayload>({ type: "node", id: "" })

// Algorithm states
const [bfsStart, setBfsStart] = useState("")
const [dfsStart, setDfsStart] = useState("")
const [widest, setWidest] = useState({ src: "", dest: "" })

const toggle = () => setOpen((s) => !s)
const close = () => setOpen(false)

// --- Helper fetch functions ---
async function postJSON(url: string, body: unknown) {
await fetch(url, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(body),
})
}

async function deleteJSON(url: string, body: unknown) {
await fetch(url, {
method: "DELETE",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(body),
})
}

// --- Submit Handlers ---
const handleAddNode = async (e: React.FormEvent) => {
e.preventDefault()
await postJSON("/api/graph", { nodes: [{ data: node }] })
setNode({ id: "", label: "" })
  if (onSaved) onSaved();
}

const handleAddEdge = async (e: React.FormEvent) => {
e.preventDefault()
await postJSON("/api/graph", { edges: [{ data: edge }] })
setEdge({ source: "", target: "", weight: 0 })
  if (onSaved) onSaved();
}

const handleDelete = async (e: React.FormEvent) => {
e.preventDefault()
await deleteJSON("/api/graph", deleteItem)
setDeleteItem((prev) => ({ ...prev, id: "" }))
  if (onSaved) onSaved();
}

const handleAlgorithm = async (payload: AlgorithmPayload) => {
await postJSON("/api/algorithm", payload)
if ("start" in payload) {
if (payload.type === "bfs") setBfsStart("")
if (payload.type === "dfs") setDfsStart("")
} else if ("src" in payload && "dest" in payload) {
setWidest({ src: "", dest: "" })
}
}

// Save callback
const saveGraph = async () => {
// ...save logic...
if (onSaved) onSaved()
}

// Disable body scroll when sidebar open
useEffect(() => {
document.body.style.overflow = open ? "hidden" : "auto"
return () => {
document.body.style.overflow = "auto"
}
}, [open])

return (
<>
{/* Hamburger button */} <button
     aria-label="Toggle sidebar"
     onClick={toggle}
     className="fixed top-4 left-4 z-60 p-2 rounded bg-gray-800 text-white"
   > <Menu /> </button>

```
  {/* Overlay */}
  {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={close} />}

  {/* Sidebar */}
  <aside
    className={`graph-sidebar fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
      open ? "translate-x-0" : "-translate-x-full"
    }`}
    style={{ width: 350 }}
    onClick={(e) => e.stopPropagation()}
  >
    <div className="h-full bg-gray-900 text-white p-6">
      <h2 className="text-xl font-semibold mb-4 text-center">Graph Editor</h2>

      {/* Add Node */}
      <form onSubmit={handleAddNode} className="mb-6 space-y-2">
        <h3 className="mb-2 font-medium">Add Node</h3>
        <input
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          placeholder="Node ID"
          value={node.id}
          onChange={(e) => setNode({ ...node, id: e.target.value })}
          required
        />
        <input
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          placeholder="Node Label"
          value={node.label}
          onChange={(e) => setNode({ ...node, label: e.target.value })}
        />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded">
          Add Node
        </button>
      </form>

      {/* Add Edge */}
      <form onSubmit={handleAddEdge} className="mb-6 space-y-2">
        <h3 className="mb-2 font-medium">Add Edge</h3>
        <input
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          placeholder="Source Node ID"
          value={edge.source}
          onChange={(e) => setEdge({ ...edge, source: e.target.value })}
          required
        />
        <input
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          placeholder="Target Node ID"
          value={edge.target}
          onChange={(e) => setEdge({ ...edge, target: e.target.value })}
          required
        />
        <input
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          placeholder="Weight"
          type="number"
          value={edge.weight}
          onChange={(e) =>
            setEdge({ ...edge, weight: e.target.value === "" ? 0 : Number(e.target.value) })
          }
        />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded">
          Add Edge
        </button>
      </form>

      {/* Delete */}
      <form onSubmit={handleDelete} className="mb-6 space-y-2">
        <h3 className="mb-2 font-medium">Delete Node / Edge</h3>
        <select
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          value={deleteItem.type}
          onChange={(e) => setDeleteItem({ ...deleteItem, type: e.target.value as "node" | "edge" })}
        >
          <option value="node">Node</option>
          <option value="edge">Edge</option>
        </select>
        <input
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          placeholder={deleteItem.type === "node" ? "Node ID" : "source-target"}
          value={deleteItem.id}
          onChange={(e) => setDeleteItem({ ...deleteItem, id: e.target.value })}
          required
        />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded">
          Delete
        </button>
      </form>

      {/* BFS / DFS / Widest Path */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (bfsStart) handleAlgorithm({ type: "bfs", start: bfsStart })
          if (dfsStart) handleAlgorithm({ type: "dfs", start: dfsStart })
          if (widest.src && widest.dest) handleAlgorithm({ type: "widest", src: widest.src, dest: widest.dest })
        }}
        className="space-y-4"
      >
        {/* BFS */}
        <div>
          <h3 className="mb-2 font-medium">BFS</h3>
          <input
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            placeholder="Start node"
            value={bfsStart}
            onChange={(e) => setBfsStart(e.target.value)}
          />
          <button
            type="button"
            onClick={() => bfsStart && handleAlgorithm({ type: "bfs", start: bfsStart })}
            className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-1"
          >
            Run BFS
          </button>
        </div>

        {/* DFS */}
        <div>
          <h3 className="mb-2 font-medium">DFS</h3>
          <input
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            placeholder="Start node"
            value={dfsStart}
            onChange={(e) => setDfsStart(e.target.value)}
          />
          <button
            type="button"
            onClick={() => dfsStart && handleAlgorithm({ type: "dfs", start: dfsStart })}
            className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-1"
          >
            Run DFS
          </button>
        </div>

        {/* Widest Path */}
        <div>
          <h3 className="mb-2 font-medium">Widest Path</h3>
          <input
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            placeholder="Source node"
            value={widest.src}
            onChange={(e) => setWidest({ ...widest, src: e.target.value })}
          />
          <input
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            placeholder="Destination node"
            value={widest.dest}
            onChange={(e) => setWidest({ ...widest, dest: e.target.value })}
          />
          <button
            type="button"
            onClick={() => widest.src && widest.dest && handleAlgorithm({ type: "widest", src: widest.src, dest: widest.dest })}
            className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-1"
          >
            Run Widest Path
          </button>
        </div>
      </form>
    </div>
  </aside>

  {/* Scrollbar hiding */}
  <style>{`
    .graph-sidebar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .graph-sidebar::-webkit-scrollbar {
      width: 0;
      height: 0;
      background: transparent;
    }
  `}</style>
</>
)
}

GraphEditor.displayName = "GraphEditor"

export default GraphEditor
