# GTM, Network Effects & Adoption Risk — DuriOS Evidence Review

**Research angle:** Go-to-market, network effects, and adoption risk (angle 5 of 5)
**Date:** 2026-10-22 · **Researcher:** agent · **Project:** DuriOS (vertical B2B SaaS, Vietnamese durian export compliance, on-premise)

## Queries run

Direct fetches only — WebSearch and Bash network egress were both non-functional in this session (search returned no results / network denied), and the general-purpose search engines reachable via the fetch proxy are bot-protected. Queries therefore took the form of targeted URL fetches against primary sources plus Wikipedia full-text search (which did work and was used repeatedly):

1. Polar merchant-of-record fee schedule, supported payout countries, acceptable-use policy
2. PayPal Vietnam merchant fee schedule (VN) and global merchant fee schedule
3. NOWPayments homepage, supported coins, fee statements
4. Lemon Squeezy / Paddle pricing pages (MoR comparison)
5. VNPAY, OnePay, NAPAS merchant service descriptions
6. Bessemer Venture Partners *State of the Cloud* 2023 and 2024
7. ChartMogul *SaaS Growth Report* 2023, *Go-To-Market Report* 2025, *Retention Report* 2023
8. Growth Unhinged "Hunting Your Way to $100M ARR" (ChartMogul 1,043-company dataset) and "What's working in B2B GTM in 2026" (300 GTM leaders)
9. ChartMogul / Growth Unhinged *Conversion Report* (200 products, Feb 2026) and *30-Day Upsell Window* (4,029 companies)
10. NFX network-effects manual
11. Constellation Software, Toast, Procore vertical-concentration case studies
12. MISA, Sapo, Bravo Vietnamese software vendor product and pricing pages
13. Vinacheck / Vina CHG Vietnamese traceability and anti-counterfeit vendor
14. Wikipedia full-text search: durian, Tiền Giang, Ngũ Hiệp, Cai Lậy, QR code payment / VietQR, WeFarm, Farmers Business Network, Conservis, open core
15. Tridge / Vietnam Customs / SBV / World Bank Vietnam country pages

**Network limitation stated up front:** the sandbox blocked all outbound Bash networking and the WebSearch tool returned empty result sets. Everything below is sourced to a URL I actually fetched. Where a claim rests on a source that was 403/404/bot-blocked, it is marked UNVERIFIABLE rather than asserted.

---

## 1. Vertical B2B SaaS benchmarks: sales cycle, conversion, ACV, churn

### Claim 1 — Median B2B trial-to-paid conversion within 7 days is ~2.5%, and ~16% for B2C
**Verdict:** SUPPORTED
**Source:** https://chartmogul.com/reports/saas-go-to-market-report/ — ChartMogul, *The SaaS Go-To-Market Report*, published 2025-06-11 · 2,500 SaaS companies, benchmarks spanning Q1 2024–Q1 2025
**Reasoning:** The report states B2C 7-day conversion is ~16% versus ~2.5% for B2B, and that both collapse to ~1% by day 14. This directly bounds what a community-to-paid funnel should be expected to yield: the window is one week, not one quarter.

### Claim 2 — For B2B software under $25 ASP, nearly half of companies close a deal within 7 days; at $250–500 ASP the median cycle stretches past 30 days
**Verdict:** SUPPORTED
**Source:** https://chartmogul.com/reports/saas-go-to-market-report/ — ChartMogul, 2025-06-11 · 2,500 SaaS companies
**Reasoning:** DuriOS prices at 60,000,000 VND/year (~$2,340 USD at the 26,045 VND/USD rate cited by Wikipedia's đồng article, 2026-02-28), placing it well above the $250–500 ASP band. A cycle extending past 30 days is therefore the empirically normal case, not a red flag.

### Claim 3 — Top-quartile net revenue retention for SaaS with ARPA above $500/month is ~109%, and only ~41% of those companies exceed 100% NRR
**Verdict:** SUPPORTED
**Source:** https://chartmogul.com/reports/saas-retention-report/ — ChartMogul, *SaaS Retention Report* 2023 · over 2,100 SaaS businesses, data across 2022
**Reasoning:** ChartMogul shows NRR rises monotonically with ARPA. At ARPA <$10/month, top-quartile NRR is 65.1% and only 2.7% of those businesses clear 100%. DuriOS's price point sits in the high-ARPA band where retention math is far more forgiving — an argument for holding the price rather than discounting.

### Claim 4 — Bessemer's mid-2020s fundability benchmarks set net revenue retention targets at 100% (good) / 110% (better) / 120%+ (best), with logo retention above 85/90/95%
**Verdict:** SUPPORTED
**Source:** https://www.bvp.com/atlas/state-of-the-cloud-2023 — Bessemer Venture Partners, *State of the Cloud 2023*, published 2023-04-11
**Reasoning:** These are investor-facing targets, calibrated for a typical Series B/C enterprise software company. They are a useful sanity ceiling, but they describe venture-backed US cloud companies, not on-premise Vietnamese software — a category for which I found no equivalent published benchmark (see Claim 5).

### Claim 5 — There exist published benchmarks for churn specifically for on-premise B2B software deployments in Vietnam or Southeast Asia
**Verdict:** UNVERIFIABLE
**Source:** Searched ChartMogul reports, Bessemer *State of the Cloud* 2023 and 2024, OpenView, SaaS Capital, Battery Ventures, and Vietnamese vendor sites; no matching dataset found
**Reasoning:** Every benchmark I could reach samples cloud-delivered SaaS billed to a payment instrument. DuriOS is sold on-premise with one-time deployment fees plus annual subscription, invoiced presumably by bank transfer — an instrument and a delivery model that no benchmark set I reached covers. **Any churn or pilot-conversion number applied to DuriOS today is extrapolation, and should be labelled a hypothesis in the blueprint, not a benchmark.**

### Claim 6 — In a 2026 survey of 300 B2B software GTM leaders (typical respondent $1–10M ARR, $5–50k ACV), founder-led sales remains the top motion at 44% below $1M ARR and 26% at $1–10M ARR
**Verdict:** SUPPORTED
**Source:** https://www.growthunhinged.com/p/2026-state-of-b2b-gtm-report — Growth Unhinged / Kyle Poyar, published 2026-10-14, survey fielded September 2026
**Reasoning:** Sub-$5k deal sizes convert primarily through PLG (35%) and inbound (17%); larger deals through outbound (31%) and inbound (24%). The most effective channels reported were network/introductions (#1) and intimate events (#2). For a single-site pilot in Cai Lậy, the implication is that founder-led outbound plus referrals inside the cluster is the documented best performer, not paid acquisition.

### Claim 7 — Early customer-segment choice persists: 70% of companies that reached $10k MRR kept the same target customer for 3+ years, and tier persistence predicts retention (deer: 70.5% GRR at $10k MRR and 87.4% NRR three years later, versus mouse: 24.6% GRR and 56.2% NRR)
**Verdict:** SUPPORTED
**Source:** https://www.growthunhinged.com/p/startups-become-what-they-hunt — Growth Unhinged / Kyle Poyar, published 2026-06-03, based on 1,043 ChartMogul companies that reached $10k MRR on or before 2023-05-01
**Reasoning:** This is the single strongest quantitative argument for DuriOS's declared pricing. The "deer" tier (~$1,000/month) shows roughly triple the gross retention of "mouse"-tier pricing. DuriOS's 60M VND/year is the deer tier, which is consistent with the evidence — but note the dataset is US cloud SaaS, not Vietnamese on-premise.

---

## 2. Payment: can a Vietnamese B2B vendor realistically collect recurring revenue?

### Claim 8 — Polar, a merchant-of-record used by many SaaS vendors, charges 4% + $0.40 per transaction on its permanent early-member rate, or 5% + $0.50 / 3.8% + $0.40 / 3.6% + $0.35 / 3.4% + $0.30 across its Starter/Pro/Growth/Scale plans, plus +1.5% for non-US cards
**Verdict:** SUPPORTED
**Source:** https://polar.sh/docs/merchant-of-record/fees — Polar (polar.sh), fetched 2026-10-22
**Reasoning:** Polar's docs also state payouts cost 0.25% + $0.25 each, cross-border conversion runs 0.25% (EU) to 1% elsewhere, and each dispute costs $15 regardless of outcome. Against a 5,000,000 VND (~$192) pilot fee, the Starter rate of 5% + $0.50 works out to roughly $10.10, i.e. ~5.26% effective. That is a real cost but not a prohibitive one for a five-figure-VND pilot.

### Claim 9 — Vietnam is a supported payout country for Polar (via Stripe Connect Express), and the seller does not need direct Stripe access in their own country
**Verdict:** SUPPORTED
**Source:** https://polar.sh/docs/merchant-of-record/supported-countries — Polar, fetched 2026-10-22
**Reasoning:** Vietnam appears explicitly in a list of ~118 supported countries. Polar's docs explain that because Polar is the merchant of record, buyers pay Polar directly and only the Connect Express payout needs to be available locally. This materially weakens the "MoR is geographically unavailable to us" objection.

### Claim 10 — Polar's acceptable-use policy excludes physical goods, human services, marketplaces, and high-risk or regulated categories, while explicitly supporting Software & SaaS
**Verdict:** PARTIALLY_SUPPORTED
**Source:** https://polar.sh/docs/merchant-of-record/acceptable-use/introduction — Polar, fetched 2026-10-22
**Reasoning:** The summary page confirms "physical goods, human services, marketplaces, and high-risk or regulated categories" are unsupported and that "Software & SaaS" is supported. Critically, the page states that "the complete and binding list of acceptable, prohibited, and restricted products" lives in the full policy document, which I did not retrieve. **The marketplace exclusion is directly material to DuriOS's later-stage vision:** a two-sided "verified durian trade network" moves the product out of the supported category. That is a strategic payment-rail constraint, not merely a fee question.

### Claim 11 — PayPal's published Vietnam merchant fees are 4.40% + a fixed fee on cross-border commercial receipts (updated 2026-05-28), with 4.00% currency conversion, $8 standard dispute fee, chargebacks from $10, and 60,000 VND to withdraw to a Vietnamese bank
**Verdict:** SUPPORTED
**Source:** https://www.paypal.com/vn/webapps/mpp/merchant-fees — PayPal Vietnam, page last updated 2026-05-28
**Reasoning:** The fixed fee varies by received currency ($0.30 USD, €0.35, etc.). Micropayments require prior approval and cost 6.00% + fixed fee. Note the page shows only a cross-border rate — no domestic Vietnamese commercial rate is published there, so a Vietnamese payer paying a Vietnamese seller via PayPal is not covered by this schedule.

### Claim 12 — NOWPayments advertises a merchant fee "starting at 1%" with loyalty discounts, excluding blockchain network fees, and lists USDTERC20/USDTTRC20/USDTBSC among ~300 supported coins plus VND among ~20 supported fiat currencies
**Verdict:** SUPPORTED
**Source:** https://nowpayments.io/ and https://nowpayments.io/supported-coins — NOWPayments (a ChangeNOW brand, founded 2019), fetched 2026-10-22
**Reasoning:** NOWPayments' own homepage targets its offer at casinos, iGaming, adult, trading platforms, token generation events and SaaS among others. The site does not publish a country restriction list, so I cannot certify Vietnam eligibility from primary sources. Note also the coin page displayed a banner reading "This is a test environment, please don't send any actual funds" — worth verifying with the vendor before treating any of this as production-ready.

### Claim 13 — VietQR is Vietnam's national QR payment standard, introduced to the public in 2021, developed by NAPAS together with major banks, and NAPAS 247 instant transfer via VietQR caps each transaction below 500 million VND
**Verdict:** SUPPORTED
**Source:** https://en.wikipedia.org/wiki/QR_code_payment — Wikipedia (accessed 2026-10-22); NAPAS transaction cap from https://napas.com.vn/en/ — NAPAS, fetched 2026-10-22
**Reasoning:** NAPAS reports over 20,600 ATMs, over 741,000 POS/mPOS acceptance devices, and over 80 million customers across 68 member institutions. VNPAY separately claims 600,000+ acceptance points, 40+ partner banks, and 50+ million service users. The infrastructure is undeniably real and dense. What is **not** verified from any source I reached: whether VietQR supports recurring/automatic debit (card-on-file-style pull). VietQR is a push-based QR transfer standard, so recurring collection would need a separate mandate mechanism.

### Claim 14 — VNPAY, OnePay, and NAPAS publish their merchant fee schedules publicly online
**Verdict:** REFUTED (as stated)
**Source:** https://vnpay.vn/, https://onepay.vn/, https://napas.com.vn/en/ — all fetched 2026-10-22
**Reasoning:** None of the three publishes rates. OnePay holds SBV intermediary payment service licence 06/GP-NHNN and lists VISA/Mastercard/Amex/JCB/UnionPay cards, e-wallets, QR, and Apple Pay as accepted methods, plus integration formats Website/API/Paymentlink. NAPAS offers switching services but explicitly no interchange or merchant fee data. **Consequence for DuriOS: merchant discount rates for VietQR/VNPay acceptance are a black box requiring direct vendor negotiation. Any fee assumption in the blueprint must be marked as an estimate.**

### Claim 15 — Crypto payment via NOWPayments is a credible *primary* recurring-revenue channel for a Vietnamese B2B software buyer
**Verdict:** PARTIALLY_SUPPORTED (technically feasible, commercially unproven)
**Source:** https://nowpayments.io/ ; https://www.paypal.com/vn/webapps/mpp/merchant-fees ; https://en.wikipedia.org/wiki/Tether_(cryptocurrency) — fetched 2026-10-22
**Reasoning:** The mechanism works: NOWPayments supports USDT on multiple chains with a 1% starting fee, which is cheaper than every alternative found here. But no source I reached shows B2B software — let alone Vietnamese agricultural SMEs — paying recurring subscriptions in USDT at any meaningful rate. The only Southeast Asia–specific USDT evidence in the Tether article is a $225M freeze tied to a human-trafficking "pig butchering" group and a T3 Financial Crime Unit crackdown. There is also an accounting problem: revenue received in stablecoins would be reported separately from ARR. **Recommendation: treat crypto as a fallback/acceptance channel, not the primary one.**

### Claim 16 — Polar-style merchant-of-record rejection by SaaS vendors is driven by fee, geography, and product-type restrictions
**Verdict:** PARTIALLY_SUPPORTED
**Source:** https://polar.sh/docs/merchant-of-record — Polar, fetched 2026-10-22; corroborating fee data at https://polar.sh/docs/merchant-of-record/fees and https://www.paddle.com/pricing (5% + 50¢) and https://www.lemonsqueezy.com/pricing (5% + 50¢)
**Reasoning:** On fees the claim holds: 5% + $0.50 plus +1.5% on international cards is expensive relative to direct card processing, and Polar's own docs concede MoR means "higher fees per payment" and "less flexibility." On **geography the claim is now dated** — Polar supports ~118 payout countries including Vietnam. On product-type the claim is partly right but the wrong example: Polar explicitly supports Software & SaaS. The genuine blocker for DuriOS's *later* stage would be the marketplace exclusion, not a SaaS restriction. **Note: I found no published post-mortem by a vendor who actually rejected Polar for this product, so the causal framing in the question is only partly corroborated.**

---

## 3. Network effects and cold start

### Claim 17 — Marketplace network effects are ranked by NFX among 16 distinct types, with direct effects (physical, protocol, personal utility) described as strongest and asymptotic marketplaces (Uber/Lyft class) as ones where supply value sharply flattens after a threshold
**Verdict:** SUPPORTED
**Source:** https://www.nfx.com/post/network-effects-manual — NFX, fetched 2026-10-22
**Reasoning:** The manual's stated success criteria are all qualitative: core value must come from the network, direct effects beat indirect, marketplace members can multi-tenant for free and therefore need added lock-in, and a challenger must offer both sides a better deal simultaneously. **This source contains no quantitative cold-start data whatsoever** — no time-to-critical-mass, no minimum viable density, no conversion thresholds. It cannot be used to justify a "verified trade network" launch date.

### Claim 18 — WeFarm, a peer-to-peer farmer knowledge network claiming to be the world's largest farmer-to-farmer network with over 1.1 million users across Kenya, Uganda and Peru, ceased operations in 2022 after raising more than $10m in venture capital
**Verdict:** SUPPORTED (existence, scale, funding and shutdown); REFUTED as to cause
**Source:** https://en.wikipedia.org/wiki/WeFarm — Wikipedia, accessed 2026-10-22
**Reasoning:** The article confirms the company went out of business in 2022 but does **not** explain why. The one documented detail that matters for DuriOS: over 95% of WeFarm's users were offline, SMS-based. This is the closest available analogue to a farmer-network cold start, and it demonstrates that a large free user base among smallholders did not convert into a self-funding business.

### Claim 19 — Farmers Business Network reached over 117,000 member farms across about 187 million acres as of July 2025, and extended nearly $3 billion in total financing, after being the subject of a Canadian Competition Bureau probe into alleged anti-competitive conduct by Bayer, BASF and Corteva
**Verdict:** PARTIALLY_SUPPORTED
**Source:** https://en.wikipedia.org/wiki/Farmers_Business_Network — Wikipedia, accessed 2026-10-22
**Reasoning:** **Caveat flagged by the source itself:** the Wikipedia page carries an LLM-content warning and may contain hallucinated or unverified claims. The substantive point — an incumbent-backed blocking response is a real failure mode for agricultural B2B networks — is consistent with the antitrust probe being reported as dropped for insufficient evidence in April 2024. If FBN's numbers matter to your argument, verify against FBN's own investor disclosures before citing.

### Claim 20 — Documented post-mortems of B2B agricultural marketplaces and trade networks that failed, identifying what killed them
**Verdict:** UNVERIFIABLE
**Source:** Wikipedia full-text search for "agritech marketplace shutdown", "Twiga Foods", "Hello Tractor", "Farmerline", "DeHaat", "failed agricultural marketplaces" (all accessed 2026-10-22); TechCrunch Vietnam tag page; Tridge news index
**Reasoning:** None of these companies has a Wikipedia article. Twiga Foods appears only as a mention inside the Overseas Private Investment Corporation article. No reachable source contains a post-mortem. TechCrunch's Vietnam tag page has nothing on agritech. **This is a genuine evidence gap, and it matters: the "trade network" stage of DuriOS's roadmap rests on an assumption about marketplace dynamics that I could not test against any documented failure analysis.**

---

## 4. Dense-cluster / geographic concentration GTM

### Claim 21 — Constellation Software's business model is explicitly the acquisition and permanent ownership of vertical-market software businesses, has acquired over 500 businesses (lead text claims over 850 across more than 100 industry verticals), and most deals are under $5M
**Verdict:** SUPPORTED, with an internal inconsistency flagged
**Source:** https://en.wikipedia.org/wiki/Constellation_Software — Wikipedia, accessed 2026-10-22
**Reasoning:** Reported 2024 revenue is US$10.066 billion and the stock has compounded ~30% annually since the 2006 IPO, with ~64,000 employees. The article itself contains conflicting acquisition counts (500+ vs 850+) and a reversed assets/equity table. **Relevance:** this is the strongest large-scale evidence that deep vertical concentration — not breadth — compounds, but the mechanism here is buy-and-hold M&A of established niche businesses, not cold-start land-grab.

### Claim 22 — Toast began as a US-only, restaurants-and-bars-only vertical SaaS (area served: United States) and reached approximately 120,000 US restaurant locations as of June 2024, with 2025 revenue of ~$6.15 billion
**Verdict:** SUPPORTED
**Source:** https://en.wikipedia.org/wiki/Toast,_Inc. — Wikipedia, accessed 2026-10-22
**Reasoning:** The single-vertical, single-geography origin is visible in the article's own infobox. Expansion stayed inside the restaurant vertical (reservations April 2023, Delphi Display Systems drive-thru acquisition Feb 2023) rather than crossing industries. **Also note the documented downside:** Toast cut 50% of staff in April 2020 because its concentration made it fully exposed to restaurant-sector shock. Concentration is a risk amplifier as well as a focus mechanism.

### Claim 23 — Procore committed to a single industry (construction) rather than building horizontally, went from $4.8M revenue in 2012 to ~$1.32 billion in 2025, and used acquisitions (Honest Buildings 2019, Esticom 2020, Avata Intelligence 2020, INDUS.AI 2021) to deepen rather than diversify that vertical
**Verdict:** SUPPORTED
**Source:** https://en.wikipedia.org/wiki/Procore — Wikipedia, accessed 2026-10-22
**Reasoning:** Over 10,000 customers and 2 million users as of May 2021. Note the founder was a former carpenter, not a software founder — domain adjacency at the founder level is common in these cases.

### Claim 24 — There is published empirical evidence that geographic cluster domination outperforms broad targeting specifically for *geographically narrow* vertical B2B software in emerging markets
**Verdict:** UNVERIFIABLE
**Source:** Constellation, Toast and Procore cases fetched; no emerging-market geographic-cluster study reachable
**Reasoning:** The three strongest case studies above all demonstrate *industry* concentration. Toast's US-only scope was incidental to its category, not a deliberate "dominate one city" play. None of them is an emerging-market seller with an on-premise deployment model. **The Cai Lậy-first strategy is therefore supported by analogy to vertical concentration, not by direct evidence that geographic clustering beats broad targeting.** Frame it as a hypothesis to test with the 10 field surveys, which is exactly how the blueprint already labels it.

---

## 5. Open-source community-to-commercial conversion

### Claim 25 — The median free-to-paid conversion rate across 200 B2B software products (surveyed January 2026) is 8%, but conversion varies sharply by entry point: freemium 3–5% good / 8–12% great, ungated freemium 7–9% / 8–12%, free trial without card 4–6% / 10–15%, free trial requiring a card 25–35% / 50–60%
**Verdict:** SUPPORTED
**Source:** https://chartmogul.com/reports/saas-conversion-report/ — ChartMogul × ProductLed, *The SaaS Conversion Report*, Kyle Poyar, published 2026-02-04
**Reasoning:** Sample is 200 B2B software products, typically $1–10M ARR with $50–249/month ARPC. Conversion is measured over a six-month window; **the report gives no median days-to-convert figure.** Per 1,000 website visitors: freemium yields 90 signups → 5 paying; free trial 45 signups → 3.6 paying; credit-card trial 35 signups → 10.5 paying. The report notes a "10x conversion difference between the top 20% and the bottom 20%."

### Claim 26 — For B2B-focused products the report's benchmarks are 6–10% (good) and 15–20% (great), while overall B2C/hybrid is lower
**Verdict:** SUPPORTED
**Source:** https://chartmogul.com/reports/saas-conversion-report/ — same source
**Reasoning:** Consistent with Claim 25. The DuriOS Community edition is ungated (100% of reconciliation features, no account required), which maps to the lowest-conversion bucket (7–9% good, 8–12% great) — a deliberate provenance-verification play that should be expected to convert poorly at the top of the funnel and to depend on the importer/customs side for monetization instead.

### Claim 27 — GitLab's paying conversion was historically around 0.1%
**Verdict:** UNVERIFIABLE (title-level only)
**Source:** https://en.wikipedia.org/wiki/GitLab — Wikipedia, accessed 2026-10-22
**Reasoning:** Wikipedia cites a 2014 *TNX* article titled "How GitHub rival GitLab is building a business with just 0.1% paying customers" but the article body does not provide figures, later conversion rates, or ARR. **A decade-old single-source datapoint cannot be used to project DuriOS conversion.**

### Claim 28 — Documented conversion rates for vertical open-core products, and typical time-to-conversion
**Verdict:** UNVERIFIABLE
**Source:** https://en.wikipedia.org/wiki/Open_core — Wikipedia, accessed 2026-10-22; plus ChartMogul report index at https://chartmogul.com/reports/
**Reasoning:** The Wikipedia open-core article is thorough on licensing structure and fork risk (Elastic→SSPL, Redis→BSL and OpenTofu fork, MongoDB and Debian/Fedora/RHEL removals, WordPress/WP Engine litigation) but explicitly contains **no conversion-rate figures and no effectiveness data**. ChartMogul measures trial-to-paid and free-to-paid by entry point and product type, but not by licensing model. **No source I reached reports conversion rates for vertical open-core specifically, nor a median time-to-convert.** This is a material gap for a strategy whose funnel is explicitly open-source-to-Pro.

### Claim 29 — Open-core and similar source-available licensing carry documented fork and litigation risk
**Verdict:** SUPPORTED
**Source:** https://en.wikipedia.org/wiki/Open_core — Wikipedia, accessed 2026-10-22
**Reasoning:** Concrete, documented precedents: Elastic's January 2021 move from Apache 2.0 to SSPL/Elastic License; Redis Labs' Commons Clause forked into GoodFORM; HashiCorp's BSL forked into OpenTofu; the OSI's finding that SSPL breaches the Open Source Definition; Debian, Fedora and RHEL removing MongoDB; and the WordPress/WP Engine dispute in which WP Engine won a December 2024 injunction. Gartner's Brian Prentice is cited calling open-core "The Emperor's New Clothes." **Implication:** an ungated 100%-feature Community edition invites a packaging-house-run fork, which is the cheaper adoption risk relative to paying.

---

## 6. Direct competitors and substitutes

### Claim 30 — MISA is a real Vietnamese vendor selling accounting, inventory, CRM, e-invoicing, e-banking, HR and payroll software to Vietnamese SMEs, with AMIS OneAI advertised "from 500k/month"
**Verdict:** SUPPORTED (products and the OneAI price point); UNVERIFIABLE (full pricing)
**Source:** https://misa.vn/ — MISA, fetched 2026-10-22
**Reasoning:** No full price list is published. Product depth is the relevant signal: MISA already sells warehouse, purchasing, production and bank-reconciliation modules. **This is a real substitute threat**, since a packing house already running MISA or a similar local ERP has a functioning system of record, and DuriOS would need to justify itself against "we already track this in MISA."

### Claim 31 — Sapo publishes concrete Vietnamese SME pricing: 170,000đ–999,000đ/month for sales-management tiers plus one-time setup of 1,000,000đ–3,000,000đ, and claims 230,000+ sellers
**Verdict:** SUPPORTED
**Source:** https://sapo.vn/bang-gia.html — Sapo, fetched 2026-10-22
**Reasoning:** Exact figures: StartUp 170,000đ/mo (3 staff), PRO 249,000đ/mo, OMNI 449,000đ/mo, ADVANCED 600,000đ/mo, GROWTH 999,000đ/mo; extra store 200,000đ/mo; setup 1–3 million đ once, waived at 2+ years; 7-day free trial. **This is the clearest published evidence of what Vietnamese SMEs actually pay for business software: hundreds of thousands of VND per month, not tens of millions per year.** DuriOS's 60,000,000đ/year is roughly 5–10x Sapo's top tier — a gap that must be justified by regulatory necessity, not by feature count.

### Claim 32 — Bravo (founded 1999) sells BRAVO 10 ERP to large Vietnamese enterprises on a quotation-only basis, with published add-on rates of 200,000đ/month per 50 GB database or 100 GB backup and 180,000đ/month per vCPU or per GB of RAM
**Verdict:** SUPPORTED
**Source:** https://www.bravo.com.vn/chinh-sach-ban-hang/ — Bravo Software JSC, fetched 2026-10-22
**Reasoning:** Bravo states pricing depends on deployment scope and complexity, and lists service packages by user count (7 to 400 users) without prices. It sells direct with no resellers. Customers cited include Vietnam Airlines, Hòa Phát, Sabeco, THACO, Tisco and Bridgestone — i.e. enterprise accounts, not packing houses. **Relevance:** shows the local ERP market is quote-driven and relationship-sold, so no public price benchmark exists for an on-premise ERP in this segment.

### Claim 33 — Vinacheck / Vina CHG is a real Vietnamese anti-counterfeit and traceability vendor selling traceability labels, QR-code labels, electronic SMS labels, scratch-off labels, tamper-evident seals, and "Tem 4.0" / 5S combined solutions, plus seedling-sector labels
**Verdict:** SUPPORTED (existence and product range); UNVERIFIABLE (pricing)
**Source:** https://www.vinacheck.vn/ and https://vinacheck.vn/ — Vina CHG, fetched 2026-10-22
**Reasoning:** No pricing published anywhere; quotes only. Company is registered with the Ministry of Industry and Trade; representative Nguyễn Phi Hải; business licence 0306182501 first issued 14/10/2008. **This is the closest real-world substitute for DuriOS's community traceability layer** — it sells the same consumer-facing QR-verification concept as physical labels rather than as software.

### Claim 34 — Odoo publishes US$7.25/user/month (Standard, yearly) and US$13.40/user/month (Custom, yearly), with Custom supporting on-premise hosting, and a free one-app plan
**Verdict:** SUPPORTED
**Source:** https://www.odoo.com/pricing — Odoo, fetched 2026-10-22
**Reasoning:** Discounted from list prices of US$8.95 / US$11.20 and US$16.40 / US$20.40. Custom includes Odoo Studio, multi-company and external API, and permits downloading Odoo Enterprise to self-host. **A packing house can therefore buy a credible on-premise ERP with traceability modules for single-digit US dollars per user per month** — the surrounding benchmark against which 60M VND/year must be defended.

### Claim 35 — Chinese customs-broker software products that a Vietnamese durian packhouse might use instead, and their prices
**Verdict:** UNVERIFIABLE
**Source:** Attempted Vietnam Customs (customs.gov.vn), Tridge, VNPAY, and general trade sites; no product or pricing reachable and no named vendor verified
**Reasoning:** The customs.gov.vn fetch returned only the site title "Hải Quản Việt Nam" with no announcement content. **I cannot name or price a single real Chinese customs-broker product, and I will not invent one.** The most likely substitute in practice is a customs-declaration service provided by a licensed Vietnamese broker, whose dossiers are prepared as a service — but I found no verifiable vendor or fee schedule for that either. Treat this substitution channel as unquantified risk.

### Claim 36 — Spreadsheets are a credible substitute for compliance dossier reconciliation
**Verdict:** PARTIALLY_SUPPORTED (by inference, not by a direct source)
**Source:** https://chartmogul.com/reports/saas-go-to-market-report/ (ASP/cycle relationship); https://chartmogul.com/reports/saas-retention-report/ (ARPA vs. retention)
**Reasoning:** No source I reached measures spreadsheet adoption as a competitor. The support is indirect and structural: if a tool substitutes for spreadsheets, there is no incumbent cost to displace, no switching pain, and no compliance penalty that forces migration. The retention data cuts the other way only when ARPA is high enough to make the buyer's decision informed and deliberate.

---

## Cross-cutting assessment: architectural and adoption risk

**What the evidence supports for DuriOS:**

1. **The price point is defensible on retention grounds.** ChartMogul's data is unambiguous that NRR and GRR rise with ARPA, with the inflection between the "mouse" tier and the "deer" tier being roughly 24.6% → 70.5% GRR. Holding 60M VND/year is consistent with the evidence; discounting toward Sapo's 999,000đ/month band would move DuriOS into the tier with the worst retention economics.
2. **The sales cycle should be budgeted in months, not weeks.** B2B trials close ~2.5% within 7 days and ASPs above $250 push cycles past 30 days. DuriOS's price is ~10x that threshold. The blueprint's own "10 field surveys before pricing" plan is the correct instrument.
3. **Community-led, founder-led, referral-led is the documented best-performing motion at this stage.** 44% of sub-$1M ARR companies rely on founder-led sales; network/introductions and intimate events are the top two channels. In a single-cluster play, this is achievable cheaply.
4. **Concentration is well supported as a *strategy*, weakly supported as a *geographic* play.** Constellation, Toast and Procore all validate industry concentration. None validates "dominate one city first." State the cluster thesis as a hypothesis.
5. **The MoR blocker is weaker than assumed on geography, real on product type.** Polar supports Vietnam payouts. But its acceptable-use policy excludes marketplaces — which collides with the "verified trade network" vision, not with the current SaaS stage. Any network-stage revenue plan needs a different payment rail decision than the pilot stage.

**What the evidence does not support:**

- No benchmark exists for on-premise B2B software churn in Vietnam or Southeast Asia. Every retention number applicable to DuriOS is an extrapolation from US cloud SaaS.
- No published vertical open-core conversion rate, and no median time-to-convert, was findable.
- No B2B agricultural marketplace failure post-mortem was reachable. The one verified analogue (WeFarm, 1.1M users, $10M raised, closed 2022, cause unexplained) shows large free farmer user bases do not self-fund.
- Chinese customs-broker software and dossier-as-a-service pricing could not be verified at all.

**Ranked adoption risks (highest first):**

1. **Substitute-on-free.** MISA, Sapo and Bravo already sell warehouse/production/ERP to the exact buyer. Odoo is on-premise at single-digit USD/user/month. The compliance gap is the only moat.
2. **Payment-rail mismatch.** VietQR is push-based, so recurring collection needs a mandate mechanism nobody published. MoR pricing is 5% + $0.50 + 1.5% international, and its marketplace exclusion blocks the network stage.
3. **Crypto as primary channel is not credible for this buyer.** No source shows Vietnamese agricultural SMEs paying recurring B2B subscriptions in stablecoins.
4. **Fork risk on the ungated Community edition.** Documented open-core fork and litigation precedent exists; a packhouse-run fork is cheaper than paying.
5. **Concentration amplifies sector shock.** Toast cut 50% of staff in April 2020 because single-vertical focus removed diversification.

---

## Limitations

- **Search tooling was unavailable.** WebSearch returned empty results and all Bash network egress was denied. Every source below was reached by direct URL fetch, and Wikipedia full-text search. Reachable search engines (DuckDuckGo, Mojeek, Brave, Ecosia, Qwant, Startpage, Bing) were bot-blocked or returned junk. This biases the research toward primary vendor pages and Wikipedia, and away from analyst blogs, case studies, and news.
- **No Vietnamese-language trade press reachable.** VietnamNet, VnExpress, VietnamNews, Tien Phong, Baotintuc, MARD and the SBV site were all unreachable or refused connections. Vietnam-specific durian export volumes, packing-house counts, and vendor pricing are therefore thin.
- **No B2B agritech marketplace post-mortems.** This is the largest single gap, and it sits directly under the most speculative stage of the roadmap.
- **Benchmarks are US cloud SaaS.** All conversion, retention and cycle data comes from cloud-delivered software sold to payment instruments. DuriOS is on-premise, Vietnamese, bank-transferred, with one-time deployment fees. Applying these numbers requires extrapolation.
- **Wikipedia reliability.** Several key facts (Constellation, Toast, Procore, FBN, WeFarm, QR code payment) come from Wikipedia. FBN's page carries its own LLM-content warning; Constellation's page contains internally inconsistent acquisition counts and a reversed assets/equity table. These should be re-verified against primary sources before external use.
- **Not covered:** Vietnamese labour/employment cost for field deployment, Vietnamese e-invoicing mandate details affecting the product, specific GACC dossier field requirements, and the actual VAT/withholding tax treatment of software subscription revenue in Vietnam.

---

## Unresolved questions

1. Is there any published benchmark for on-premise B2B software churn or pilot conversion in Southeast Asia at all? If not, the blueprint's Bear/Base/Bull scenarios should explicitly state that no external benchmark exists and the numbers are founder assumptions.
2. Does VietQR or any Vietnamese rail support recurring mandate-based collection (card-on-file equivalent)? If not, what is the actual collection mechanism for a 60M VND annual invoice — bank transfer with a manual renewal, a signed standing instruction, or an e-mandate?
3. What are actual VietQR / VNPay / MoMo merchant discount rates? None publish them. A direct quote is required before any revenue model includes payment fees.
4. Would Polar's acceptable-use policy, in its full binding version, classify the future "verified trade network" as a prohibited marketplace? The summary page says marketplaces are unsupported but the binding list was not retrievable.
5. Does NOWPayments contractually permit a Vietnam-registered vendor, and does it settle in VND? Neither is stated on the pages fetched.
6. What is the verifiable Vietnamese durian export volume/value by year, and the count of registered export packing houses in Đồng Tháp (post-merger) / Tiền Giang? Only Ngũ Hiệp's 2,750 ha / ~49,000 t/yr was verifiable.
7. Are Chinese customs-broker software products and dossier-as-a-service actually used by Vietnamese packhouses, and at what price? Unverified — entirely.
8. Does the ungated Community edition (100% of features, no account) risk creating a packhouse-run fork, given documented open-core fork precedent?
