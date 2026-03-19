from typing import Literal
from pydantic import BaseModel, Field, model_validator


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
    c_factor: float = Field(default=1.1, gt=0, description="Voltage factor per IEC 60909")


class BranchIn(BaseModel):
    branch_id: str
    from_bus: str
    to_bus: str
    r_pu: float = Field(ge=0, description="Series resistance in p.u. (non-negative)")
    x_pu: float = Field(ge=0, description="Series reactance in p.u. (non-negative)")
    b_pu: float = Field(ge=0, description="Shunt susceptance in p.u. (non-negative)")
    rating_mva: float = Field(gt=0, description="Thermal rating in MVA (must be positive)")
    is_transformer: bool
    tap: float = Field(gt=0, description="Tap ratio in p.u. (must be positive)")
    vkr_percent: float | None = Field(default=None, ge=0, description="Real part of short-circuit voltage (%)")

    @model_validator(mode="after")
    def buses_must_differ(self) -> "BranchIn":
        if self.from_bus == self.to_bus:
            raise ValueError(f"from_bus and to_bus must differ (got '{self.from_bus}')")
        return self


class IslandIn(BaseModel):
    island_id: int
    buses: list[BusIn]
    branches: list[BranchIn]


class PowerFlowRequest(BaseModel):
    s_base_mva: float = Field(gt=0, description="System base power in MVA (must be positive)")
    islands: list[IslandIn]


# ── Response models ─────────────────────────────────────────────────────────

class BusResult(BaseModel):
    id: str
    v_mag_pu: float
    v_ang_deg: float
    p_gen_mw: float
    q_gen_mvar: float


class BranchResult(BaseModel):
    branch_id: str
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


# ── Short-circuit models ───────────────────────────────────────────────────

class ShortCircuitRequest(BaseModel):
    s_base_mva: float = Field(gt=0, description="System base power in MVA")
    fault_bus_id: str
    islands: list[IslandIn]


class SCBusResult(BaseModel):
    id: str
    ikss_ka: float


class SCBranchResult(BaseModel):
    branch_id: str
    ikss_ka: float


class ShortCircuitResponse(BaseModel):
    status: Literal["success", "error"]
    message: str
    fault_bus_id: str
    ikss_ka: float = 0.0
    skss_mw: float = 0.0
    bus_results: list[SCBusResult] = []
    branch_results: list[SCBranchResult] = []
