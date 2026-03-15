# PowFL — Power Flow Simulation Tool

A browser-based power flow study environment. Build electrical network diagrams interactively, inspect topology health in real time, and dispatch the network to a solver backend that returns per-bus voltages and per-branch loading results.

The frontend is a fully self-contained React/TypeScript application. The backend is a FastAPI service whose solver stub is designed to be swapped for [pandapower](https://www.pandapower.org/) or any compatible Newton-Raphson implementation.

---

## Features

- **Drag-and-drop canvas** — place Bus, Load, Generator, and Transformer nodes onto a ReactFlow canvas and wire them together.
- **Four node variants** — `Slack` (reference bus), `PV` (generator bus), `PQ` (load bus), and a `transformerNode` that bridges two voltage levels.
- **Live topology analysis** — every edit triggers a BFS-based connectivity scan that identifies connected islands, orphan nodes, missing Slack buses, and duplicate Slack buses.
- **Network readiness gate** — the "Run Simulation" button only activates when the topology report contains no errors and no isolated nodes.
- **Y-bus preparation** — a dedicated utility converts the canvas graph into series admittances and shunt susceptances, with tap-corrected transformer entries.
- **Payload generation** — physical impedance values (Ω, S) are normalised to per-unit on a 100 MVA base before being sent to the backend.
- **Multi-island support** — disconnected sub-networks are solved independently; each island carries its own bus and branch lists.
- **Properties panel** — click any node or edge to edit its electrical parameters inline.
- **Simulation result overlay** — solved bus voltages (`v_mag_pu`, `v_ang_deg`) are written back to the canvas nodes after a successful run.

---

## Tech Stack

### Frontend

| Package | Version | Role |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.8 | Type safety |
| ReactFlow | 11 | Interactive graph canvas |
| Zustand | 5 | Global state store |
| Tailwind CSS | 4 | Utility-first styling (Vite plugin) |
| Vite | 6 | Dev server and bundler |
| lucide-react | 0.513 | Icon set |

### Backend

| Package | Version | Role |
|---|---|---|
| FastAPI | >=0.111 | HTTP API framework |
| Uvicorn | >=0.30 | ASGI server |
| Pydantic | >=2.7 | Request/response validation |

---

## Project Structure

```
powfl/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI app and /calculate-power-flow endpoint
│   ├── models.py            # Pydantic request and response models
│   └── requirements.txt
├── src/
│   ├── api/
│   │   └── powerFlowApi.ts  # fetch wrapper — POST /api/calculate-power-flow
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── FlowCanvas.tsx       # ReactFlow root, drag-drop handlers
│   │   │   └── NetworkStatus.tsx    # Topology error/warning badges + run button
│   │   ├── edges/
│   │   │   └── TransmissionEdge.tsx # Custom edge renderer
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Top-level layout
│   │   │   ├── PropertiesPanel.tsx  # Right-hand inspector panel
│   │   │   └── Toolbox.tsx          # Left-hand node palette
│   │   ├── nodes/
│   │   │   ├── BusNode.tsx
│   │   │   └── TransformerNode.tsx
│   │   └── properties/
│   │       ├── BusProperties.tsx
│   │       ├── EdgeProperties.tsx
│   │       └── TransformerProperties.tsx
│   ├── store/
│   │   └── useFlowStore.ts   # Zustand store — nodes, edges, topology, simulation
│   ├── types/
│   │   ├── index.ts          # BusNodeData, TransformerNodeData, TransmissionEdgeData
│   │   ├── topology.ts       # NetworkIsland, TopologyReport
│   │   └── powerFlow.ts      # Payload and result shapes (TypeScript mirror of models.py)
│   └── utils/
│       ├── nodeFactory.ts    # Default-valued node constructors
│       ├── payloadGenerator.ts  # Canvas graph → PowerFlowPayload (with p.u. conversion)
│       ├── topologyEngine.ts    # BFS island detection and validation
│       └── ybusPrep.ts          # Y-bus admittance matrix preparation
├── package.json
└── vite.config.ts            # Vite proxy: /api/* → http://localhost:8000/*
```

---

## Prerequisites

- **Node.js** 20 or later (LTS recommended)
- **npm** 10 or later
- **Python** 3.11 or later
- A Python virtual-environment tool (`venv`, `conda`, etc.)

---

## Installation

### Frontend

```bash
cd powfl
npm install
```

### Backend

```bash
cd powfl/backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

## Running the App

Both servers must be running at the same time. Open two terminal tabs.

**Terminal 1 — backend (port 8000)**

```bash
cd powfl/backend
source .venv/bin/activate
uvicorn main:app --reload
```

**Terminal 2 — frontend dev server (port 5173)**

```bash
cd powfl
npm run dev
```

Open `http://localhost:5173` in your browser.

The Vite dev server proxies every request matching `/api/*` to `http://localhost:8000`, stripping the `/api` prefix. The frontend therefore calls `/api/calculate-power-flow`, which lands at `POST /calculate-power-flow` on FastAPI.

> **Note:** The backend currently returns a placeholder response (all voltages at 1.0 pu, all branch flows at 0). Replace the solver logic in `backend/main.py` with a pandapower call to get real results. See [Connecting a Real Solver](#connecting-a-real-solver) below.

---

## How to Use

### Basic workflow

1. **Add nodes** — drag items from the left-hand Toolbox onto the canvas. Available types: Bus, Load, Generator, Transformer.
2. **Connect nodes** — hover a node to reveal its handles, then drag from one handle to another to create a transmission line edge.
3. **Set parameters** — click any node or edge to open the Properties panel on the right. For buses, set the bus type (`Slack`, `PV`, or `PQ`), nominal voltage, generation, and load. For edges, set resistance (Ω), reactance (Ω), susceptance (S), and thermal rating (MVA). For transformers, set primary/secondary voltage, tap ratio, series reactance, and MVA rating.
4. **Check topology** — the status bar in the bottom-left of the canvas updates live. Errors appear for missing or duplicate Slack buses. Warnings appear for isolated (unconnected) nodes.
5. **Run the simulation** — once the status bar shows "Network Ready", click **Run Simulation**. Results are written back to the bus nodes (voltage magnitude and angle).

### Node types and bus classifications

| Toolbox item | Underlying type | Default bus class | Typical use |
|---|---|---|---|
| Bus | `busNode` | PQ | Generic bus bar |
| Load | `busNode` (load variant) | PQ | Demand point, pre-filled with 10 MW load |
| Generator | `busNode` (generator variant) | PV | Dispatchable generation, pre-filled with 50 MW output |
| Transformer | `transformerNode` | — | Connects two buses at different voltage levels; must be wired to exactly two bus nodes |

Every connected island must contain exactly one `Slack` bus. The Slack bus sets the voltage reference (angle = 0°) for that island.

---

## Architecture and Data Flow

The pipeline from canvas edit to simulation result has five distinct stages.

```
User edit on canvas
       |
       v
 useFlowStore (Zustand)
  - nodes[], edges[]
       |
       v
 topologyEngine.ts  ── analyzeTopology() ──>  TopologyReport
  - BFS over adjacency map
  - island detection
  - Slack bus validation
  - isReadyForCalculation flag
       |
       v (only when isReadyForCalculation === true)
 payloadGenerator.ts  ── generatePowerFlowPayload() ──>  PowerFlowPayload
  - separates transformer edges from line edges
  - groups transformer edges by transformerNode to reconstruct the two-bus branch
  - converts physical R/X/B (Ω/S) to per-unit on S_BASE = 100 MVA
  - tap-corrects transformer reactance
       |
       v
 powerFlowApi.ts  ── POST /api/calculate-power-flow ──>  FastAPI backend
  - JSON body validated by Pydantic PowerFlowRequest
       |
       v
 backend/main.py  ── calculate_power_flow()
  - currently: returns placeholder (v=1.0, flows=0)
  - intended: Newton-Raphson via pandapower
       |
       v
 PowerFlowResponse  (JSON)
  - status, message
  - per-island: converged flag, bus results, branch results
       |
       v
 useFlowStore.runSimulation()
  - maps BusResult.id back to canvas nodes
  - writes v_mag_pu and v_ang_deg into node data
  - triggers a final topology re-analysis on the updated nodes
```

### Key design decisions

**Topology analysis on every mutation.** `setNodes`, `setEdges`, and `updateNodeData` all call `analyzeTopology` synchronously inside the Zustand setter. This keeps `topologyReport` always consistent with the current graph without requiring an explicit "validate" step.

**Transformer as a first-class node, not an edge attribute.** A transformer is placed as a `transformerNode` on the canvas and connected to two bus nodes via ordinary edges. The payload generator reconstructs the two-bus branch by collecting all edges adjacent to the transformer node. This lets transformers carry their own properties (tap ratio, x_pu, ratings) independent of the edge schema.

**Physical units in the canvas, per-unit on the wire.** Bus and edge parameters are stored in physical units (kV, MW, Mvar, Ω, S, MVA) throughout the frontend to keep the UI intuitive. Conversion to per-unit happens once, in `payloadGenerator.ts`, immediately before serialisation. The backend only ever sees per-unit quantities.

**Batch result application.** After a successful solver response, all bus node updates are applied in a single `set()` call to avoid triggering N intermediate topology re-analyses (one per node). A single re-analysis runs on the final updated node list.

---

## API Reference

### `POST /calculate-power-flow`

Accepts a complete network description in per-unit and returns per-bus voltages and per-branch power flows.

**Request body**

```json
{
  "s_base_mva": 100,
  "islands": [
    {
      "island_id": 0,
      "buses": [
        {
          "id": "node-1",
          "label": "Slack Bus",
          "type": "Slack",
          "v_nom_kv": 110,
          "v_mag_pu": 1.0,
          "v_ang_deg": 0.0,
          "p_gen_mw": 0,
          "q_gen_mvar": 0,
          "p_load_mw": 0,
          "q_load_mvar": 0
        },
        {
          "id": "node-2",
          "label": "Load Bus",
          "type": "PQ",
          "v_nom_kv": 110,
          "v_mag_pu": 1.0,
          "v_ang_deg": 0.0,
          "p_gen_mw": 0,
          "q_gen_mvar": 0,
          "p_load_mw": 50,
          "q_load_mvar": 10
        }
      ],
      "branches": [
        {
          "from_bus": "node-1",
          "to_bus": "node-2",
          "r_pu": 0.01,
          "x_pu": 0.1,
          "b_pu": 0.02,
          "rating_mva": 200,
          "is_transformer": false,
          "tap": 1.0
        }
      ]
    }
  ]
}
```

**Bus `type` values:** `"Slack"` | `"PV"` | `"PQ"`

**Branch fields:**
- `r_pu`, `x_pu`, `b_pu` — resistance, reactance, total charging susceptance, all in per-unit on `s_base_mva`
- `is_transformer` — when `true`, `r_pu` and `b_pu` are typically zero and `tap` carries the off-nominal ratio
- `tap` — per-unit tap ratio; use `1.0` for nominal lines

**Response body**

```json
{
  "status": "success",
  "message": "Converged in 4 iterations",
  "islands": [
    {
      "island_id": 0,
      "converged": true,
      "buses": [
        {
          "id": "node-1",
          "v_mag_pu": 1.0,
          "v_ang_deg": 0.0,
          "p_gen_mw": 52.3,
          "q_gen_mvar": 11.1
        },
        {
          "id": "node-2",
          "v_mag_pu": 0.974,
          "v_ang_deg": -2.1,
          "p_gen_mw": 0,
          "q_gen_mvar": 0
        }
      ],
      "branches": [
        {
          "from_bus": "node-1",
          "to_bus": "node-2",
          "p_from_mw": 52.3,
          "q_from_mvar": 11.1,
          "p_to_mw": -50.0,
          "q_to_mvar": -10.0,
          "loading_percent": 26.2
        }
      ]
    }
  ]
}
```

**Error response**

When the solver fails to converge or an internal error occurs, `status` is `"error"` and `message` carries a human-readable description. The `islands` array may be empty.

---

## Connecting a Real Solver

The placeholder in `backend/main.py` iterates over `payload.islands` and echoes back the input with all flows set to zero. To wire in pandapower:

1. Install pandapower: `pip install pandapower`
2. In `calculate_power_flow`, construct a `pandapower.create_empty_network()`, populate buses and lines from the `payload` object, run `pp.runpp(net)`, then read results from `net.res_bus` and `net.res_line`.
3. Map results back into the `BusResult` and `BranchResult` Pydantic models.

The request schema already carries everything pandapower needs: nominal voltages, bus types, generation/load setpoints, and per-unit branch impedances with tap ratios.

---

## Development Notes

### Linting

```bash
npm run lint
```

### Production build

```bash
npm run build       # outputs to dist/
npm run preview     # serves the built output locally
```

### Adding a new node type

1. Define the data interface in `src/types/index.ts`.
2. Create a default constructor in `src/utils/nodeFactory.ts`.
3. Add a React component under `src/components/nodes/`.
4. Register the component in the `nodeTypes` map passed to `<ReactFlow>` in `FlowCanvas.tsx`.
5. Add a draggable palette entry in `Toolbox.tsx`.
6. Handle the new type in `payloadGenerator.ts` if it produces buses or branches.

### Known limitations

- The `ybusPrep.ts` utility and `payloadGenerator.ts` use different conventions for R/X/B (the former expects values already in per-unit; the latter converts from physical units). A note in `payloadGenerator.ts` flags this divergence. Align the two modules before using `ybusPrep` output as solver input.
- Transformer edge reconstruction depends on a transformer node having exactly two connected edges. A transformer with one or more missing connections is silently skipped during payload generation.
- Node IDs are generated by an in-memory counter (`node-1`, `node-2`, …) that resets on page reload. Persisting canvas state across sessions will require a stable ID scheme.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the existing TypeScript strict-mode conventions; `tsc -b` must pass cleanly.
3. Keep topology and payload logic in the `src/utils/` layer, away from React components.
4. Add or update types in `src/types/` and keep the Python Pydantic models in `backend/models.py` in sync with `src/types/powerFlow.ts`.
5. Open a pull request with a clear description of what changed and why.

---

## License

MIT License. See `LICENSE` for details.
