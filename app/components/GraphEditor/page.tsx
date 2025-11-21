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

const postJSON = async (url: string, body: unknown) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const ct = res.headers.get("content-type") || ""
    return ct.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => null)
  } catch {
    return null
  }
}

const GraphEditor: React.FC<Props> = ({ onSaved }) => {
  const [open, setOpen] = useState(false)
  const [node, setNode] = useState<NodePayload>({ id: "", label: "" })
  const [edge, setEdge] = useState<EdgePayload>({ source: "", target: "", weight: 0 })
  const [deleteItem, setDeleteItem] = useState<DeletePayload>({ type: "node", id: "" })
  const [bfsStart, setBfsStart] = useState("")
  const [dfsStart, setDfsStart] = useState("")
  const [widest, setWidest] = useState({ src: "", dest: "" })

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto"
    return () => { document.body.style.overflow = "auto" }
  }, [open])

  const toggle = () => setOpen((s) => !s)
  const close = () => setOpen(false)

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault()
    await postJSON("/api/graph", { nodes: [{ data: node }] })
    setNode({ id: "", label: "" })
    onSaved?.()
  }

  const handleAddEdge = async (e: React.FormEvent) => {
    e.preventDefault()
    await postJSON("/api/graph", { edges: [{ data: edge }] })
    setEdge({ source: "", target: "", weight: 0 })
    onSaved?.()
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    await postJSON("/api/graph", deleteItem)
    setDeleteItem((prev) => ({ ...prev, id: "" }))
    onSaved?.()
  }

  const handleAlgorithm = async (payload: AlgorithmPayload) => {
    postJSON("/api/algorithms", payload).catch(() => { })
    if (typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("graph-algorithm-request", { detail: payload }))


    if ("start" in payload) {
      payload.type === "bfs" ? setBfsStart("") : setDfsStart("")
    } else if ("src" in payload && "dest" in payload) {
      setWidest({ src: "", dest: "" })
    }


  }

  return (
    <> <button aria-label="Toggle sidebar" onClick={toggle} className="fixed top-4 left-4 z-60 p-2 rounded bg-gray-800 text-white"> <Menu /> </button>


      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={close} />}

      <aside
        className={`graph-sidebar fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 350 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full bg-gray-900 text-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Graph Editor</h2>

          <form onSubmit={handleAddNode} className="mb-6 space-y-2">
            <h3 className="font-medium">Add Node</h3>
            <input placeholder="Node ID" value={node.id} onChange={(e) => setNode({ ...node, id: e.target.value })} required className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
            <input placeholder="Node Label" value={node.label} onChange={(e) => setNode({ ...node, label: e.target.value })} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded">Add Node</button>
          </form>

          <form onSubmit={handleAddEdge} className="mb-6 space-y-2">
            <h3 className="font-medium">Add Edge</h3>
            <input placeholder="Source Node ID" value={edge.source} onChange={(e) => setEdge({ ...edge, source: e.target.value })} required className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
            <input placeholder="Target Node ID" value={edge.target} onChange={(e) => setEdge({ ...edge, target: e.target.value })} required className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
            <input type="number" placeholder="Weight" value={edge.weight} onChange={(e) => setEdge({ ...edge, weight: e.target.value === "" ? 0 : Number(e.target.value) })} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded">Add Edge</button>
          </form>

          <form onSubmit={handleDelete} className="mb-6 space-y-2">
            <h3 className="font-medium">Delete Node / Edge</h3>
            <select value={deleteItem.type} onChange={(e) => setDeleteItem({ ...deleteItem, type: e.target.value as "node" | "edge" })} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600">
              <option value="node">Node</option>
              <option value="edge">Edge</option>
            </select>
            <input placeholder={deleteItem.type === "node" ? "Node ID" : "source-target"} value={deleteItem.id} onChange={(e) => setDeleteItem({ ...deleteItem, id: e.target.value })} required className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded">Delete</button>
          </form>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium">BFS</h3>
              <input placeholder="Start node" value={bfsStart} onChange={(e) => setBfsStart(e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
              <button type="button" onClick={() => bfsStart && handleAlgorithm({ type: "bfs", start: bfsStart })} className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-1">Run BFS</button>
            </div>

            <div>
              <h3 className="font-medium">DFS</h3>
              <input placeholder="Start node" value={dfsStart} onChange={(e) => setDfsStart(e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
              <button type="button" onClick={() => dfsStart && handleAlgorithm({ type: "dfs", start: dfsStart })} className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-1">Run DFS</button>
            </div>

            <div>
              <h3 className="font-medium">Widest Path</h3>
              <input placeholder="Source node" value={widest.src} onChange={(e) => setWidest({ ...widest, src: e.target.value })} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
              <input placeholder="Destination node" value={widest.dest} onChange={(e) => setWidest({ ...widest, dest: e.target.value })} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
              <button type="button" onClick={() => widest.src && widest.dest && handleAlgorithm({ type: "widest", src: widest.src, dest: widest.dest })} className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-1">Run Widest Path</button>
            </div>
          </div>
        </div>
      </aside>

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
