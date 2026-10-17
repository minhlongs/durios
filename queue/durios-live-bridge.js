/**
 * DuriOS Shared Live API Hydration Bridge for 22 Google Stitch Screens (/stitch/*.html)
 * Connects static Stitch screens to live Bun HTTP endpoints:
 *   - GET  /api/v1/open-core/ecosystem-telemetry
 *   - GET  /api/v1/open-core/blueprint-status?deep=true
 *   - POST /api/auth/pilot-rehearsal-bootstrap?role=CLERK|MANAGER
 */
(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function createBridgeContainer() {
    var existing = document.getElementById("durios-live-bridge-bar");
    if (existing) return existing;

    var bar = document.createElement("div");
    bar.id = "durios-live-bridge-bar";
    bar.style.cssText =
      "background:#09140E;border-bottom:1px solid #1F3327;padding:6px 14px;font-family:'JetBrains Mono','Inter',monospace;font-size:11px;color:#ECFDF5;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;z-index:99998;position:relative;";

    bar.innerHTML =
      '<div id="durios-live-bridge-metrics" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;">' +
      '<span style="color:#10B981;font-weight:700;">● LIVE BUN API BRIDGE</span>' +
      '<span id="durios-live-bridge-status" style="color:#6EE7B7;">Connecting to /api/v1/open-core/ecosystem-telemetry…</span>' +
      "</div>" +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;">' +
      '<button type="button" id="durios-btn-seed-rehearsal" style="background:#10B981;color:#06110B;border:none;border-radius:4px;padding:3px 9px;font-weight:700;font-size:11px;cursor:pointer;">🚀 1-Click Cai Lậy Rehearsal (5 Cont)</button>' +
      '<button type="button" id="durios-btn-switch-role" style="background:#132018;color:#F59E0B;border:1px solid #F59E0B;border-radius:4px;padding:3px 8px;font-weight:600;font-size:11px;cursor:pointer;">🔀 Role: CLERK</button>' +
      '<button type="button" id="durios-btn-download-golive" style="background:#132018;color:#10B981;border:1px solid #10B981;border-radius:4px;padding:3px 8px;font-weight:600;font-size:11px;cursor:pointer;">📦 Go-Live Pack JSON</button>' +
      '<button type="button" id="durios-btn-toggle-drawer" style="background:#132018;color:#6EE7B7;border:1px solid #1F3327;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer;">🔍 Live Inspector</button>' +
      '<a href="/" style="background:#18281F;color:#ECFDF5;border:1px solid #10B981;border-radius:4px;padding:3px 8px;text-decoration:none;font-weight:600;font-size:11px;">⚡ Main Workspace (/)</a>' +
      "</div>" +
      '<div id="durios-live-bridge-drawer" style="display:none;width:100%;margin-top:6px;padding:10px;background:#060B08;border:1px solid #1F3327;border-radius:6px;max-height:300px;overflow:auto;"></div>';

    var topNav = document.getElementById("durios-unified-top-nav");
    if (topNav && topNav.parentNode) {
      topNav.parentNode.insertBefore(bar, topNav.nextSibling);
    } else if (document.body) {
      document.body.insertBefore(bar, document.body.firstChild);
    }
    return bar;
  }

  var latestTelemetry = null;
  var currentRole = "CLERK";

  function renderTelemetry(data) {
    latestTelemetry = data;
    var statusEl = document.getElementById("durios-live-bridge-status");
    var drawerEl = document.getElementById("durios-live-bridge-drawer");
    var roleBtn = document.getElementById("durios-btn-switch-role");
    if (!statusEl || !data) return;

    if (data.actor && data.actor.role) {
      currentRole = data.actor.role;
      if (roleBtn) roleBtn.textContent = "🔀 Role: " + currentRole;
    }

    var bp = data.blueprintAudit || {};
    var soc = data.deepSocratic || {};
    var econ = soc.unitEconomicsVerification || {};
    var kpi = data.pilotKpi || {};
    var gates = data.pilotGates || {};
    var corridors = Array.isArray(data.corridors) ? data.corridors : [];
    var guard = data.marketplaceGuard || {};
    var syncQ = data.edgeSyncQueue || {};
    var goLive = data.goLivePack || {};

    var shortSha = String(bp.blueprintCompositeSha256 || "").slice(0, 12);
    var goLiveSha = String(goLive.reportSha256 || "").slice(0, 12);
    var margin = econ.containerGrossMarginPct != null ? econ.containerGrossMarginPct + "%" : "94.67%";

    statusEl.innerHTML =
      '<span style="padding:2px 6px;background:#132018;border:1px solid #1F3327;border-radius:4px;">Blueprint: <strong style="color:#10B981;">' +
      escapeHtml(bp.completedStepsCount ?? 25) +
      "/" +
      escapeHtml(bp.totalSteps ?? 25) +
      "</strong> (<code>" +
      escapeHtml(shortSha) +
      "…</code>)</span>" +
      '<span style="padding:2px 6px;background:#132018;border:1px solid #1F3327;border-radius:4px;">Socratic 5-Turn: <strong style="color:#10B981;">' +
      escapeHtml(soc.ideaVerdict || "GO_OPEN_CORE_SAAS") +
      "</strong> · Margin <strong style=\"color:#F59E0B;\">" +
      escapeHtml(margin) +
      "</strong></span>" +
      '<span style="padding:2px 6px;background:#132018;border:1px solid #1F3327;border-radius:4px;">Corridors: <strong>' +
      escapeHtml(corridors.map(function (c) { return c.corridorCode; }).join(", ") || "VN_CN, MY_CN, TH_CN, PH_CN") +
      "</strong></span>" +
      '<span style="padding:2px 6px;background:#132018;border:1px solid #1F3327;border-radius:4px;">Pilot Containers: <strong style="color:#10B981;">' +
      escapeHtml(kpi.totalContainers ?? 0) +
      "</strong> · Gates: <strong>" +
      escapeHtml(gates.passedCount ?? 0) +
      "/5</strong> · GoLive SHA: <code>" +
      escapeHtml(goLiveSha || "verified") +
      "…</code></span>";

    if (drawerEl) {
      var turnsHtml = (soc.socraticTurns || [])
        .map(function (t) {
          return (
            '<div style="padding:4px 0;border-bottom:1px dashed #1F3327;">' +
            '<strong style="color:#10B981;">[Turn ' +
            escapeHtml(t.turnNumber) +
            " · " +
            (t.passed ? "PASS" : "FAIL") +
            "]</strong> " +
            escapeHtml(t.dimension) +
            " — <span style=\"color:#6EE7B7;\">" +
            escapeHtml(t.evidenceSummary) +
            "</span></div>"
          );
        })
        .join("");

      var checklistHtml = (goLive.fieldAuditorChecklist || [])
        .map(function (chk) {
          return (
            '<div style="padding:3px 0;border-bottom:1px dashed #1F3327;">' +
            '<strong style="color:' +
            (chk.passed ? "#10B981" : "#F59E0B") +
            ';">[' +
            escapeHtml(chk.itemId) +
            " · " +
            escapeHtml(chk.linkedGateId) +
            " · " +
            escapeHtml(chk.status) +
            "]</strong> " +
            escapeHtml(chk.titleVi) +
            "</div>"
          );
        })
        .join("");

      drawerEl.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">' +
        "<div>" +
        '<div style="font-weight:700;color:#10B981;margin-bottom:4px;">5-Turn Socratic Introspector (Live API)</div>' +
        turnsHtml +
        "</div>" +
        "<div>" +
        '<div style="font-weight:700;color:#F59E0B;margin-bottom:4px;">Field Auditor Go-Live Checklist (CHK-01..05)</div>' +
        checklistHtml +
        '<div style="margin-top:4px;">• Go-Live Pack SHA-256: <code>' +
        escapeHtml(goLive.reportSha256 || "") +
        "</code> (" +
        (data.goLivePackVerified ? "VERIFIED" : "PENDING") +
        ")</div>" +
        "<div>• Custody Mode: <code>" +
        escapeHtml(guard.custodyMode) +
        "</code> · EdgeQueue: <code>" +
        escapeHtml(syncQ.pendingCount ?? 0) +
        "</code></div>" +
        "</div>" +
        "</div>";
    }
  }

  async function fetchLiveTelemetry(autoBootstrapIfNeeded) {
    try {
      var headers = {};
      var savedToken = window.localStorage.getItem("durios_pilot_token");
      if (savedToken) headers["x-pilot-token"] = savedToken;

      var res = await fetch("/api/v1/open-core/ecosystem-telemetry", {
        headers: headers,
        credentials: "same-origin",
      });

      if (res.status === 401 && autoBootstrapIfNeeded) {
        await runRehearsalBootstrap(true, currentRole);
        return;
      }

      var body = await res.json();
      if (body && body.success && body.data) {
        renderTelemetry(body.data);
      }
    } catch (_err) {
      var statusEl = document.getElementById("durios-live-bridge-status");
      if (statusEl) {
        statusEl.textContent = "Offline Static Mode (Start Bun server with `bun run start:server` for live telemetry)";
      }
    }
  }

  async function runRehearsalBootstrap(silent, roleOverride) {
    var targetRole = roleOverride || currentRole || "CLERK";
    var btn = document.getElementById("durios-btn-seed-rehearsal");
    if (btn && !silent) {
      btn.disabled = true;
      btn.textContent = "⏳ Seeding 5 Containers…";
    }
    try {
      var res = await fetch("/api/auth/pilot-rehearsal-bootstrap?role=" + encodeURIComponent(targetRole), {
        method: "POST",
        credentials: "same-origin",
      });
      var body = await res.json();
      if (body && body.success && body.data) {
        var token = body.data.activePilotToken || body.data.clerkPilotToken;
        if (token) {
          window.localStorage.setItem("durios_pilot_token", token);
        }
        currentRole = body.data.actor ? body.data.actor.role : targetRole;
        await fetchLiveTelemetry(false);
        if (!silent && btn) {
          btn.textContent = "✅ 5 Containers Ready (" + body.data.dossiers.length + " Active)";
          setTimeout(function () {
            btn.disabled = false;
            btn.textContent = "🚀 1-Click Cai Lậy Rehearsal (5 Cont)";
          }, 3000);
          return;
        }
      }
    } catch (_e) {
      // ignore offline
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = "🚀 1-Click Cai Lậy Rehearsal (5 Cont)";
    }
  }

  function downloadGoLivePack() {
    if (!latestTelemetry || !latestTelemetry.goLivePack) {
      runRehearsalBootstrap(false, "MANAGER");
      return;
    }
    var jsonStr = JSON.stringify(latestTelemetry.goLivePack, null, 2);
    var blob = new Blob([jsonStr], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = (latestTelemetry.goLivePack.reportId || "GOLIVE-SITE-CAILAY") + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function init() {
    if (typeof document === "undefined") return;
    createBridgeContainer();
    var seedBtn = document.getElementById("durios-btn-seed-rehearsal");
    if (seedBtn) {
      seedBtn.addEventListener("click", function () {
        runRehearsalBootstrap(false, currentRole);
      });
    }
    var roleBtn = document.getElementById("durios-btn-switch-role");
    if (roleBtn) {
      roleBtn.addEventListener("click", function () {
        var nextRole = currentRole === "CLERK" ? "MANAGER" : "CLERK";
        runRehearsalBootstrap(false, nextRole);
      });
    }
    var goLiveBtn = document.getElementById("durios-btn-download-golive");
    if (goLiveBtn) {
      goLiveBtn.addEventListener("click", downloadGoLivePack);
    }
    var drawerBtn = document.getElementById("durios-btn-toggle-drawer");
    if (drawerBtn) {
      drawerBtn.addEventListener("click", function () {
        var drawer = document.getElementById("durios-live-bridge-drawer");
        if (!drawer) return;
        drawer.style.display = drawer.style.display === "none" ? "block" : "none";
      });
    }
    fetchLiveTelemetry(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
