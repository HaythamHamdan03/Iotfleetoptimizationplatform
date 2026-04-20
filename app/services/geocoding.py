"""Server-side proxy for the HERE Geocoding API."""

import logging
import os

import requests

HERE_GEOCODE_URL = "https://geocode.search.hereapi.com/v1/geocode"
_geocode_log = logging.getLogger("geocode")


def _here_request(query: str, api_key: str, timeout: float = 5.0):
    return requests.get(
        HERE_GEOCODE_URL,
        params={"q": query, "apiKey": api_key, "in": "countryCode:SAU"},
        timeout=timeout,
    )


def geocode_query(query: str) -> tuple[dict, int]:
    """Returns (body, status_code)."""
    query = (query or "").strip()
    if not query:
        return {"error": "empty_query"}, 400

    api_key = os.environ.get("HERE_API_KEY", "").strip()
    if not api_key:
        return {"error": "missing_api_key"}, 500

    last_err = None
    for _ in range(2):
        try:
            res = _here_request(query, api_key)
            if res.status_code >= 500:
                last_err = f"here_status_{res.status_code}"
                continue
            if res.status_code != 200:
                _geocode_log.warning("HERE returned %s for query=%r", res.status_code, query)
                return {"error": f"here_status_{res.status_code}"}, 502
            data = res.json()
            items = data.get("items") or []
            if not items:
                return {"error": "address_not_found"}, 404

            it = items[0]
            pos = it.get("position") or {}
            addr = it.get("address") or {}
            return {
                "title":             it.get("title"),
                "formatted_address": addr.get("label"),
                "latitude":          pos.get("lat"),
                "longitude":         pos.get("lng"),
                "country_code":      addr.get("countryCode"),
                "city":              addr.get("city"),
                "district":          addr.get("district"),
                "street":            addr.get("street"),
                "house_number":      addr.get("houseNumber"),
                "postal_code":       addr.get("postalCode"),
                "result_type":       it.get("resultType"),
                "query_score":       (it.get("scoring") or {}).get("queryScore"),
                "raw_response":      it,
            }, 200
        except (requests.Timeout, requests.ConnectionError) as e:
            last_err = type(e).__name__
            continue

    _geocode_log.warning("HERE geocoding failed for query=%r: %s", query, last_err)
    return {"error": "upstream_unavailable", "detail": last_err}, 504
