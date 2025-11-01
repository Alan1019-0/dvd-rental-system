import requests
from requests.exceptions import HTTPError, ConnectionError, Timeout

BASE_URL = "http://localhost:3000/api"

class APIError(Exception):
    pass

class APIClient:
    def __init__(self, base=None, timeout=10):
        self.base = base or BASE_URL
        self.timeout = timeout

    def _get(self, path, params=None):
        try:
            r = requests.get(f"{self.base}{path}", params=params, timeout=self.timeout)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            raise APIError(str(e))

    def _post(self, path, json=None):
        try:
            r = requests.post(f"{self.base}{path}", json=json, timeout=self.timeout)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            raise APIError(str(e))

    def _delete(self, path):
        try:
            r = requests.delete(f"{self.base}{path}", timeout=self.timeout)
            r.raise_for_status()
            try:
                return r.json()
            except:
                return {}
        except Exception as e:
            raise APIError(str(e))

    # Customers
    def get_customers(self):
        return self._get("/customers")

    # Inventory
    def get_available_inventory(self):
        return self._get("/films/available/list")

    # Rentals
    def create_rental(self, customer_id, inventory_id, staff_id):
        payload = {
            "customer_id": int(customer_id),
            "inventory_id": int(inventory_id),
            "staff_id": int(staff_id)
        }
        return self._post("/rentals", json=payload)

    def get_rental(self, rental_id):
        return self._get(f"/rentals/{rental_id}")

    def return_rental(self, rental_id):
        return self._post(f"/rentals/{rental_id}/return", json={})

    def cancel_rental(self, rental_id):
        return self._delete(f"/rentals/{rental_id}")

    def get_rentals_by_customer(self, customer_id):
        return self._get(f"/reports/customer/{customer_id}/rentals")

    # Reports
    def get_not_returned(self, days_overdue=None):
        params = {}
        if days_overdue is not None:
            params["days_overdue"] = days_overdue
        return self._get("/reports/unreturned", params)

    def get_top_dvds(self, limit=10):
        return self._get("/reports/top-films", {"limit": limit})

    def get_staff_earnings(self, staff_id=None, start=None, end=None):
        params = {}
        if staff_id: params["staff_id"] = staff_id
        if start: params["from"] = start
        if end: params["to"] = end
        return self._get("/reports/staff-earnings", params)
