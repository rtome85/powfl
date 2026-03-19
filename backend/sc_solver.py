"""IEC 60909 three-phase symmetrical short-circuit solver using pandapower."""

from __future__ import annotations

import pandapower.shortcircuit as sc

from .models import (
    IslandIn,
    SCBranchResult,
    SCBusResult,
    ShortCircuitRequest,
    ShortCircuitResponse,
)
from .solver import NetworkValidationError, build_pandapower_network


def solve_short_circuit(request: ShortCircuitRequest) -> ShortCircuitResponse:
    """Run a 3-phase short-circuit calculation at the specified fault bus."""

    fault_bus_id = request.fault_bus_id
    s_base_mva = request.s_base_mva

    # Find the island that contains the fault bus
    target_island: IslandIn | None = None
    for island in request.islands:
        if any(b.id == fault_bus_id for b in island.buses):
            target_island = island
            break

    if target_island is None:
        return ShortCircuitResponse(
            status="error",
            message=f"Fault bus '{fault_bus_id}' not found in any island.",
            fault_bus_id=fault_bus_id,
        )

    try:
        net, bus_idx, branch_map = build_pandapower_network(target_island, s_base_mva)
    except NetworkValidationError as exc:
        return ShortCircuitResponse(
            status="error",
            message=str(exc),
            fault_bus_id=fault_bus_id,
        )

    if fault_bus_id not in bus_idx:
        return ShortCircuitResponse(
            status="error",
            message=f"Fault bus '{fault_bus_id}' not mapped to a pandapower bus.",
            fault_bus_id=fault_bus_id,
        )

    # Apply c_factor (voltage factor) from bus data
    bus_c_factors = {b.id: b.c_factor for b in target_island.buses}
    for fe_id, pp_idx in bus_idx.items():
        c = bus_c_factors.get(fe_id, 1.1)
        net.bus.at[pp_idx, "c_max"] = c
        net.bus.at[pp_idx, "c_min"] = c

    # IEC 60909 requires short-circuit power parameters on external grids.
    # Set defaults if not already present.
    for idx in net.ext_grid.index:
        if "s_sc_max_mva" not in net.ext_grid.columns or net.ext_grid.at[idx, "s_sc_max_mva"] != net.ext_grid.at[idx, "s_sc_max_mva"]:
            bus_idx_pp = net.ext_grid.at[idx, "bus"]
            vn_kv = net.bus.at[bus_idx_pp, "vn_kv"]
            # Default: strong grid (10 GVA for HV, 500 MVA for MV)
            net.ext_grid.at[idx, "s_sc_max_mva"] = 10000.0 if vn_kv >= 110 else 500.0
        if "rx_max" not in net.ext_grid.columns or net.ext_grid.at[idx, "rx_max"] != net.ext_grid.at[idx, "rx_max"]:
            net.ext_grid.at[idx, "rx_max"] = 0.1
        if "s_sc_min_mva" not in net.ext_grid.columns or net.ext_grid.at[idx, "s_sc_min_mva"] != net.ext_grid.at[idx, "s_sc_min_mva"]:
            net.ext_grid.at[idx, "s_sc_min_mva"] = net.ext_grid.at[idx, "s_sc_max_mva"]
        if "rx_min" not in net.ext_grid.columns or net.ext_grid.at[idx, "rx_min"] != net.ext_grid.at[idx, "rx_min"]:
            net.ext_grid.at[idx, "rx_min"] = net.ext_grid.at[idx, "rx_max"]

    fault_pp_idx = bus_idx[fault_bus_id]

    try:
        sc.calc_sc(net, bus=fault_pp_idx, fault="3ph", branch_results=True)
    except Exception as exc:
        return ShortCircuitResponse(
            status="error",
            message=f"Short-circuit calculation failed: {exc}",
            fault_bus_id=fault_bus_id,
        )

    # Extract bus results — only the faulted bus is in res_bus_sc
    bus_results: list[SCBusResult] = []
    fault_ikss = 0.0
    fault_skss = 0.0
    for bus in target_island.buses:
        pp_idx = bus_idx[bus.id]
        if pp_idx in net.res_bus_sc.index:
            ikss = float(net.res_bus_sc.at[pp_idx, "ikss_ka"])
            bus_results.append(SCBusResult(id=bus.id, ikss_ka=round(ikss, 4)))
            if bus.id == fault_bus_id:
                fault_ikss = ikss
                fault_skss = float(net.res_bus_sc.at[pp_idx, "skss_mw"])
        else:
            bus_results.append(SCBusResult(id=bus.id, ikss_ka=0.0))

    # Extract branch results
    branch_results: list[SCBranchResult] = []
    for br in target_island.branches:
        elem_type, pp_idx = branch_map[br.branch_id]
        ikss = 0.0
        if elem_type == "line" and not net.res_line_sc.empty:
            if pp_idx in net.res_line_sc.index:
                ikss = float(net.res_line_sc.at[pp_idx, "ikss_ka"])
        elif elem_type == "trafo" and not net.res_trafo_sc.empty:
            if pp_idx in net.res_trafo_sc.index:
                row = net.res_trafo_sc.loc[pp_idx]
                hv = float(row["ikss_hv_ka"]) if "ikss_hv_ka" in row.index else 0.0
                lv = float(row["ikss_lv_ka"]) if "ikss_lv_ka" in row.index else 0.0
                # Use the larger of the two sides as the branch SC current
                ikss = max(hv, lv)
        branch_results.append(
            SCBranchResult(branch_id=br.branch_id, ikss_ka=round(ikss, 4))
        )

    return ShortCircuitResponse(
        status="success",
        message="Short-circuit calculation completed.",
        fault_bus_id=fault_bus_id,
        ikss_ka=round(fault_ikss, 4),
        skss_mw=round(fault_skss, 4),
        bus_results=bus_results,
        branch_results=branch_results,
    )
