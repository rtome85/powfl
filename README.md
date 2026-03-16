# PowFL — Power Flow Simulation Tool

A browser-based power flow study environment. Build electrical network diagrams interactively, inspect topology health in real time, and run a Newton-Raphson solver that returns per-bus voltages and per-branch loading results with dynamic visual feedback.

The frontend is a fully self-contained React/TypeScript application. The backend is a FastAPI service powered by [pandapower](https://www.pandapower.org/) for Newton-Raphson power flow calculations.

---

## Features

- **Drag-and-drop canvas** — place Bus, Load, Generator, and Transformer nodes onto a ReactFlow canvas and wire them together.
- **Four node variants** — `Slack` (reference bus), `PV` (generator bus), `PQ` (load bus), and a `transformerNode` that bridges two voltage levels.
- **Live topology analysis** — every edit triggers a BFS-based connectivity scan that identifies connected islands, orphan nodes, missing Slack buses, and duplicate Slack buses.
- **Network readiness gate** — the "Run Simulation" button only activates when the topology report contains no errors and no isolated nodes.
- **Newton-Raphson solver** — pandapower-based solver handles Slack/PV/PQ buses, transmission lines, and transformers with off-nominal tap ratios. Supports multi-island networks solved independently.
- **Visual feedback after simulation** — bus node borders change colour based on voltage magnitude (red < 0.95 pu, green 0.95--1.05 pu, yellow > 1.05 pu). Transmission edges change colour based on loading (green < 80%, amber 80--100%, red >= 100%) and display active power and loading percentage.
- **Y-bus preparation** — a dedicated utility converts the canvas graph into series admittances and shunt susceptances, with tap-corrected transformer entries.
- **Payload generation** — impedance values in per-unit on a 100 MVA base are sent to the backend. The payload generator reconstructs transformer branches from the canvas graph.
- **Properties panel** — click any node or edge to edit its electrical parameters inline.
- **Error handling** — convergence failures return a descriptive error message explaining the issue. The frontend displays a structured error panel with guidance.

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
| pandapower | >=2.14 | Newton-Raphson power flow solver |

---

## Project Structure

```
powfl/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI app and /calculate-power-flow endpoint
│   ├── models.py            # Pydantic request and response models
│   ├── solver.py            # Pandapower Newton-Raphson solver (per-island)
│   └── requirements.txt
├── src/
│   ├── api/
│   │   └── powerFlowApi.ts  # fetch wrapper — POST /api/calculate-power-flow
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── FlowCanvas.tsx       # ReactFlow root, drag-drop handlers
│   │   │   └── NetworkStatus.tsx    # Topology badges, run button, result/error display
│   │   ├── edges/
│   │   │   └── TransmissionEdge.tsx # Custom edge with loading-based coloring
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Top-level three-column layout
│   │   │   ├── PropertiesPanel.tsx  # Right-hand inspector panel
│   │   │   └── Toolbox.tsx          # Left-hand node palette
│   │   ├── nodes/
│   │   │   ├── BusNode.tsx          # Bus renderer with voltage-based coloring
│   │   │   └── TransformerNode.tsx  # Transformer with SVG symbol
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
│       ├── payloadGenerator.ts  # Canvas graph → PowerFlowPayload
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
cd powfl
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

---

## Running the App

Both servers must be running at the same time. Open two terminal tabs.

**Terminal 1 — backend (port 8000)**

```bash
cd powfl
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 — frontend dev server (port 5173)**

```bash
cd powfl
npm run dev
```

Open `http://localhost:5173` in your browser.

The Vite dev server proxies every request matching `/api/*` to `http://localhost:8000`, stripping the `/api` prefix. The frontend therefore calls `/api/calculate-power-flow`, which lands at `POST /calculate-power-flow` on FastAPI.

---

## How to Use

### Basic workflow

1. **Add nodes** — drag items from the left-hand Toolbox onto the canvas. Available types: Bus, Load, Generator, Transformer.
2. **Connect nodes** — hover a node to reveal its handles, then drag from one handle to another to create a transmission line edge.
3. **Set parameters** — click any node or edge to open the Properties panel on the right. For buses, set the bus type (`Slack`, `PV`, or `PQ`), nominal voltage, generation, and load. For edges, set resistance (pu), reactance (pu), susceptance (pu), and thermal rating (MVA). For transformers, set primary/secondary voltage, tap ratio, series reactance, and MVA rating.
4. **Check topology** — the status bar in the bottom-left of the canvas updates live. Errors appear for missing or duplicate Slack buses. Warnings appear for isolated (unconnected) nodes.
5. **Run the simulation** — once the status bar shows "Network Ready", click **Executar Simulacao**. The pandapower Newton-Raphson solver runs on the backend and results are written back to the canvas.

### Reading simulation results

After a successful run:

- **Bus nodes** change border colour to reflect voltage magnitude: red (< 0.95 pu, undervoltage), green (0.95--1.05 pu, normal), yellow (> 1.05 pu, overvoltage). The voltage value updates in the node label.
- **Edges** change colour to reflect loading: green (< 80%), amber (80--100%), red (>= 100%, overloaded). The label switches from impedance values to active power (MW) and loading percentage.
- Modifying any node or edge resets the visual feedback, requiring a new simulation run.

### Node types and bus classifications

| Toolbox item | Underlying type | Default bus class | Typical use |
|---|---|---|---|
| Bus | `busNode` | PQ | Generic bus bar |
| Load | `busNode` (load variant) | PQ | Demand point, pre-filled with 10 MW load |
| Generator | `busNode` (generator variant) | PV | Dispatchable generation, pre-filled with 50 MW output |
| Transformer | `transformerNode` | — | Connects two buses at different voltage levels; must be wired to exactly two bus nodes |

Every connected island must contain exactly one `Slack` bus. The Slack bus sets the voltage reference (angle = 0 deg) for that island.

---

## Architecture and Data Flow

The pipeline from canvas edit to simulation result has five distinct stages.

```
User edit on canvas
       |
       v
 useFlowStore (Zustand)
  - nodes[], edges[], isSimulated
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
  - impedance values already in per-unit on S_BASE = 100 MVA
  - tap-corrects transformer reactance
       |
       v
 powerFlowApi.ts  ── POST /api/calculate-power-flow ──>  FastAPI backend
  - JSON body validated by Pydantic PowerFlowRequest
       |
       v
 backend/solver.py  ── solve_island()
  - builds pandapower network (ext_grid / gen / sgen / load)
  - creates lines and transformers with proper tap position
  - runs pp.runpp() with Newton-Raphson (max 50 iterations)
  - extracts bus voltages and branch flows from pandapower results
       |
       v
 PowerFlowResponse  (JSON)
  - status, message
  - per-island: converged flag, bus results, branch results
       |
       v
 useFlowStore.runSimulation()
  - maps BusResult back to canvas nodes (v_mag, v_ang)
  - maps BranchResult back to edges (p_from_mw, loading_percent)
  - batch-applies all updates in a single set() call
  - sets isSimulated = true, enabling visual feedback
  - triggers a final topology re-analysis on the updated state
```

### Key design decisions

**Topology analysis on every mutation.** `setNodes`, `setEdges`, and `updateNodeData` all call `analyzeTopology` synchronously inside the Zustand setter. This keeps `topologyReport` always consistent with the current graph without requiring an explicit "validate" step.

**Transformer as a first-class node, not an edge attribute.** A transformer is placed as a `transformerNode` on the canvas and connected to two bus nodes via ordinary edges. The payload generator reconstructs the two-bus branch by collecting all edges adjacent to the transformer node. This lets transformers carry their own properties (tap ratio, x_pu, ratings) independent of the edge schema.

**Per-unit throughout.** Bus and edge impedance parameters are stored and edited in per-unit in the frontend. The backend receives per-unit values and converts to physical units (Ohms, nF) only when building the pandapower network internally.

**Batch result application.** After a successful solver response, all bus and edge updates are applied in a single `set()` call to avoid triggering N intermediate topology re-analyses. A single re-analysis runs on the final updated state.

**isSimulated flag.** A boolean flag tracks whether the current canvas state has been simulated. It is set to `true` after a successful run and reset to `false` on any node or edge modification. Visual feedback (voltage colouring, loading labels) only renders when `isSimulated` is `true`.

---

## API Reference

### `POST /calculate-power-flow`

Accepts a complete network description in per-unit and returns per-bus voltages and per-branch power flows. The backend runs a Newton-Raphson power flow via pandapower for each island independently.

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
          "branch_id": "edge-1",
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

**Response body (success)**

```json
{
  "status": "success",
  "message": "Power flow converged for all islands",
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
          "branch_id": "edge-1",
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

**Error responses**

| Status | Cause | Detail |
|---|---|---|
| 400 | Newton-Raphson did not converge | Descriptive message in Portuguese indicating the island and suggesting network configuration checks |
| 500 | Unexpected solver error | Internal error message with exception details |
| 422 | Validation error | Pydantic validation failure (e.g. `from_bus == to_bus`, negative impedance) |

The frontend parses the `detail` field from FastAPI error responses and displays it in a structured error panel.

---

## Solver Details

The backend solver (`backend/solver.py`) maps frontend data to pandapower elements as follows:

| Frontend | pandapower element | Notes |
|---|---|---|
| Slack bus | `ext_grid` | Fixed voltage magnitude and angle |
| PV bus | `gen` | Fixed active power and voltage magnitude |
| PQ bus | `sgen` + `load` | Static generation and/or load |
| Transmission line | `line_from_parameters` | R/X converted from p.u. to Ohms via Z_base; B converted to nF capacitance |
| Transformer | `transformer_from_parameters` | HV/LV determined from nominal voltages; tap encoded as `tap_pos`/`tap_step_percent` |

The solver runs `pp.runpp()` with:
- Algorithm: Newton-Raphson (`nr`)
- Initialization: `auto`
- Maximum iterations: 50

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
7. Update `solver.py` if the new type requires a different pandapower element mapping.

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `ALLOWED_ORIGINS` | Comma-separated list of CORS origins for the backend | `http://localhost:5173` |

### Known limitations

- The `ybusPrep.ts` utility and `payloadGenerator.ts` use different conventions for R/X/B (the former expects values already in per-unit; the latter also uses per-unit but with different shunt handling). A note in `payloadGenerator.ts` flags this divergence. Align the two modules before using `ybusPrep` output as solver input.
- Transformer edge reconstruction depends on a transformer node having exactly two connected edges. A transformer with one or more missing connections throws an error during payload generation.
- Node IDs are generated by an in-memory counter (`node-1`, `node-2`, ...) that resets on page reload. Persisting canvas state across sessions will require a stable ID scheme.

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
