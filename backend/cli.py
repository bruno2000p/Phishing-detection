#!/usr/bin/env python3
"""
PhishGuard CLI - Command-Line Phishing URL Scanner
Usage:
    python3 cli.py <URL>
    python3 cli.py --batch urls.txt
"""

import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from detector.analyzer import extract_url_features
from detector.scorer import calculate_risk_score

# ANSI Color Codes
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner():
    banner = f"""{CYAN}{BOLD}
    ╔══════════════════════════════════════════════════════════╗
    ║                 🛡️  PHISHGUARD PRO CLI                   ║
    ║         Autonomous Phishing & URL Threat Scanner         ║
    ╚══════════════════════════════════════════════════════════╝{RESET}
    """
    print(banner)


def scan_single(url: str):
    print(f"\n{BOLD}[*] Scanning Target:{RESET} {url}")
    features = extract_url_features(url)
    res = calculate_risk_score(features)

    color = RED if res["verdict"] == "PHISHING" else (YELLOW if res["verdict"] == "SUSPICIOUS" else GREEN)
    print(f"\n{BOLD}VERDICT:{RESET} {color}{BOLD}{res['verdict']}{RESET} (Score: {color}{res['risk_score']}/100{RESET})")
    print(f"{BOLD}Risk Level:{RESET} {res['risk_level']}")
    print(f"{BOLD}Confidence:{RESET} {res['confidence_percentage']}%")
    print(f"{BOLD}Recommendation:{RESET} {res['recommendation']}")

    print(f"\n{CYAN}{BOLD}--- URL Forensic Breakdown ---{RESET}")
    print(f" • Domain: {features['registered_domain']}")
    print(f" • Hostname: {features['hostname']}")
    print(f" • Protocol: {'HTTPS (Encrypted)' if features['is_https'] else 'HTTP (Cleartext)'}")
    print(f" • IP Host Detected: {'YES' if features['is_ip_address'] else 'No'}")
    print(f" • Domain Shannon Entropy: {features['domain_entropy']} bits/char")
    print(f" • Subdomains ({features['subdomain_count']}): {', '.join(features['subdomains']) if features['subdomains'] else 'None'}")
    
    brand_spoof = features.get("brand_spoofing", {})
    if brand_spoof.get("impersonated"):
        print(f" • {RED}Brand Impersonation Alert:{RESET} {brand_spoof.get('details')}")

    if res["signals"]:
        print(f"\n{YELLOW}{BOLD}--- Triggered Threat Indicators ({len(res['signals'])}) ---{RESET}")
        for s in res["signals"]:
            p_color = RED if s["severity"] == "CRITICAL" else (YELLOW if s["severity"] == "HIGH" else RESET)
            print(f" [{p_color}{s['severity']}{RESET}] {s['title']} (+{s['points']} pts)")
            print(f"       ↳ {s['description']}")
    print()


def main():
    parser = argparse.ArgumentParser(description="PhishGuard Phishing URL Scanner CLI")
    parser.add_argument("url", nargs="?", help="URL to scan")
    parser.add_argument("--batch", help="File containing list of URLs to scan, one per line")

    args = parser.parse_args()
    print_banner()

    if args.batch:
        if not os.path.exists(args.batch):
            print(f"{RED}Error: File {args.batch} not found.{RESET}")
            sys.exit(1)
        with open(args.batch, "r") as f:
            urls = [line.strip() for line in f if line.strip()]
        for u in urls:
            scan_single(u)
    elif args.url:
        scan_single(args.url)
    else:
        # Prompt user
        test_url = input(f"{BOLD}Enter URL to inspect:{RESET} ").strip()
        if test_url:
            scan_single(test_url)


if __name__ == "__main__":
    main()
