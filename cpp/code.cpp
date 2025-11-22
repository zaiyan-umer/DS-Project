// main.cpp
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <queue>
#include <map>
#include <set>
#include <algorithm>
#include <limits>
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

// Graph structure using adjacency list
struct Edge {
    string to;
    int weight;
};

typedef map<string, vector<Edge>> Graph;

// Fixed file paths
const string GRAPH_PATH = "../data/graph.json";
const string RESULTS_PATH = "../data/results.json";

// Build adjacency list from JSON (undirected graph)
Graph buildGraph(const json& graphData) {
    Graph adj;
    
    // Initialize adjacency list for all nodes
    for (const auto& node : graphData["nodes"]) {
        string id = node["data"]["id"];
        adj[id] = vector<Edge>();
    }
    
    // Add edges (undirected - add both directions)
    for (const auto& edge : graphData["edges"]) {
        string source = edge["data"]["source"];
        string target = edge["data"]["target"];
        int weight = edge["data"]["weight"];
        
        adj[source].push_back({target, weight});
        adj[target].push_back({source, weight}); // undirected
    }
    
    return adj;
}

// BFS Algorithm
vector<string> bfs(const Graph& adj, const string& start) {
    set<string> visited;
    vector<string> order;
    queue<string> q;
    
    q.push(start);
    
    while (!q.empty()) {
        string node = q.front();
        q.pop();
        
        if (visited.count(node)) continue;
        
        visited.insert(node);
        order.push_back(node);
        
        for (const auto& edge : adj.at(node)) {
            if (!visited.count(edge.to)) {
                q.push(edge.to);
            }
        }
    }
    
    return order;
}

// DFS Algorithm
vector<string> dfs(const Graph& adj, const string& start) {
    set<string> visited;
    vector<string> order;
    
    function<void(const string&)> visit = [&](const string& node) {
        visited.insert(node);
        order.push_back(node);
        
        for (const auto& edge : adj.at(node)) {
            if (!visited.count(edge.to)) {
                visit(edge.to);
            }
        }
    };
    
    visit(start);
    return order;
}

// Widest Path Algorithm (Modified Dijkstra for maximum capacity)
struct WidestPathResult {
    vector<string> path;
    vector<json> edges;
    int capacity;
};

WidestPathResult widestPath(const Graph& adj, const string& src, const string& dest) {
    map<string, int> capacity;
    map<string, string> prev;
    
    // Initialize capacities to 0
    for (const auto& pair : adj) {
        capacity[pair.first] = 0;
    }
    capacity[src] = numeric_limits<int>::max();
    
    // Priority queue: (capacity, node) - max heap
    priority_queue<pair<int, string>> pq;
    pq.push({numeric_limits<int>::max(), src});
    
    while (!pq.empty()) {
        int cap = pq.top().first;
        string node = pq.top().second;
        pq.pop();
        
        if (cap < capacity[node]) continue;
        
        for (const auto& edge : adj.at(node)) {
            int newCap = min(cap, edge.weight);
            
            if (newCap > capacity[edge.to]) {
                capacity[edge.to] = newCap;
                prev[edge.to] = node;
                pq.push({newCap, edge.to});
            }
        }
    }
    
    WidestPathResult result;
    result.capacity = capacity[dest];
    
    // If no path exists
    if (capacity[dest] == 0) {
        return result;
    }
    
    // Reconstruct path
    string curr = dest;
    while (curr != src) {
        result.path.insert(result.path.begin(), curr);
        
        if (prev.count(curr)) {
            string from = prev[curr];
            json edge;
            edge["from"] = from;
            edge["to"] = curr;
            result.edges.insert(result.edges.begin(), edge);
            curr = from;
        } else {
            break;
        }
    }
    result.path.insert(result.path.begin(), src);
    
    return result;
}

// Read JSON file
json readJsonFile(const string& filepath) {
    ifstream file(filepath);
    if (!file.is_open()) {
        throw runtime_error("Could not open file: " + filepath);
    }
    
    json data;
    file >> data;
    file.close();
    return data;
}

// Write JSON file
void writeJsonFile(const string& filepath, const json& data) {
    ofstream file(filepath);
    if (!file.is_open()) {
        throw runtime_error("Could not write to file: " + filepath);
    }
    
    file << data.dump(2);
    file.close();
}

int main(int argc, char* argv[]) {
    try {
        // Check arguments
        // argv[1] = algorithm (bfs, dfs, widest)
        // argv[2] = start node (for bfs/dfs) OR src node (for widest)
        // argv[3] = dest node (for widest only)
        
        if (argc < 3) {
            cerr << "Usage:" << endl;
            cerr << "  BFS:    " << argv[0] << " bfs <start>" << endl;
            cerr << "  DFS:    " << argv[0] << " dfs <start>" << endl;
            cerr << "  Widest: " << argv[0] << " widest <src> <dest>" << endl;
            return 1;
        }
        
        string algorithm = argv[1];
        
        // Read graph data
        json graphData = readJsonFile(GRAPH_PATH);
        Graph adj = buildGraph(graphData);
        
        json results;
        
        if (algorithm == "bfs") {
            if (argc < 3) {
                cerr << "Error: BFS requires start node" << endl;
                return 1;
            }
            string start = argv[2];
            vector<string> order = bfs(adj, start);
            results["bfs_order"] = order;
            
        } else if (algorithm == "dfs") {
            if (argc < 3) {
                cerr << "Error: DFS requires start node" << endl;
                return 1;
            }
            string start = argv[2];
            vector<string> order = dfs(adj, start);
            results["dfs_order"] = order;
            
        } else if (algorithm == "widest") {
            if (argc < 4) {
                cerr << "Error: Widest path requires src and dest nodes" << endl;
                return 1;
            }
            string src = argv[2];
            string dest = argv[3];
            WidestPathResult result = widestPath(adj, src, dest);
            
            results["widest_path"] = result.path;
            results["widest_path_edges"] = result.edges;
            results["widest_path_capacity"] = result.capacity;
            
        } else {
            cerr << "Unknown algorithm: " << algorithm << endl;
            return 1;
        }
        
        // Write results to fixed path
        writeJsonFile(RESULTS_PATH, results);
        
        cout << "Algorithm '" << algorithm << "' completed successfully" << endl;
        return 0;
        
    } catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }
}