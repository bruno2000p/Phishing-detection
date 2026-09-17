"""
PhishGuard Threat Intelligence: Keywords and TLDs Dictionary
Contains heuristic rules, sensitive target tokens, and high-risk top-level domains.
"""

# Suspicious keywords frequently observed in phishing attacks
# Grouped by attack intent
PHISHING_KEYWORDS = {
    "credential_theft": [
        "login", "log-in", "signin", "sign-in", "logon", "signon",
        "auth", "authenticate", "authentication", "session", "passcode",
        "password", "credential", "verify", "verification", "confirm",
        "confirmation", "validate", "validation", "identity", "kyc"
    ],
    "financial_banking": [
        "bank", "banking", "paypal", "pay-pal", "chase", "wells", "citi",
        "secure-bank", "wallet", "crypto", "blockchain", "coinbase", "binance",
        "metamask", "trustwallet", "ledger", "wire", "transfer", "invoice",
        "receipt", "payment", "payout", "refund", "reimbursement", "card",
        "credit-card", "debit-card", "billing", "checkout"
    ],
    "urgency_and_security": [
        "security", "security-alert", "urgent", "immediate", "suspended",
        "suspension", "locked", "unlock", "restricted", "restriction",
        "unusual-activity", "breach", "compromised", "reactivate",
        "activation", "action-required", "notice", "alert", "warning"
    ],
    "account_management": [
        "account", "myaccount", "user", "profile", "update-account",
        "member", "portal", "support-desk", "helpdesk", "customer-service",
        "service-center", "client-area", "manage-account"
    ],
    "freebies_and_rewards": [
        "free", "gift", "giveaway", "reward", "prize", "claim",
        "bonus", "lottery", "promotion", "airdrop", "promo"
    ],
    "tech_impersonation": [
        "appleid", "icloud-find", "microsoft-online", "office365",
        "sharepoint", "onedrive-share", "google-drive-share", "docu-sign",
        "docusign-verify", "adobe-document", "zoom-meeting-invite"
    ]
}

# High-risk Top-Level Domains (TLDs) heavily correlated with malicious infrastructure
HIGH_RISK_TLDS = {
    "xyz", "top", "click", "loan", "work", "date", "fit", "gq", "ml", "cf",
    "ga", "tk", "men", "club", "surf", "buzz", "rest", "cam", "icu", "bar",
    "beauty", "quest", "cyou", "monster", "cfd", "sbs", "makeup", "hair"
}

# Trusted Top-Level Domains with rigorous vetting
TRUSTED_TLDS = {
    "gov", "edu", "mil", "ac.uk", "gov.uk", "edu.au", "gov.au"
}

# Known URL shortener services often leveraged to conceal malicious destinations
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly", "ow.ly",
    "rebrand.ly", "cutt.ly", "tiny.cc", "shorturl.at", "bl.ink", "tr.im"
}
