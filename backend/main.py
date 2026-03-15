from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    BranchResult,
    BusResult,
    IslandResult,
    PowerFlowRequest,
    PowerFlowResponse,
)

app = FastAPI(title="PowFL Power Flow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/calculate-power-flow", response_model=PowerFlowResponse)
def calculate_power_flow(payload: PowerFlowRequest) -> PowerFlowResponse:
    # TODO: replace with pandapower newton-raphson solver
    island_results = [
        IslandResult(
            island_id=island.island_id,
            converged=True,
            buses=[
                BusResult(
                    id=b.id,
                    v_mag_pu=1.0,
                    v_ang_deg=0.0,
                    p_gen_mw=b.p_gen_mw,
                    q_gen_mvar=b.q_gen_mvar,
                )
                for b in island.buses
            ],
            branches=[
                BranchResult(
                    from_bus=br.from_bus,
                    to_bus=br.to_bus,
                    p_from_mw=0,
                    q_from_mvar=0,
                    p_to_mw=0,
                    q_to_mvar=0,
                    loading_percent=0,
                )
                for br in island.branches
            ],
        )
        for island in payload.islands
    ]
    return PowerFlowResponse(
        status="success",
        message="Placeholder — solver not yet connected",
        islands=island_results,
    )
