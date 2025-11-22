// app/api/algorithms/route.ts
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { readFile } from "fs/promises";

const execPromise = promisify(exec);

// File paths
const RESULTS_PATH = path.join(process.cwd(), "..", "..", "data", "results.json");
const CPP_EXECUTABLE = path.join(process.cwd(), "..", "..", "cpp", "code");

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input and build command
    let command = `"${CPP_EXECUTABLE}"`;

    if (body.type === "bfs") {
      if (!body.start) {
        return NextResponse.json(
          { error: "Missing 'start' parameter for BFS" },
          { status: 400 }
        );
      }
      command += ` bfs ${body.start}`;
      
    } else if (body.type === "dfs") {
      if (!body.start) {
        return NextResponse.json(
          { error: "Missing 'start' parameter for DFS" },
          { status: 400 }
        );
      }
      command += ` dfs ${body.start}`;
      
    } else if (body.type === "widest") {
      if (!body.src || !body.dest) {
        return NextResponse.json(
          { error: "Missing 'src' or 'dest' parameter for widest path" },
          { status: 400 }
        );
      }
      command += ` widest ${body.src} ${body.dest}`;
      
    } else {
      return NextResponse.json(
        { error: "Invalid algorithm type. Use: bfs, dfs, or widest" },
        { status: 400 }
      );
    }

    // Execute C++ program
    console.log(`Executing: ${command}`);
    console.log("HELLOOOOO");
    await execPromise(command);

    // Read results from results.json
    console.log("HIIII");
    const resultContent = await readFile(RESULTS_PATH, "utf-8");
    console.log("BYEE");
    
    const results = JSON.parse(resultContent);

    // Return results in the expected format
    if (body.type === "bfs") {
      return NextResponse.json({ bfs_order: results.bfs_order });
    } else if (body.type === "dfs") {
      return NextResponse.json({ dfs_order: results.dfs_order });
    } else if (body.type === "widest") {
      return NextResponse.json({
        widest_path: results.widest_path,
        widest_path_edges: results.widest_path_edges,
        widest_path_capacity: results.widest_path_capacity,
      });
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    
  } catch (err: any) {
    console.error("Algorithm execution error:", err);
    return NextResponse.json(
      { error: err.message || "Algorithm execution failed" },
      { status: 500 }
    );
  }
}