"""
PhishGuard Automated Unit & Integration Tests
Validates feature extraction, Shannon entropy calculation, brand typosquatting detection,
risk scoring calibration, and database persistence.
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from detector.analyzer import (
    extract_url_features,
    calculate_shannon_entropy,
    is_ip_address,
    extract_registered_domain
)
from detector.brands import detect_brand_spoofing, levenshtein_distance
from detector.scorer import calculate_risk_score
import database as db


class TestPhishGuardDetector(unittest.TestCase):

    def test_shannon_entropy(self):
        # Repetitive string has low entropy
        low_ent = calculate_shannon_entropy("aaaaaaa")
        self.assertEqual(low_ent, 0.0)

        # Natural English domain has moderate entropy (~2.5 - 3.2)
        google_ent = calculate_shannon_entropy("google.com")
        self.assertTrue(2.0 < google_ent < 3.5)

        # DGA pseudo-random string has high entropy (> 3.5)
        dga_ent = calculate_shannon_entropy("x8q2z9wbv0a1ckp7")
        self.assertTrue(dga_ent > 3.5)

    def test_ip_address_detection(self):
        self.assertTrue(is_ip_address("192.168.1.1"))
        self.assertTrue(is_ip_address("10.0.0.1:8080"))
        self.assertTrue(is_ip_address("142.250.190.46"))
        self.assertFalse(is_ip_address("google.com"))
        self.assertFalse(is_ip_address("paypal-security.com"))

    def test_registered_domain_extraction(self):
        domain, subs, tld = extract_registered_domain("account.verify.paypal.com")
        self.assertEqual(domain, "paypal.com")
        self.assertEqual(subs, ["account", "verify"])
        self.assertEqual(tld, "com")

        # Two-part TLD
        domain_uk, subs_uk, tld_uk = extract_registered_domain("news.bbc.co.uk")
        self.assertEqual(domain_uk, "bbc.co.uk")
        self.assertEqual(subs_uk, ["news"])
        self.assertEqual(tld_uk, "co.uk")

    def test_brand_typosquatting(self):
        # Exact spoof via lookalike character '1' for 'l'
        res1 = detect_brand_spoofing("paypa1.com", "paypa1.com", "/")
        self.assertTrue(res1["impersonated"])
        self.assertEqual(res1["brand"], "Paypal")

        # Combosquatting
        res2 = detect_brand_spoofing("paypal-security-update.com", "paypal-security-update.com", "/")
        self.assertTrue(res2["impersonated"])
        self.assertEqual(res2["type"], "Combosquatting")

        # Authentic domain should NOT be flagged
        res_legit = detect_brand_spoofing("paypal.com", "paypal.com", "/")
        self.assertFalse(res_legit["impersonated"])

    def test_legitimate_url_classification(self):
        legit_urls = [
            "https://www.google.com",
            "https://github.com/torvalds/linux",
            "https://en.wikipedia.org/wiki/Phishing",
            "https://www.harvard.edu"
        ]
        for u in legit_urls:
            feats = extract_url_features(u)
            res = calculate_risk_score(feats)
            self.assertEqual(res["verdict"], "SAFE", f"Failed for {u}: score {res['risk_score']}")
            self.assertLess(res["risk_score"], 30)

    def test_phishing_url_classification(self):
        phishing_urls = [
            "http://paypa1-security-verification.xyz/login/index.php",
            "http://192.168.1.1/banking/chase/verify-account.html",
            "http://appleid.apple.com.attacker-controlled.top/auth/passcode",
            "http://netflix-billing-update-urgent.click/billing"
        ]
        for u in phishing_urls:
            feats = extract_url_features(u)
            res = calculate_risk_score(feats)
            self.assertIn(res["verdict"], ["PHISHING", "SUSPICIOUS"], f"Failed for {u}: score {res['risk_score']}")
            self.assertGreaterEqual(res["risk_score"], 50)

    def test_obfuscation_detection(self):
        url = "http://legit-site.com@evil-hacker.com/login"
        feats = extract_url_features(url)
        self.assertTrue(feats["has_at_symbol"])
        res = calculate_risk_score(feats)
        self.assertTrue(any(s["title"] == "Deceptive '@' Character" for s in res["signals"]))

    def test_database_persistence(self):
        test_url = "https://test-persisted-scan.org"
        feats = extract_url_features(test_url)
        res = calculate_risk_score(feats)
        
        scan_id = db.save_scan(
            url=test_url,
            domain=feats["registered_domain"],
            ip_detected=feats["is_ip_address"],
            entropy=feats["domain_entropy"],
            risk_score=res["risk_score"],
            verdict=res["verdict"],
            confidence=res["confidence_percentage"],
            features=feats,
            signals=res["signals"]
        )
        self.assertIsNotNone(scan_id)

        retrieved = db.get_scan_by_id(scan_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["url"], test_url)
        self.assertEqual(retrieved["verdict"], res["verdict"])


if __name__ == "__main__":
    unittest.main()
