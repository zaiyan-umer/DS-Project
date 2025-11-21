"use client"
import React, { useState, useCallback } from "react"
import GraphEditor from "../GraphEditor/page"
import Graph from "../Graph/page"

export default function GraphWrapper() {
  const [reloadCounter, setReloadCounter] = useState(0)
  const onGraphSaved = useCallback(() => setReloadCounter((c) => c + 1), [])

  return (
    <div>
      <GraphEditor onSaved={onGraphSaved} />
      <main>
        <Graph reload={reloadCounter} />
      </main>
    </div>
  )
}