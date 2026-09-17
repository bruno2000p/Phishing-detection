"""
PhishGuard Brand Protection & Typosquatting Detection Module
Identifies brand spoofing, lookalike domains (combosquatting, typosquatting), and homoglyph tricks.
"""

# Globally recognized high-value brands frequently targeted in phishing campaigns
TARGETED_BRANDS = {
    # Financial & Payments
    "paypal": ["paypal.com", "paypal.me"],
    "chase": ["chase.com"],
    "wellsfargo": ["wellsfargo.com"],
    "bankofamerica": ["bankofamerica.com"],
    "citibank": ["citi.com", "citibank.com"],
    "capitalone": ["capitalone.com"],
    "americanexpress": ["americanexpress.com", "amex.com"],
    "stripe": ["stripe.com"],
    "square": ["squareup.com", "square.com"],
    "venmo": ["venmo.com"],
    "revolut": ["revolut.com"],
    "wise": ["wise.com", "transferwise.com"],
    
    # Technology & Cloud
    "google": ["google.com", "google.co.uk", "accounts.google.com"],
    "microsoft": ["microsoft.com", "live.com", "office.com", "outlook.com"],
    "apple": ["apple.com", "icloud.com"],
    "amazon": ["amazon.com", "amazon.co.uk", "amazon.de"],
    "meta": ["meta.com", "facebook.com", "instagram.com", "whatsapp.com"],
    "facebook": ["facebook.com", "fb.com"],
    "instagram": ["instagram.com"],
    "whatsapp": ["whatsapp.com"],
    "netflix": ["netflix.com"],
    "spotify": ["spotify.com"],
    "twitter": ["twitter.com", "x.com"],
    "linkedin": ["linkedin.com"],
    "dropbox": ["dropbox.com"],
    "adobe": ["adobe.com"],
    "docusign": ["docusign.com"],
    "zoom": ["zoom.us"],
    "github": ["github.com"],
    "gitlab": ["gitlab.com"],
    
    # Cryptocurrency & Exchanges
    "binance": ["binance.com"],
    "coinbase": ["coinbase.com"],
    "kraken": ["kraken.com"],
    "metamask": ["metamask.io"],
    "opensea": ["opensea.io"],
    "blockchain": ["blockchain.com"],
    "ledger": ["ledger.com"],
    "trezor": ["trezor.io"],
    
    # Shipping & Logistics
    "dhl": ["dhl.com"],
    "fedex": ["fedex.com"],
    "ups": ["ups.com"],
    "usps": ["usps.com"]
}

# Common character visual substitutions in phishing
CHAR_SUBSTITUTIONS = {
    '0': 'o',
    '1': 'l',
    'i': 'l',
    'l': '1',
    '3': 'e',
    '4': 'a',
    '@': 'a',
    '5': 's',
    '$': 's',
    '8': 'b',
    'vv': 'w',
    'rn': 'm',
    'cl': 'd'
}


def levenshtein_distance(s1: str, s2: str) -> int:
    """Computes the classic Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def normalize_substitutions(text: str) -> str:
    """Normalize common visual character substitutions (leetspeak/homoglyphs)."""
    normalized = text.lower()
    for pseudo, legit in CHAR_SUBSTITUTIONS.items():
        normalized = normalized.replace(pseudo, legit)
    return normalized


def detect_brand_spoofing(registered_domain: str, full_host: str, url_path: str):
    """
    Analyzes whether a domain or URL is impersonating a known brand.
    Returns:
      is_impersonating (bool),
      brand_name (str or None),
      impersonation_type (str or None),
      details (str)
    """
    host_clean = full_host.lower().strip()
    path_clean = url_path.lower().strip()
    domain_clean = registered_domain.lower().strip()

    # If the domain is legitimately ANY known brand's authentic domain, it is NOT an impersonator
    for _, legit_list in TARGETED_BRANDS.items():
        if any(host_clean == ld or host_clean.endswith('.' + ld) or domain_clean == ld for ld in legit_list):
            return {
                "impersonated": False,
                "brand": None,
                "type": None,
                "details": "Authentic verified brand domain"
            }

    # Extract base name without TLD (e.g. 'paypal' from 'paypal.com' or 'paypa1' from 'paypa1.xyz')
    sld = domain_clean.split('.')[0] if '.' in domain_clean else domain_clean
    normalized_sld = normalize_substitutions(sld)

    for brand, legit_domains in TARGETED_BRANDS.items():
        # 1. Combosquatting: Brand name appears embedded inside a non-legitimate domain
        # e.g., 'paypal-security.com' or 'login-paypal-verify.com'
        if brand in domain_clean and domain_clean not in legit_domains:
            return {
                "impersonated": True,
                "brand": brand.title(),
                "type": "Combosquatting",
                "details": f"Target brand '{brand.title()}' appears in foreign domain '{domain_clean}'"
            }

        # 2. Subdomain abuse: Brand name used as a subdomain on another host
        # e.g., 'paypal.com.attacker-controlled.xyz'
        if brand in host_clean and brand not in domain_clean:
            return {
                "impersonated": True,
                "brand": brand.title(),
                "type": "Subdomain Impersonation",
                "details": f"Target brand '{brand.title()}' masquerades as subdomain under '{domain_clean}'"
            }

        # 3. Typosquatting / Levenshtein edit distance check on SLD
        # e.g., 'paypa1', 'peypal', 'amazom', 'micros0ft'
        dist_direct = levenshtein_distance(sld, brand)
        dist_norm = levenshtein_distance(normalized_sld, brand)
        
        min_dist = min(dist_direct, dist_norm)
        # Stricter threshold: edit distance 1 for <= 7 chars, 2 for >= 8 chars
        threshold = 1 if len(brand) <= 7 else 2

        if min_dist <= threshold and sld != brand and len(sld) >= 3:
            return {
                "impersonated": True,
                "brand": brand.title(),
                "type": "Typosquatting (Lookalike)",
                "details": f"Domain '{domain_clean}' has an edit distance of {min_dist} to authentic brand '{brand.title()}'"
            }

        # 4. Path impersonation when combined with sensitive actions
        if f"/{brand}/" in path_clean or f"/{brand}-" in path_clean or f"-{brand}/" in path_clean:
            return {
                "impersonated": True,
                "brand": brand.title(),
                "type": "Path Brand Masquerading",
                "details": f"Brand token '{brand.title()}' placed prominently in URL path on untrusted host '{domain_clean}'"
            }

    return {
        "impersonated": False,
        "brand": None,
        "type": None,
        "details": "No brand impersonation detected"
    }
