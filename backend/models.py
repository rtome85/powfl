from typing import Literal
from pydantic import BaseModel


# ── Request models ──────────────────────────────────────────────────────────

class BusIn(BaseModel):
    id: str
    label: str
    type: Literal["Slack", "PV", "PQ"]
    v_nom_kv: float
    v_mag_pu: float
    v_ang_deg: float
    p_gen_mw: float
    q_gen_mvar: float
    p_load_mw: float
    q_load_mvar: float


class BranchIn(BaseModel):
    from_bus: str
    to_bus: str
    r_pu: float
    x_pu: float
    b_pu: float
    rating_mva: float
    is_transformer: bool
    tap: float


class IslandIn(BaseModel):
    island_id: int
    buses: list[BusIn]
    branches: list[BranchIn]


class PowerFlowRequest(BaseModel):
    s_base_mva: float
    islands: list[IslandIn]


# ── Response models ─────────────────────────────────────────────────────────

class BusResult(BaseModel):
    id: str
    v_mag_pu: float
    v_ang_deg: float
    p_gen_mw: float
    q_gen_mvar: float


class BranchResult(BaseModel):
    from_bus: str
    to_bus: str
    p_from_mw: float
    q_from_mvar: float
    p_to_mw: float
    q_to_mvar: float
    loading_percent: float


class IslandResult(BaseModel):
    island_id: int
    converged: bool
    buses: list[BusResult]
    branches: list[BranchResult]


class PowerFlowResponse(BaseModel):
    status: Literal["success", "error"]
    message: str
    islands: list[IslandResult]
