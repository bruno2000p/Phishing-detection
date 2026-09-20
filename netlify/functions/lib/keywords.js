/**
 * PhishGuard Pro — Threat Intelligence Dictionary
 * Keywords, high-risk TLDs, URL shorteners, and targeted brands for phishing detection.
 */

const PHISHING_KEYWORDS = {
  credential_theft: [
    "login","log-in","signin","sign-in","logon","signon","auth","authenticate",
    "authentication","session","passcode","password","credential","verify",
    "verification","confirm","confirmation","validate","validation","identity","kyc"
  ],
  financial_banking: [
    "bank","banking","paypal","pay-pal","chase","wells","citi","secure-bank",
    "wallet","crypto","blockchain","coinbase","binance","metamask","trustwallet",
    "ledger","wire","transfer","invoice","receipt","payment","payout","refund",
    "reimbursement","card","credit-card","debit-card","billing","checkout"
  ],
  urgency_and_security: [
    "security","security-alert","urgent","immediate","suspended","suspension",
    "locked","unlock","restricted","restriction","unusual-activity","breach",
    "compromised","reactivate","activation","action-required","notice","alert","warning"
  ],
  account_management: [
    "account","myaccount","user","profile","update-account","member","portal",
    "support-desk","helpdesk","customer-service","service-center","client-area","manage-account"
  ],
  freebies_and_rewards: [
    "free","gift","giveaway","reward","prize","claim","bonus","lottery","promotion","airdrop","promo"
  ],
  tech_impersonation: [
    "appleid","icloud-find","microsoft-online","office365","sharepoint",
    "onedrive-share","google-drive-share","docu-sign","docusign-verify","adobe-document","zoom-meeting-invite"
  ]
};

const HIGH_RISK_TLDS = new Set([
  "xyz","top","click","loan","work","date","fit","gq","ml","cf","ga","tk","men",
  "club","surf","buzz","rest","cam","icu","bar","beauty","quest","cyou","monster","cfd","sbs","makeup","hair"
]);

const TRUSTED_TLDS = new Set(["gov","edu","mil"]);

const URL_SHORTENERS = new Set([
  "bit.ly","tinyurl.com","t.co","goo.gl","is.gd","buff.ly","ow.ly",
  "rebrand.ly","cutt.ly","tiny.cc","shorturl.at","bl.ink","tr.im"
]);

const TARGETED_BRANDS = {
  paypal:    ["paypal.com","paypal.me"],
  chase:     ["chase.com"],
  wellsfargo:["wellsfargo.com"],
  bankofamerica:["bankofamerica.com"],
  citibank:  ["citi.com","citibank.com"],
  capitalone:["capitalone.com"],
  americanexpress:["americanexpress.com","amex.com"],
  stripe:    ["stripe.com"],
  venmo:     ["venmo.com"],
  revolut:   ["revolut.com"],
  wise:      ["wise.com","transferwise.com"],
  google:    ["google.com","google.co.uk","accounts.google.com"],
  microsoft: ["microsoft.com","live.com","office.com","outlook.com"],
  apple:     ["apple.com","icloud.com"],
  amazon:    ["amazon.com","amazon.co.uk","amazon.de"],
  meta:      ["meta.com","facebook.com","instagram.com","whatsapp.com"],
  facebook:  ["facebook.com","fb.com"],
  instagram: ["instagram.com"],
  whatsapp:  ["whatsapp.com"],
  netflix:   ["netflix.com"],
  spotify:   ["spotify.com"],
  twitter:   ["twitter.com","x.com"],
  linkedin:  ["linkedin.com"],
  dropbox:   ["dropbox.com"],
  adobe:     ["adobe.com"],
  docusign:  ["docusign.com"],
  zoom:      ["zoom.us"],
  github:    ["github.com"],
  gitlab:    ["gitlab.com"],
  binance:   ["binance.com"],
  coinbase:  ["coinbase.com"],
  kraken:    ["kraken.com"],
  metamask:  ["metamask.io"],
  opensea:   ["opensea.io"],
  blockchain:["blockchain.com"],
  ledger:    ["ledger.com"],
  trezor:    ["trezor.io"],
  dhl:       ["dhl.com"],
  fedex:     ["fedex.com"],
  ups:       ["ups.com"],
  usps:      ["usps.com"]
};

module.exports = { PHISHING_KEYWORDS, HIGH_RISK_TLDS, TRUSTED_TLDS, URL_SHORTENERS, TARGETED_BRANDS };
