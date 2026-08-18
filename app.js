/* ==========================================================================
   VESPER AI — INTERACTIVE APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Mock API Endpoint Data Store --- */
  const mockRoutes = {
    'chat-completions': {
      method: 'POST',
      url: 'https://api.vesper.dev/v1/chat/completions',
      requestBody: {
        model: 'vesper-edge-v1',
        messages: [
          { role: 'system', content: 'You are a hyper-optimized API mock generator.' },
          { role: 'user', content: 'Generate synthetic checkout session payload' }
        ],
        temperature: 0.2,
        stream: false
      },
      responses: {
        '200': {
          id: 'chatcmpl-vesper-9a8f7c6e',
          object: 'chat.completion',
          created: 1776543800,
          model: 'vesper-edge-v1',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Checkout session created successfully. Session ID: cs_test_a1b2c3d4e5f6'
              },
              finish_reason: 'stop'
            }
          ],
          usage: { prompt_tokens: 28, completion_tokens: 18, total_tokens: 46 },
          _vesper_meta: { edge_region: 'us-east-iad', execution_time_ms: 12 }
        },
        '429': {
          error: {
            code: 'rate_limit_exceeded',
            message: 'Rate limit exceeded: 100 requests per minute allowed on free tier.',
            type: 'requests_exceeded'
          }
        },
        '500': {
          error: {
            code: 'internal_server_error',
            message: 'Upstream edge worker panic simulated by Vesper Workbench.',
            type: 'simulation_error'
          }
        }
      }
    },

    'analytics-realtime': {
      method: 'GET',
      url: 'https://api.vesper.dev/v1/analytics/realtime',
      requestBody: {
        /* GET request has no body */
        query_params: { timeframe: '5m', metrics: ['p99_latency', 'active_connections'] }
      },
      responses: {
        '200': {
          status: 'success',
          timestamp: '2026-08-18T23:50:00Z',
          metrics: {
            p95_latency_ms: 8.4,
            p99_latency_ms: 14.1,
            active_connections: 42890,
            requests_per_sec: 12450.8,
            cache_hit_ratio: 0.994
          },
          regions: [
            { id: 'iad1', status: 'healthy', load: 0.34 },
            { id: 'lhr1', status: 'healthy', load: 0.28 },
            { id: 'nrt1', status: 'healthy', load: 0.41 }
          ]
        },
        '429': {
          error: { code: 'rate_limit_exceeded', message: 'Analytics query quota reached.' }
        },
        '500': {
          error: { code: 'analytics_db_timeout', message: 'Simulated downstream timeout.' }
        }
      }
    },

    'users-state': {
      method: 'PUT',
      url: 'https://api.vesper.dev/v1/users/state',
      requestBody: {
        user_id: 'usr_998231',
        tier: 'enterprise',
        feature_flags: {
          enable_contract_guard: true,
          enable_ai_drift_detection: true
        }
      },
      responses: {
        '200': {
          status: 'updated',
          user_id: 'usr_998231',
          tier: 'enterprise',
          updated_at: '2026-08-18T23:50:02Z',
          synced_nodes: 14,
          audit_log_id: 'aud_8837192'
        },
        '429': {
          error: { code: 'write_rate_limited', message: 'Too many state updates in short window.' }
        },
        '500': {
          error: { code: 'state_commit_failed', message: 'Simulated distributed lock failure.' }
        }
      }
    }
  };

  /* Active Workbench State */
  let activeRouteId = 'chat-completions';
  let currentLatency = 15;
  let currentStatusCode = '200';

  /* --- DOM Elements --- */
  const routeTabs = document.querySelectorAll('.route-tab');
  const reqMethodPill = document.getElementById('req-method');
  const reqUrlText = document.getElementById('req-url');
  const reqBodyCode = document.getElementById('req-body-code');
  const resBodyCode = document.getElementById('res-body-code');
  const sendReqBtn = document.getElementById('send-req-btn');
  const latencySlider = document.getElementById('latency-slider');
  const latencyValSpan = document.getElementById('latency-val');
  const statusSelect = document.getElementById('status-select');
  const statusTag = document.getElementById('status-tag');
  const latencyTag = document.getElementById('latency-tag');
  const copyCurlBtn = document.getElementById('copy-curl-btn');
  const copyJsonBtn = document.getElementById('copy-json-btn');

  /* --- Syntax Highlighting Helper for JSON --- */
  function formatAndHighlightJSON(obj) {
    const jsonStr = JSON.stringify(obj, null, 2);
    return jsonStr.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'j-num';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'j-key';
        } else {
          cls = 'j-str';
        }
      } else if (/true|false/.test(match)) {
        cls = 'j-bool';
      } else if (/null/.test(match)) {
        cls = 'j-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
  }

  /* --- Render Workbench Function --- */
  function updateWorkbench() {
    const route = mockRoutes[activeRouteId];
    if (!route) return;

    // Update Request UI
    reqMethodPill.textContent = route.method;
    reqMethodPill.className = `method-pill method-${route.method.toLowerCase()}`;
    reqUrlText.textContent = route.url;

    reqBodyCode.innerHTML = formatAndHighlightJSON(route.requestBody);

    // Get mock response based on selected status code
    const resData = route.responses[currentStatusCode] || route.responses['200'];
    resBodyCode.innerHTML = formatAndHighlightJSON(resData);

    // Update Status Pill
    if (currentStatusCode === '200') {
      statusTag.textContent = '200 OK';
      statusTag.className = 'status-ok';
    } else if (currentStatusCode === '429') {
      statusTag.textContent = '429 Too Many Requests';
      statusTag.className = 'status-err';
    } else {
      statusTag.textContent = '500 Internal Error';
      statusTag.className = 'status-err';
    }

    latencyTag.textContent = `${currentLatency}ms`;
  }

  /* --- Tab Switchers --- */
  routeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      routeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeRouteId = tab.getAttribute('data-route');
      updateWorkbench();
    });
  });

  /* --- Latency & Status Controls --- */
  if (latencySlider) {
    latencySlider.addEventListener('input', (e) => {
      currentLatency = e.target.value;
      if (latencyValSpan) latencyValSpan.textContent = `${currentLatency}ms`;
      if (latencyTag) latencyTag.textContent = `${currentLatency}ms`;
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentStatusCode = e.target.value;
      updateWorkbench();
    });
  }

  /* --- Quick Preset Simulation Buttons --- */
  const preset200Btn = document.getElementById('preset-200-btn');
  const preset429Btn = document.getElementById('preset-429-btn');

  if (preset200Btn) {
    preset200Btn.addEventListener('click', () => {
      currentStatusCode = '200';
      if (statusSelect) statusSelect.value = '200';
      updateWorkbench();
      if (sendReqBtn) sendReqBtn.click();
    });
  }

  if (preset429Btn) {
    preset429Btn.addEventListener('click', () => {
      currentStatusCode = '429';
      if (statusSelect) statusSelect.value = '429';
      updateWorkbench();
      if (sendReqBtn) sendReqBtn.click();
    });
  }

  /* --- Send Request Simulation Button --- */
  if (sendReqBtn) {
    sendReqBtn.addEventListener('click', () => {
      sendReqBtn.disabled = true;
      const originalText = sendReqBtn.innerHTML;
      sendReqBtn.innerHTML = `<svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"></circle></svg> Executing (${currentLatency}ms)...`;

      resBodyCode.style.opacity = '0.4';

      setTimeout(() => {
        sendReqBtn.disabled = false;
        sendReqBtn.innerHTML = originalText;
        resBodyCode.style.opacity = '1';
        updateWorkbench();
        showToast(`⚡ Mock executed in ${currentLatency}ms (${currentStatusCode} response)`);
      }, Math.max(200, parseInt(currentLatency, 10)));
    });
  }

  /* --- Copy Buttons & Toast Notifications --- */
  function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  if (copyCurlBtn) {
    copyCurlBtn.addEventListener('click', () => {
      const route = mockRoutes[activeRouteId];
      const curl = `curl -X ${route.method} "${route.url}" \\\n  -H "Authorization: Bearer vsp_live_key" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(route.requestBody)}'`;
      navigator.clipboard.writeText(curl);
      showToast('cURL command copied to clipboard');
    });
  }

  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', () => {
      const route = mockRoutes[activeRouteId];
      const resData = route.responses[currentStatusCode] || route.responses['200'];
      navigator.clipboard.writeText(JSON.stringify(resData, null, 2));
      showToast('Mock response JSON copied to clipboard');
    });
  }

  // Copy CLI command button in hero
  const copyCliBtn = document.getElementById('copy-cli-btn');
  if (copyCliBtn) {
    copyCliBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('npm i -g vesper-cli');
      showToast('CLI command copied: npm i -g vesper-cli');
    });
  }

  /* --- Feature Demo 2: Prompt Generator Preset Tabs --- */
  const promptChips = document.querySelectorAll('.prompt-chip');
  const specCodeElem = document.getElementById('gen-spec-code');
  const outputCodeElem = document.getElementById('gen-output-code');

  const promptPresets = {
    'stripe': {
      spec: `type CheckoutSession = {\n  id: string;\n  amount_total: number;\n  currency: "usd" | "eur";\n  payment_status: "paid" | "unpaid";\n  customer_email: string;\n};`,
      output: {\n  "id": "cs_test_998124a",\n  "amount_total": 4900,\n  "currency": "usd",\n  "payment_status": "paid",\n  "customer_email": "alex@devteam.io"\n}
    },
    'oauth': {
      spec: `type TokenResponse = {\n  access_token: string;\n  token_type: "Bearer";\n  expires_in: 3600;\n  refresh_token: string;\n  scope: string;\n};`,
      output: {\n  "access_token": "vsp_at_891238912739",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "refresh_token": "vsp_rt_00192830192",\n  "scope": "read:api write:mocks"\n}
    },
    'iot': {
      spec: `type SensorPayload = {\n  device_id: string;\n  temperature_celsius: number;\n  humidity_pct: number;\n  status: "nominal" | "warning";\n};`,
      output: {\n  "device_id": "sensor-node-tx42",\n  "temperature_celsius": 21.4,\n  "humidity_pct": 45.2,\n  "status": "nominal"\n}
    }
  };

  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      promptChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const key = chip.getAttribute('data-preset');
      const data = promptPresets[key];
      if (data && specCodeElem && outputCodeElem) {
        specCodeElem.textContent = data.spec;
        outputCodeElem.textContent = JSON.stringify(data.output, null, 2);
      }
    });
  });

  /* --- Command Palette Modal Logic (Ctrl+K / ⌘K) --- */
  const cmdModal = document.getElementById('cmd-modal');
  const cmdInput = document.getElementById('cmd-search-input');
  const cmdItems = document.querySelectorAll('.cmd-item');

  function openCmdModal() {
    if (cmdModal) {
      cmdModal.classList.add('open');
      if (cmdInput) {
        cmdInput.value = '';
        setTimeout(() => cmdInput.focus(), 50);
      }
    }
  }

  function closeCmdModal() {
    if (cmdModal) cmdModal.classList.remove('open');
  }

  // Keyboard shortcut listener (Ctrl+K / Cmd+K / Esc)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdModal.classList.contains('open')) {
        closeCmdModal();
      } else {
        openCmdModal();
      }
    } else if (e.key === 'Escape' && cmdModal && cmdModal.classList.contains('open')) {
      closeCmdModal();
    }
  });

  // Close on clicking backdrop
  if (cmdModal) {
    cmdModal.addEventListener('click', (e) => {
      if (e.target === cmdModal) closeCmdModal();
    });
  }

  // Command item execution
  cmdItems.forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      closeCmdModal();
      if (action === 'route-chat') {
        const tab = document.querySelector('.route-tab[data-route="chat-completions"]');
        if (tab) tab.click();
      } else if (action === 'route-analytics') {
        const tab = document.querySelector('.route-tab[data-route="analytics-realtime"]');
        if (tab) tab.click();
      } else if (action === 'route-users') {
        const tab = document.querySelector('.route-tab[data-route="users-state"]');
        if (tab) tab.click();
      } else if (action === 'copy-cli') {
        navigator.clipboard.writeText('npm i -g vesper-cli');
        showToast('CLI command copied: npm i -g vesper-cli');
      }
    });
  });

  /* --- Initial Render Call --- */
  updateWorkbench();

});
