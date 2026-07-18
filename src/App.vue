<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
:root {
  --bg-primary: #faf6f0;
  --bg-card: #ffffff;
  --text-primary: #3e2723;
  --text-secondary: #6d4c41;
  --text-muted: #8d6e63;
  --accent: #8b0000;
  --accent-light: #a52a2a;
  --border: #d7ccc8;
  --shadow: rgba(62, 39, 35, 0.08);
  --radius: 8px;
  --max-width: 720px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

.app-container {
  min-height: 100vh;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  cursor: pointer;
  font-family: inherit;
}

input, textarea, select {
  font-family: inherit;
  font-size: inherit;
}

/* Utility classes */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 500;
  transition: background-color 0.2s, opacity 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--accent);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--accent-light);
}

.btn-secondary {
  background-color: transparent;
  color: var(--accent);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background-color: rgba(139, 0, 0, 0.05);
}

.btn-danger {
  background-color: #c62828;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #b71c1c;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 15px;
  color: var(--text-primary);
  background-color: var(--bg-card);
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.form-error {
  font-size: 13px;
  color: #c62828;
  margin-top: 4px;
}

.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 1px 3px var(--shadow);
}

.page-container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.consent-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.consent-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.consent-badge--yes {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.consent-badge--no {
  background-color: #fce4ec;
  color: #c62828;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-state p {
  font-size: 15px;
  margin-bottom: 20px;
}

/* Checkbox/Toggle for consent */
.toggle-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.toggle-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}

.toggle-group label {
  font-size: 15px;
  color: var(--text-primary);
  cursor: pointer;
}
</style>
