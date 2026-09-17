"""
PhishGuard Feature Extractor & URL Anatomy Analyzer
Extracts comprehensive lexical, statistical, syntactic, and structural signals from candidate URLs.
"""

import re
import math
from urllib.parse import urlparse, parse_qs
from collections import Counter
from .keywords import PHISHING_KEYWORDS, HIGH_RISK_TLDS, TRUSTED_TLDS, URL_SHORTENERS
from .brands import detect_brand_spoofing


def calculate_shannon_entropy(text: str) -> float:
    """
    Calculates the Shannon entropy of a string:
    H(X) = -sum(p(x) * log2(p(x)))
    Higher entropy (> 3.8) suggests randomized strings / DGA (Domain Generation Algorithms).
    """
    if not text:
        return 0.0
    
    length = len(text)
    counts = Counter(text)
    entropy = 0.0
    for count in counts.values():
        p_x = count / length
        entropy -= p_x * math.log2(p_x)
    return round(entropy, 3)


def is_ip_address(hostname: str) -> bool:
    """Detects whether hostname is an IPv4 or IPv6 address instead of a standard domain."""
    if not hostname:
        return False
    
    # Strip optional port
    host_clean = hostname.split(':')[0]

    # IPv4 Pattern
    ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    if re.match(ipv4_pattern, host_clean):
        parts = host_clean.split('.')
        return all(0 <= int(part) <= 255 for part in parts)

    # IPv6 simplified check
    if ':' in host_clean and len(host_clean) > 3:
        return True

    # Hex/Octal obfuscated IP checks (e.g. 0x7f000001, 017700000001)
    if host_clean.startswith("0x") or (host_clean.isdigit() and len(host_clean) >= 8):
        return True

    return False


def extract_registered_domain(hostname: str) -> tuple:
    """
    Extracts registered domain (SLD + TLD), subdomains, and TLD.
    e.g. 'auth.secure.paypal.com' -> ('paypal.com', ['auth', 'secure'], 'com')
    """
    if not hostname or is_ip_address(hostname):
        return hostname, [], ""

    parts = hostname.lower().split('.')
    if len(parts) <= 1:
        return hostname, [], ""

    # Check for two-part TLDs (e.g. co.uk, com.au, gov.us, org.za)
    two_part_tlds = {"co.uk", "gov.uk", "ac.uk", "com.au", "net.au", "co.nz", "com.br", "co.za"}
    if len(parts) >= 3 and f"{parts[-2]}.{parts[-1]}" in two_part_tlds:
        tld = f"{parts[-2]}.{parts[-1]}"
        registered_domain = f"{parts[-3]}.{tld}"
        subdomains = parts[:-3]
    else:
        tld = parts[-1]
        registered_domain = f"{parts[-2]}.{tld}" if len(parts) >= 2 else hostname
        subdomains = parts[:-2] if len(parts) >= 2 else []

    return registered_domain, subdomains, tld


def extract_url_features(raw_url: str) -> dict:
    """
    Parses and extracts deep static/heuristic features from a candidate URL.
    Returns a standardized dictionary of structural, lexical, and behavioral indicators.
    """
    # 1. Normalization
    url = raw_url.strip()
    if not url.startswith(("http://", "https://", "ftp://")):
        url = "http://" + url  # Default scheme for parsing

    parsed = urlparse(url)
    hostname = parsed.netloc or ""
    path = parsed.path or ""
    query = parsed.query or ""
    scheme = parsed.scheme.lower()

    # Hostname cleaning (remove port if present)
    host_without_port = hostname.split(':')[0] if ':' in hostname else hostname
    port = parsed.port

    registered_domain, subdomains, tld = extract_registered_domain(host_without_port)
    is_ip = is_ip_address(host_without_port)

    # 2. Lexical & Statistical Features
    url_length = len(raw_url)
    host_length = len(host_without_port)
    path_length = len(path)
    
    count_dots = raw_url.count('.')
    count_hyphens = raw_url.count('-')
    count_underscores = raw_url.count('_')
    count_at = raw_url.count('@')
    count_percent = raw_url.count('%')
    count_question = raw_url.count('?')
    count_equal = raw_url.count('=')
    count_digits = sum(c.isdigit() for c in raw_url)
    digit_ratio = round(count_digits / max(url_length, 1), 3)

    # Obfuscation: Double slash in path redirect (e.g. http://legit.com//attacker.com)
    has_double_slash_redirect = "//" in path

    # Obfuscation: @ symbol used to redirect (everything before @ is ignored by browser)
    has_at_symbol = count_at > 0

    # 3. Entropy Analysis
    domain_entropy = calculate_shannon_entropy(host_without_port)
    path_entropy = calculate_shannon_entropy(path)

    # 4. Shortener Detection
    is_shortener = host_without_port.lower() in URL_SHORTENERS

    # 5. TLD Reputation
    tld_lower = tld.lower()
    is_high_risk_tld = tld_lower in HIGH_RISK_TLDS
    is_trusted_tld = tld_lower in TRUSTED_TLDS

    # 6. Keyword Identification
    detected_keywords = {}
    total_suspicious_keywords = 0
    searchable_content = f"{raw_url.lower()} {host_without_port.lower()} {path.lower()} {query.lower()}"

    for category, terms in PHISHING_KEYWORDS.items():
        found = [term for term in terms if term in searchable_content]
        if found:
            detected_keywords[category] = found
            total_suspicious_keywords += len(found)

    # 7. Brand Impersonation & Typosquatting
    brand_check = detect_brand_spoofing(registered_domain, host_without_port, path)

    # 8. Assemble Feature Dictionary
    return {
        "raw_url": raw_url,
        "normalized_url": url,
        "scheme": scheme,
        "is_https": scheme == "https",
        "hostname": host_without_port,
        "port": port,
        "path": path,
        "query": query,
        "registered_domain": registered_domain,
        "subdomains": subdomains,
        "subdomain_count": len(subdomains),
        "tld": tld,
        "is_ip_address": is_ip,
        "is_shortener": is_shortener,
        "is_high_risk_tld": is_high_risk_tld,
        "is_trusted_tld": is_trusted_tld,
        "url_length": url_length,
        "host_length": host_length,
        "path_length": path_length,
        "count_dots": count_dots,
        "count_hyphens": count_hyphens,
        "count_underscores": count_underscores,
        "count_at": count_at,
        "has_at_symbol": has_at_symbol,
        "count_percent": count_percent,
        "count_question": count_question,
        "count_equal": count_equal,
        "digit_ratio": digit_ratio,
        "has_double_slash_redirect": has_double_slash_redirect,
        "domain_entropy": domain_entropy,
        "path_entropy": path_entropy,
        "detected_keywords": detected_keywords,
        "total_suspicious_keywords": total_suspicious_keywords,
        "brand_spoofing": brand_check
    }
