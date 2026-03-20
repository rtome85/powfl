import math
import numpy as np

from .models import (
    HarmonicBusResult,
    HarmonicRequest,
    HarmonicResponse,
    HarmonicVoltage,
)


def solve_harmonic(payload: HarmonicRequest) -> HarmonicResponse:
    all_bus_results: list[HarmonicBusResult] = []

    for island in payload.islands:
        buses = [b for b in island.buses]
        if not buses:
            continue

        bus_ids = [b.id for b in buses]
        bus_index = {bid: i for i, bid in enumerate(bus_ids)}
        n = len(buses)

        # Collect unique harmonic orders requested for buses in this island
        island_bus_id_set = set(bus_ids)
        island_sources = [
            src for src in payload.harmonic_sources if src.bus_id in island_bus_id_set
        ]
        if not island_sources:
            # No harmonic sources in this island — zero THD for all buses
            for b in buses:
                all_bus_results.append(
                    HarmonicBusResult(id=b.id, thd_v_percent=0.0, harmonic_voltages=[])
                )
            continue

        orders = sorted(
            {comp.order for src in island_sources for comp in src.injections}
        )

        # Per-bus harmonic voltage magnitudes (in p.u.)
        # bus_harm_v[bus_id][order] = |V_h| in p.u.
        bus_harm_v: dict[str, dict[int, float]] = {bid: {} for bid in bus_ids}

        for h in orders:
            # Build Y-bus for harmonic order h
            Y = np.zeros((n, n), dtype=complex)

            for branch in island.branches:
                fi = bus_index.get(branch.from_bus)
                ti = bus_index.get(branch.to_bus)
                if fi is None or ti is None:
                    continue
                r = branch.r_pu
                x_h = h * branch.x_pu
                b_h = h * branch.b_pu
                # Skip zero-impedance entries to avoid singular matrix
                if r == 0.0 and x_h == 0.0:
                    continue
                y_series = 1.0 / complex(r, x_h)
                # Shunt susceptance (capacitance scales with h)
                y_shunt = complex(0, b_h / 2.0)

                Y[fi, fi] += y_series + y_shunt
                Y[ti, ti] += y_series + y_shunt
                Y[fi, ti] -= y_series
                Y[ti, fi] -= y_series

            # Build injection vector
            I_h = np.zeros(n, dtype=complex)
            for src in island_sources:
                idx = bus_index.get(src.bus_id)
                if idx is None:
                    continue
                bus = next(b for b in buses if b.id == src.bus_id)
                # Fundamental current magnitude (kA, but relative — only ratio matters)
                s_fund = math.sqrt(bus.p_load_mw**2 + bus.q_load_mvar**2)
                i_fund_mag = s_fund / (bus.v_nom_kv * math.sqrt(3)) if bus.v_nom_kv > 0 else 0.0
                for comp in src.injections:
                    if comp.order == h:
                        I_h[idx] += complex(i_fund_mag * comp.magnitude_percent / 100.0, 0)

            # Solve Y·V = I
            try:
                V_h = np.linalg.solve(Y, I_h)
            except np.linalg.LinAlgError:
                # Singular — skip this harmonic order
                continue

            for bid, idx in bus_index.items():
                bus_harm_v[bid][h] = abs(V_h[idx])

        # Compute THD_V per bus
        bus_map = {b.id: b for b in buses}
        for bid in bus_ids:
            bus = bus_map[bid]
            v1 = bus.v_mag_pu if bus.v_mag_pu > 0 else 1.0
            sum_sq = sum(v**2 for v in bus_harm_v[bid].values())
            thd_v = math.sqrt(sum_sq) / v1 * 100.0
            harmonic_voltages = [
                HarmonicVoltage(order=h, magnitude_percent=abs(v) / v1 * 100.0)
                for h, v in sorted(bus_harm_v[bid].items())
            ]
            all_bus_results.append(
                HarmonicBusResult(
                    id=bid,
                    thd_v_percent=round(thd_v, 4),
                    harmonic_voltages=harmonic_voltages,
                )
            )

    return HarmonicResponse(
        status="success",
        message="Harmonic analysis completed",
        bus_results=all_bus_results,
    )
