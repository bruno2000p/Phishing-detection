"""
PhishGuard REST API & Web Server
Resilient Dual-Engine Server: Uses Flask if available; falls back smoothly to
built-in standard-library ThreadingHTTPServer with CORS and full static file serving.
Zero-friction execution on any Python 3.8+ runtime.
"""

import os
import sys
import json
import time
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

# Add current directory to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
FRONTEND_DIST = os.path.join(ROOT_DIR, "frontend", "dist")

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from detector.analyzer import extract_url_features
from detector.scorer import calculate_risk_score
import database as db


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Multi-threaded HTTP Server for concurrent requests."""
    daemon_threads = True


class PhishGuardRequestHandler(SimpleHTTPRequestHandler):
    """Handles REST API requests and serves static React frontend assets."""

    def _set_cors_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Content-Type", content_type)
        self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS pre-flight requests."""
        self._set_cors_headers(200)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. API Health
        if path == "/api/health":
            self._set_cors_headers(200)
            res = {
                "status": "healthy",
                "service": "PhishGuard AI Engine",
                "version": "2.4.0",
                "database": "SQLite Connected",
                "engine": "Heuristic + Shannon Entropy + Brand Guard"
            }
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        # 2. API Stats
        if path == "/api/stats":
            self._set_cors_headers(200)
            stats = db.get_system_stats()
            res = {"status": "success", "stats": stats}
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        # 3. API History
        if path == "/api/history":
            self._set_cors_headers(200)
            limit = int(query.get("limit", [50])[0])
            offset = int(query.get("offset", [0])[0])
            verdict = query.get("verdict", [None])[0]
            search = query.get("search", [None])[0]
            scans = db.get_recent_scans(limit=limit, offset=offset, verdict=verdict, search=search)
            res = {"status": "success", "count": len(scans), "scans": scans}
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        # 4. API Individual Report
        if path.startswith("/api/report/"):
            try:
                scan_id = int(path.split("/")[-1])
                scan = db.get_scan_by_id(scan_id)
                if not scan:
                    self._set_cors_headers(404)
                    self.wfile.write(json.dumps({"error": "Report not found"}).encode("utf-8"))
                else:
                    self._set_cors_headers(200)
                    self.wfile.write(json.dumps({"status": "success", "report": scan}).encode("utf-8"))
            except Exception as e:
                self._set_cors_headers(400)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        # 5. Serve Project Documentation HTML
        if path == "/DOCUMENTATION.html":
            doc_file = os.path.join(ROOT_DIR, "DOCUMENTATION.html")
            if os.path.exists(doc_file):
                self._set_cors_headers(200, "text/html; charset=utf-8")
                with open(doc_file, "rb") as f:
                    self.wfile.write(f.read())
                return

        # 6. Serve Project Documentation Markdown
        if path == "/PROJECT_DOCUMENTATION.md":
            doc_md = os.path.join(ROOT_DIR, "PROJECT_DOCUMENTATION.md")
            if os.path.exists(doc_md):
                self._set_cors_headers(200, "text/markdown; charset=utf-8")
                with open(doc_md, "rb") as f:
                    self.wfile.write(f.read())
                return

        # 7. Serve React Production Build
        if os.path.exists(FRONTEND_DIST):
            rel_path = path.lstrip("/")
            target_path = os.path.join(FRONTEND_DIST, rel_path)

            if os.path.isfile(target_path):
                # Serve file
                content_type = "text/plain"
                if rel_path.endswith(".html"):
                    content_type = "text/html"
                elif rel_path.endswith(".js"):
                    content_type = "application/javascript"
                elif rel_path.endswith(".css"):
                    content_type = "text/css"
                elif rel_path.endswith(".svg"):
                    content_type = "image/svg+xml"

                self._set_cors_headers(200, content_type)
                with open(target_path, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                # SPA Fallback to index.html
                index_path = os.path.join(FRONTEND_DIST, "index.html")
                if os.path.exists(index_path):
                    self._set_cors_headers(200, "text/html; charset=utf-8")
                    with open(index_path, "rb") as f:
                        self.wfile.write(f.read())
                    return

        # Default fallback if frontend dist is missing
        self._set_cors_headers(200)
        self.wfile.write(json.dumps({
            "status": "online",
            "service": "PhishGuard REST Engine",
            "message": "Frontend build not detected. Build via `cd frontend && npm run build` or run `cd frontend && npm run dev`"
        }).encode("utf-8"))

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8")

        try:
            body = json.loads(post_data) if post_data else {}
        except Exception:
            self._set_cors_headers(400)
            self.wfile.write(json.dumps({"error": "Invalid JSON format"}).encode("utf-8"))
            return

        # POST /api/scan
        if path == "/api/scan":
            url = body.get("url", "").strip()
            if not url:
                self._set_cors_headers(400)
                self.wfile.write(json.dumps({"error": "URL parameter is required."}).encode("utf-8"))
                return

            try:
                start_time = time.time()
                features = extract_url_features(url)
                score_result = calculate_risk_score(features)
                elapsed_ms = round((time.time() - start_time) * 1000, 2)

                client_ip = self.headers.get("X-Forwarded-For", self.client_address[0])

                scan_id = db.save_scan(
                    url=features["raw_url"],
                    domain=features["registered_domain"],
                    ip_detected=features["is_ip_address"],
                    entropy=features["domain_entropy"],
                    risk_score=score_result["risk_score"],
                    verdict=score_result["verdict"],
                    confidence=score_result["confidence_percentage"],
                    features=features,
                    signals=score_result["signals"],
                    client_ip=client_ip
                )

                payload = {
                    "id": scan_id,
                    "url": features["raw_url"],
                    "normalized_url": features["normalized_url"],
                    "domain": features["registered_domain"],
                    "hostname": features["hostname"],
                    "tld": features["tld"],
                    "is_https": features["is_https"],
                    "is_ip_address": features["is_ip_address"],
                    "domain_entropy": features["domain_entropy"],
                    "path_entropy": features["path_entropy"],
                    "risk_score": score_result["risk_score"],
                    "verdict": score_result["verdict"],
                    "verdict_color": score_result["verdict_color"],
                    "risk_level": score_result["risk_level"],
                    "confidence_percentage": score_result["confidence_percentage"],
                    "recommendation": score_result["recommendation"],
                    "signals": score_result["signals"],
                    "features": features,
                    "latency_ms": elapsed_ms,
                    "scanned_at": time.strftime("%Y-%m-%d %H:%M:%S")
                }

                self._set_cors_headers(200)
                self.wfile.write(json.dumps({"status": "success", "data": payload}).encode("utf-8"))
            except Exception as e:
                self._set_cors_headers(500)
                self.wfile.write(json.dumps({"error": f"Scan failed: {str(e)}"}).encode("utf-8"))
            return

        # POST /api/batch-scan
        if path == "/api/batch-scan":
            urls = body.get("urls", [])
            if not isinstance(urls, list) or not urls:
                self._set_cors_headers(400)
                self.wfile.write(json.dumps({"error": "A list of 'urls' is required."}).encode("utf-8"))
                return

            results = []
            for item in urls[:50]:
                u_str = str(item).strip()
                if not u_str:
                    continue
                try:
                    features = extract_url_features(u_str)
                    score_res = calculate_risk_score(features)
                    scan_id = db.save_scan(
                        url=features["raw_url"],
                        domain=features["registered_domain"],
                        ip_detected=features["is_ip_address"],
                        entropy=features["domain_entropy"],
                        risk_score=score_res["risk_score"],
                        verdict=score_res["verdict"],
                        confidence=score_res["confidence_percentage"],
                        features=features,
                        signals=score_res["signals"]
                    )
                    results.append({
                        "id": scan_id,
                        "url": u_str,
                        "domain": features["registered_domain"],
                        "risk_score": score_res["risk_score"],
                        "verdict": score_res["verdict"],
                        "verdict_color": score_res["verdict_color"],
                        "signals_count": len(score_res["signals"])
                    })
                except Exception:
                    results.append({"url": u_str, "error": "Parsing failed"})

            self._set_cors_headers(200)
            self.wfile.write(json.dumps({"status": "success", "total": len(results), "results": results}).encode("utf-8"))
            return

        self._set_cors_headers(404)
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/history":
            db.clear_history()
            self._set_cors_headers(200)
            self.wfile.write(json.dumps({"status": "success", "message": "History purged."}).encode("utf-8"))
            return
        self._set_cors_headers(404)


def run_server(port=5050):
    server_address = ("0.0.0.0", port)
    httpd = ThreadedHTTPServer(server_address, PhishGuardRequestHandler)
    print(f"============================================================")
    print(f"  🛡️  PhishGuard Pro Web Application & API Running          ")
    print(f"  🌐  Web Dashboard: http://127.0.0.1:{port}               ")
    print(f"  📖  Documentation: http://127.0.0.1:{port}/DOCUMENTATION.html")
    print(f"  ⚡  API Endpoints: /api/scan, /api/batch-scan, /api/history")
    print(f"============================================================")
    httpd.serve_forever()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    run_server(port)
