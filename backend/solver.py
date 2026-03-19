"""Pandapower Newton-Raphson power flow solver."""

from __future__ import annotations

import math

import pandapower as pp

from .models import (
    BranchResult,
    BusResult,
    IslandIn,
    IslandResult,
)


class PowerFlowDivergenceError(Exception):
    """Raised when the Newton-Raphson algorithm fails to converge."""

    def __init__(self, island_id: int):
        self.island_id = island_id
        super().__init__(f"Power flow did not converge for island {island_id}")


class NetworkValidationError(Exception):
    """Raised when the network has invalid parameters that prevent calculation."""

    def __init__(self, message: str, element_ids: list[str] | None = None):
        self.element_ids = element_ids or []
        super().__init__(message)


def _validate_island(island: IslandIn) -> None:
    """Pre-validate island data before building the pandapower network."""
    for bus in island.buses:
        if bus.v_nom_kv <= 0:
            raise NetworkValidationError(
                f'Bus "{bus.label}" ({bus.id}) has nominal voltage = {bus.v_nom_kv} kV. '
                f"Nominal voltage must be positive.",
                element_ids=[bus.id],
            )

    for br in island.branches:
        if br.is_transformer:
            if br.x_pu == 0 and br.r_pu == 0:
                raise NetworkValidationError(
                    f'Transformer "{br.branch_id}" has both R and X set to 0 p.u. '
                    f"Set a non-zero series reactance (X) for the transformer.",
                    element_ids=[br.branch_id],
                )
            if br.rating_mva <= 0:
                raise NetworkValidationError(
                    f'Transformer "{br.branch_id}" has thermal rating = {br.rating_mva} MVA. '
                    f"Rating must be positive.",
                    element_ids=[br.branch_id],
                )
        else:
            if br.r_pu == 0 and br.x_pu == 0:
                raise NetworkValidationError(
                    f'Transmission line "{br.branch_id}" (from "{br.from_bus}" to "{br.to_bus}") '
                    f"has both R and X set to 0 p.u. "
                    f"Set non-zero impedance values in the line properties.",
                    element_ids=[br.branch_id],
                )
            if br.rating_mva <= 0:
                raise NetworkValidationError(
                    f'Transmission line "{br.branch_id}" has thermal rating = {br.rating_mva} MVA. '
                    f"Rating must be positive.",
                    element_ids=[br.branch_id],
                )


def build_pandapower_network(
    island: IslandIn, s_base_mva: float
) -> tuple[pp.pandapowerNet, dict[str, int], dict[str, tuple[str, int]]]:
    """Build a pandapower network and return (net, bus_idx, branch_map).

    bus_idx maps frontend bus id -> pandapower bus index.
    branch_map maps frontend branch id -> (element_type, pp_index).
    """
    _validate_island(island)

    net = pp.create_empty_network(sn_mva=s_base_mva)

    bus_idx: dict[str, int] = {}

    for bus in island.buses:
        idx = pp.create_bus(net, vn_kv=bus.v_nom_kv, name=bus.id)
        bus_idx[bus.id] = idx

        if bus.type == "Slack":
            pp.create_ext_grid(
                net,
                bus=idx,
                vm_pu=bus.v_mag_pu,
                va_degree=bus.v_ang_deg,
                name=f"ext_{bus.id}",
            )
            if bus.p_load_mw != 0 or bus.q_load_mvar != 0:
                pp.create_load(
                    net, bus=idx, p_mw=bus.p_load_mw, q_mvar=bus.q_load_mvar
                )
        elif bus.type == "PV":
            pp.create_gen(
                net,
                bus=idx,
                p_mw=bus.p_gen_mw,
                vm_pu=bus.v_mag_pu,
                name=f"gen_{bus.id}",
            )
            if bus.p_load_mw != 0 or bus.q_load_mvar != 0:
                pp.create_load(
                    net, bus=idx, p_mw=bus.p_load_mw, q_mvar=bus.q_load_mvar
                )
        else:
            if bus.p_gen_mw != 0 or bus.q_gen_mvar != 0:
                pp.create_sgen(
                    net,
                    bus=idx,
                    p_mw=bus.p_gen_mw,
                    q_mvar=bus.q_gen_mvar,
                    name=f"sgen_{bus.id}",
                )
            if bus.p_load_mw != 0 or bus.q_load_mvar != 0:
                pp.create_load(
                    net, bus=idx, p_mw=bus.p_load_mw, q_mvar=bus.q_load_mvar
                )

    branch_map: dict[str, tuple[str, int]] = {}

    for br in island.branches:
        from_idx = bus_idx[br.from_bus]
        to_idx = bus_idx[br.to_bus]

        if br.is_transformer:
            from_vn = net.bus.at[from_idx, "vn_kv"]
            to_vn = net.bus.at[to_idx, "vn_kv"]

            if from_vn >= to_vn:
                hv_bus, lv_bus = from_idx, to_idx
                vn_hv, vn_lv = from_vn, to_vn
            else:
                hv_bus, lv_bus = to_idx, from_idx
                vn_hv, vn_lv = to_vn, from_vn

            vk_percent = br.x_pu * 100.0
            vkr_percent = br.vkr_percent if br.vkr_percent is not None else br.r_pu * 100.0

            if br.tap == 1.0:
                tap_pos, tap_step = 0, 1.0
            elif br.tap > 1.0:
                tap_pos, tap_step = 1, (br.tap - 1.0) * 100.0
            else:
                tap_pos, tap_step = -1, (1.0 - br.tap) * 100.0

            idx = pp.create_transformer_from_parameters(
                net,
                hv_bus=hv_bus,
                lv_bus=lv_bus,
                sn_mva=br.rating_mva,
                vn_hv_kv=vn_hv,
                vn_lv_kv=vn_lv,
                vk_percent=max(vk_percent, 0.01),
                vkr_percent=vkr_percent,
                pfe_kw=0,
                i0_percent=0,
                tap_pos=tap_pos,
                tap_neutral=0,
                tap_step_percent=tap_step,
                tap_side="hv",
                name=br.branch_id,
            )
            branch_map[br.branch_id] = ("trafo", idx)
        else:
            from_vn = net.bus.at[from_idx, "vn_kv"]
            z_base = from_vn**2 / s_base_mva

            r_ohm = br.r_pu * z_base
            x_ohm = br.x_pu * z_base
            b_siemens = br.b_pu / z_base if z_base > 0 else 0
            c_nf = b_siemens / (2 * math.pi * 50) * 1e9

            idx = pp.create_line_from_parameters(
                net,
                from_bus=from_idx,
                to_bus=to_idx,
                length_km=1.0,
                r_ohm_per_km=r_ohm,
                x_ohm_per_km=x_ohm,
                c_nf_per_km=c_nf,
                max_i_ka=br.rating_mva / (from_vn * math.sqrt(3)),
                name=br.branch_id,
            )
            branch_map[br.branch_id] = ("line", idx)

    return net, bus_idx, branch_map


def solve_island(island: IslandIn, s_base_mva: float) -> IslandResult:
    """Build a pandapower network from *island* and run a Newton-Raphson power flow."""

    net, bus_idx, branch_map = build_pandapower_network(island, s_base_mva)

    # Run Newton-Raphson
    try:
        pp.runpp(net, algorithm="nr", init="auto", max_iteration=50)
    except pp.LoadflowNotConverged:
        raise PowerFlowDivergenceError(island.island_id)

    if not net["converged"]:
        raise PowerFlowDivergenceError(island.island_id)

    # Extract bus results
    bus_results: list[BusResult] = []
    for bus in island.buses:
        idx = bus_idx[bus.id]
        vm = float(net.res_bus.at[idx, "vm_pu"])
        va = float(net.res_bus.at[idx, "va_degree"])

        p_gen = 0.0
        q_gen = 0.0
        if not net.res_ext_grid.empty:
            mask = net.ext_grid["bus"] == idx
            if mask.any():
                p_gen += float(net.res_ext_grid.loc[mask, "p_mw"].sum())
                q_gen += float(net.res_ext_grid.loc[mask, "q_mvar"].sum())
        if not net.res_gen.empty:
            mask = net.gen["bus"] == idx
            if mask.any():
                p_gen += float(net.res_gen.loc[mask, "p_mw"].sum())
                q_gen += float(net.res_gen.loc[mask, "q_mvar"].sum())
        if not net.res_sgen.empty:
            mask = net.sgen["bus"] == idx
            if mask.any():
                p_gen += float(net.res_sgen.loc[mask, "p_mw"].sum())
                q_gen += float(net.res_sgen.loc[mask, "q_mvar"].sum())

        bus_results.append(
            BusResult(
                id=bus.id,
                v_mag_pu=round(vm, 6),
                v_ang_deg=round(va, 4),
                p_gen_mw=round(p_gen, 4),
                q_gen_mvar=round(q_gen, 4),
            )
        )

    # Extract branch results
    branch_results: list[BranchResult] = []
    for br in island.branches:
        elem_type, idx = branch_map[br.branch_id]

        if elem_type == "line":
            res = net.res_line
            p_from = float(res.at[idx, "p_from_mw"])
            q_from = float(res.at[idx, "q_from_mvar"])
            p_to = float(res.at[idx, "p_to_mw"])
            q_to = float(res.at[idx, "q_to_mvar"])
            loading = float(res.at[idx, "loading_percent"])
        else:
            res = net.res_trafo
            p_from = float(res.at[idx, "p_hv_mw"])
            q_from = float(res.at[idx, "q_hv_mvar"])
            p_to = float(res.at[idx, "p_lv_mw"])
            q_to = float(res.at[idx, "q_lv_mvar"])
            loading = float(res.at[idx, "loading_percent"])

        branch_results.append(
            BranchResult(
                branch_id=br.branch_id,
                from_bus=br.from_bus,
                to_bus=br.to_bus,
                p_from_mw=round(p_from, 4),
                q_from_mvar=round(q_from, 4),
                p_to_mw=round(p_to, 4),
                q_to_mvar=round(q_to, 4),
                loading_percent=round(loading, 2),
            )
        )

    return IslandResult(
        island_id=island.island_id,
        converged=True,
        buses=bus_results,
        branches=branch_results,
    )
