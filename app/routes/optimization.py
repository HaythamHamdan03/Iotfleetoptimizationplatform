"""HTTP routes for optimization, fleet, geocoding, and runs endpoints."""

from flask import Blueprint, request, jsonify

from app.models.schemas import parse_optimize_request
from app.services.vrp_solver import (
    build_fleet_routes_payload,
    list_recent_runs,
    run_optimization,
    to_json_safe,
)
from app.services.geocoding import geocode_query

optimization_bp = Blueprint("optimization", __name__)


@optimization_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "solver": "PuLP/CBC"})


@optimization_bp.route("/optimize", methods=["POST"])
def optimize():
    body = request.json or {}
    params = parse_optimize_request(body)
    response, error = run_optimization(params)
    if error is not None:
        return jsonify(error), 500
    return jsonify(response)


@optimization_bp.route("/fleet-routes", methods=["GET"])
def fleet_routes():
    return jsonify(to_json_safe(build_fleet_routes_payload()))


@optimization_bp.route("/runs", methods=["GET"])
def list_runs():
    return jsonify(list_recent_runs())


@optimization_bp.route("/geocode", methods=["GET"])
@optimization_bp.route("/api/geocode", methods=["GET"])
def geocode():
    query = request.args.get("q") or ""
    body, status = geocode_query(query)
    return jsonify(body), status
