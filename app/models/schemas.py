"""Data shapes and validation for the optimizer API."""

from dataclasses import dataclass


@dataclass
class Location:
    id: int
    name: str
    lat: float
    lon: float
    demand: float = 0.0
    service_time: float = 0.0
    time_window_start: float = 0.0
    time_window_end: float = 1440.0
    priority: int = 1


@dataclass
class Vehicle:
    id: int
    name: str
    vehicle_type: str
    capacity: float
    cost_per_km: float
    co2_per_km: float
    max_range: float
    max_shift_hours: float = 8.0
    speed_kmh: float = 40.0


@dataclass
class OptimizationConfig:
    w_cost: float = 0.5
    w_co2: float = 0.3
    w_fairness: float = 0.2
    time_limit_seconds: int | None = None
    solver_gap: float = 0.0
    cost_reduction_target: float = 0.15
    co2_reduction_target: float = 0.10


def parse_optimize_request(body: dict) -> dict:
    """Clamp and coerce raw /optimize JSON body to validated fields."""
    raw_tl = body.get("time_limit")
    return {
        "n_customers": max(5, min(int(body.get("n_customers", 10)), 15)),
        "n_vehicles": max(2, min(int(body.get("n_vehicles", 5)), 8)),
        "w_cost": float(body.get("w_cost", 0.5)),
        "w_co2": float(body.get("w_co2", 0.3)),
        "w_fairness": float(body.get("w_fairness", 0.2)),
        "time_limit": int(raw_tl) if raw_tl is not None else None,
        "seed": int(body.get("seed", 42)),
    }
