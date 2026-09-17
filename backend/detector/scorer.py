"""
PhishGuard Risk Scoring & Decision Engine
Evaluates multi-factor heuristic, statistical, and brand intelligence features
to compute a calibrated threat score (0-100) and authoritative security verdict.
"""

from typing import Dict, Any, List


def calculate_risk_score(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a risk score between 0 and 100 based on extracted URL features.
    Categorizes threat severity:
      - 0 to 29: SAFE
      - 30 to 59: SUSPICIOUS
      - 60 to 100: PHISHING / MALICIOUS
    Returns score, verdict, confidence, triggered threat indicators, and mitigation advice.
    """
    score = 0
    signals: List[Dict[str, Any]] = []

    # 1. Direct IP Address Host (Critical Risk)
    if features.get("is_ip_address"):
        pts = 35
        score += pts
        signals.append({
            "category": "Host Identity",
            "severity": "CRITICAL",
            "points": pts,
            "title": "Direct IP Address as Hostname",
            "description": f"URL connects directly to IP '{features['hostname']}' instead of a registered domain name, a hallmark of malicious infrastructure."
        })

    # 2. Brand Impersonation & Typosquatting (Critical Risk)
    brand_spoof = features.get("brand_spoofing", {})
    if brand_spoof.get("impersonated"):
        b_type = brand_spoof.get("type", "Impersonation")
        if b_type == "Typosquatting (Lookalike)":
            pts = 45
        elif b_type == "Combosquatting":
            pts = 40
        elif b_type == "Subdomain Impersonation":
            pts = 35
        else:
            pts = 25
        score += pts
        signals.append({
            "category": "Brand Protection",
            "severity": "CRITICAL",
            "points": pts,
            "title": f"Target Brand Spoofing ({b_type})",
            "description": brand_spoof.get("details")
        })

    # 3. Obfuscation Techniques
    if features.get("has_at_symbol"):
        pts = 25
        score += pts
        signals.append({
            "category": "URL Obfuscation",
            "severity": "HIGH",
            "points": pts,
            "title": "Deceptive '@' Character",
            "description": "The URL contains an '@' symbol, which causes modern browsers to treat prior text as credentials and redirect to trailing host."
        })

    if features.get("has_double_slash_redirect"):
        pts = 20
        score += pts
        signals.append({
            "category": "URL Obfuscation",
            "severity": "HIGH",
            "points": pts,
            "title": "Embedded Double-Slash Redirection",
            "description": "Path contains '//' which can be exploited to force open-redirects to an external attacker-controlled landing page."
        })

    if features.get("count_percent", 0) >= 3:
        pts = 15
        score += pts
        signals.append({
            "category": "URL Obfuscation",
            "severity": "MEDIUM",
            "points": pts,
            "title": "Excessive Hex/Percent Encoding",
            "description": f"URL exhibits {features['count_percent']} percent-encoded sequences, often employed to evade keyword boundary filters."
        })

    # 4. Domain & URL Length Anomalies
    url_len = features.get("url_length", 0)
    if url_len > 120:
        pts = 18
        score += pts
        signals.append({
            "category": "Lexical Structure",
            "severity": "MEDIUM",
            "points": pts,
            "title": "Extremely Long URL",
            "description": f"Overall URL length is {url_len} characters (abnormal length > 120 chars)."
        })
    elif url_len > 75:
        pts = 10
        score += pts
        signals.append({
            "category": "Lexical Structure",
            "severity": "LOW",
            "points": pts,
            "title": "Elevated URL Length",
            "description": f"URL length is {url_len} characters (standard safe URLs are typically < 75 chars)."
        })

    # 5. Punctuation and Subdomain Flood
    dots = features.get("count_dots", 0)
    if dots >= 5:
        pts = 18
        score += pts
        signals.append({
            "category": "Lexical Structure",
            "severity": "HIGH",
            "points": pts,
            "title": "Abnormal Dot Delimiter Count",
            "description": f"Detected {dots} dots in URL, indicating deeply nested host camouflage."
        })
    elif dots >= 3:
        pts = 8
        score += pts

    hyphens = features.get("count_hyphens", 0)
    if hyphens >= 3:
        pts = 14
        score += pts
        signals.append({
            "category": "Lexical Structure",
            "severity": "MEDIUM",
            "points": pts,
            "title": "Excessive Hyphen Usage",
            "description": f"Domain or path utilizes {hyphens} hyphens, commonly used to combine brand names with security terms."
        })

    subdomains = features.get("subdomain_count", 0)
    if subdomains >= 3:
        pts = 20
        score += pts
        signals.append({
            "category": "DNS & Architecture",
            "severity": "HIGH",
            "points": pts,
            "title": "Deep Subdomain Nesting",
            "description": f"Host has {subdomains} subdomain levels ({', '.join(features.get('subdomains', []))})."
        })

    # 6. High-Risk TLD
    if features.get("is_high_risk_tld"):
        pts = 25
        score += pts
        signals.append({
            "category": "TLD Reputation",
            "severity": "HIGH",
            "points": pts,
            "title": f"High-Risk Top-Level Domain (.{features.get('tld')})",
            "description": f"The TLD '.{features.get('tld')}' is statistically prevalent among automated cybercrime and spam campaigns."
        })

    # 7. Shannon Entropy (Random DGA Domain)
    domain_entropy = features.get("domain_entropy", 0.0)
    if domain_entropy >= 3.8 and not features.get("is_ip_address"):
        pts = 22
        score += pts
        signals.append({
            "category": "Statistical Heuristics",
            "severity": "HIGH",
            "points": pts,
            "title": "High Domain Shannon Entropy",
            "description": f"Domain entropy of {domain_entropy} bits/char indicates pseudo-random character generation (DGA) or cryptographic hashes."
        })
    elif domain_entropy >= 3.4 and not features.get("is_ip_address"):
        pts = 10
        score += pts
        signals.append({
            "category": "Statistical Heuristics",
            "severity": "LOW",
            "points": pts,
            "title": "Moderate Domain Entropy",
            "description": f"Domain entropy is {domain_entropy}, exhibiting higher randomness than natural language domains."
        })

    # 8. High-Risk Phishing Keywords
    detected_kw = features.get("detected_keywords", {})
    cred_theft = detected_kw.get("credential_theft", [])
    financial = detected_kw.get("financial_banking", [])
    urgency = detected_kw.get("urgency_and_security", [])
    tech_spoof = detected_kw.get("tech_impersonation", [])

    if cred_theft:
        pts = min(len(cred_theft) * 12, 24)
        score += pts
        signals.append({
            "category": "Social Engineering",
            "severity": "HIGH",
            "points": pts,
            "title": "Credential Harvest Keywords",
            "description": f"Detected sensitive authentication terms: {', '.join(cred_theft)}."
        })

    if financial:
        pts = min(len(financial) * 10, 20)
        score += pts
        signals.append({
            "category": "Social Engineering",
            "severity": "HIGH",
            "points": pts,
            "title": "Financial & Payment Tokens",
            "description": f"Detected financial tokens: {', '.join(financial)}."
        })

    if urgency:
        pts = min(len(urgency) * 8, 16)
        score += pts
        signals.append({
            "category": "Social Engineering",
            "severity": "MEDIUM",
            "points": pts,
            "title": "Urgency & Account Lock Bait",
            "description": f"Detected psychological urgency cues: {', '.join(urgency)}."
        })

    if tech_spoof:
        pts = 20
        score += pts
        signals.append({
            "category": "Social Engineering",
            "severity": "HIGH",
            "points": pts,
            "title": "Enterprise Cloud Impersonation",
            "description": f"Detected corporate service tokens: {', '.join(tech_spoof)}."
        })

    # 9. URL Shortener Service
    if features.get("is_shortener"):
        pts = 15
        score += pts
        signals.append({
            "category": "Evasion Mechanism",
            "severity": "MEDIUM",
            "points": pts,
            "title": "URL Shortener / Destination Concealment",
            "description": f"Host '{features['hostname']}' obscures the real endpoint, masking potential malware or phishing forms."
        })

    # 10. Protocol Security (HTTP vs HTTPS)
    if not features.get("is_https"):
        if cred_theft or financial or brand_spoof.get("impersonated"):
            pts = 18
            score += pts
            signals.append({
                "category": "Transport Security",
                "severity": "HIGH",
                "points": pts,
                "title": "Unencrypted HTTP on Sensitive Resource",
                "description": "Site does not use TLS encryption while requesting credentials, financial details, or sensitive interactions."
            })
        else:
            pts = 8
            score += pts
            signals.append({
                "category": "Transport Security",
                "severity": "LOW",
                "points": pts,
                "title": "Insecure Cleartext Protocol (HTTP)",
                "description": "URL uses plain HTTP instead of secure HTTPS."
            })

    # 11. Trusted Offsets
    if features.get("is_trusted_tld") and not brand_spoof.get("impersonated") and not features.get("is_ip_address"):
        score = max(0, score - 30)
        signals.append({
            "category": "Trust Baseline",
            "severity": "SAFE",
            "points": -30,
            "title": f"Verified Institutional Domain (.{features.get('tld')})",
            "description": "Domain resides under an authoritative educational (.edu) or governmental (.gov) namespace."
        })

    # Normalize final score between 0 and 100
    final_score = min(max(score, 0), 100)

    # Determine Verdict
    if final_score >= 60:
        verdict = "PHISHING"
        verdict_color = "red"
        risk_level = "High / Critical Risk"
        recommendation = "DO NOT OPEN. This link shows clear indicators of phishing or malicious masquerading. Entering credentials here may lead to identity theft."
    elif final_score >= 30:
        verdict = "SUSPICIOUS"
        verdict_color = "amber"
        risk_level = "Moderate Risk"
        recommendation = "PROCEED WITH EXTREME CAUTION. Multiple heuristic anomalies were identified. Verify the source before interacting."
    else:
        verdict = "SAFE"
        verdict_color = "green"
        risk_level = "Low Risk"
        recommendation = "This URL exhibits standard legitimate structure and zero major red flags. Standard web browsing precautions apply."

    # Confidence calculation based on indicator density
    confidence = min(round(65 + (len(signals) * 5), 1), 99.5)

    return {
        "risk_score": final_score,
        "verdict": verdict,
        "verdict_color": verdict_color,
        "risk_level": risk_level,
        "confidence_percentage": confidence,
        "recommendation": recommendation,
        "signals_count": len(signals),
        "signals": signals
    }
