"""Exercise the localhost demo profile. Uses only the Python standard library."""
import base64
import http.cookiejar
import json
import urllib.request
import urllib.error


class Client:
    def __init__(self, port, username, password):
        self.base = f"http://127.0.0.1:{port}"
        self.auth = "Basic " + base64.b64encode(f"{username}:{password}".encode()).decode()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.csrf = None
        self.csrf = self.call("GET", "/api/session")

    def call(self, method, path, data=None, expected=200):
        headers = {"Authorization": self.auth, "Accept": "application/json"}
        if self.csrf:
            headers[self.csrf["csrfHeader"]] = self.csrf["csrfToken"]
        body = None
        if data is not None:
            headers["Content-Type"] = "application/json"
            body = json.dumps(data).encode()
        req = urllib.request.Request(self.base + path, data=body, headers=headers, method=method)
        try:
            response = self.opener.open(req, timeout=15)
        except urllib.error.HTTPError as error:
            response = error
        assert response.status == expected, f"{method} {path}: expected {expected}, got {response.status}"
        content = response.read()
        return json.loads(content) if content and response.headers.get("Content-Type", "").startswith("application/") else None

operator = Client(8082, "operator", "operator-local")
reviewer = Client(8082, "reviewer", "reviewer-local")
import uuid
email = f"demo-{uuid.uuid4().hex[:8]}@example.com"
tokens = operator.call("POST", "/api/subscriptions", {"email": email, "purpose": "newsletter", "noticeVersion": "notice-v1", "source": "local-demo"})
campaign = operator.call("POST", "/api/campaigns", {"name": "Monthly update", "subject": "September news", "purpose": "newsletter"})
path = f"/api/campaigns/{campaign['id']}/audience"
before = operator.call("GET", path)["eligibleContacts"]
operator.call("POST", "/api/consents/confirm", {"token": tokens["confirmationToken"]})
assert operator.call("GET", path)["eligibleContacts"] == before + 1
operator.call("POST", "/api/consents/confirm", {"token": tokens["confirmationToken"]}, expected=400)
operator.call("POST", "/api/consents/withdraw", {"token": tokens["withdrawalToken"]})
assert operator.call("GET", path)["eligibleContacts"] == before
operator.call("GET", "/api/consent-events", expected=403)
reviewer.call("GET", "/api/subscriptions", expected=403)
print("Confirmation, withdrawal, campaign eligibility and role restrictions passed.")
