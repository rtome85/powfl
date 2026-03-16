import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    IslandResult,
    PowerFlowRequest,
    PowerFlowResponse,
)
from .solver import NetworkValidationError, PowerFlowDivergenceError, solve_island

app = FastAPI(title="PowFL Power Flow API")

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
allow_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()] or ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/calculate-power-flow", response_model=PowerFlowResponse)
def calculate_power_flow(payload: PowerFlowRequest) -> PowerFlowResponse:
    island_results: list[IslandResult] = []

    for island in payload.islands:
        try:
            result = solve_island(island, payload.s_base_mva)
            island_results.append(result)
        except NetworkValidationError as exc:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": str(exc),
                    "element_ids": exc.element_ids,
                },
            )
        except PowerFlowDivergenceError as exc:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": (
                        f"Newton-Raphson did not converge for island {exc.island_id}. "
                        "Check the network configuration "
                        "(impedances, nominal voltages, generation vs. load)."
                    ),
                    "element_ids": [],
                },
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail={
                    "message": f"Internal error during power flow calculation: {exc}",
                    "element_ids": [],
                },
            ) from exc

    return PowerFlowResponse(
        status="success",
        message="Power flow converged for all islands",
        islands=island_results,
    )
