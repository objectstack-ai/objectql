<template>
  <div class="package-status">
    <div class="package-section">
      <h3>Foundation Layer</h3>
      <div class="package-grid">
        <PackageCard
          v-for="pkg in foundationPackages"
          :key="pkg.name"
          :package="pkg"
        />
      </div>
    </div>
    
    <div class="package-section">
      <h3>Database Drivers</h3>
      <div class="package-grid">
        <PackageCard
          v-for="pkg in driverPackages"
          :key="pkg.name"
          :package="pkg"
        />
      </div>
    </div>
    
    <div class="package-section">
      <h3>Runtime & Tools</h3>
      <div class="package-grid">
        <PackageCard
          v-for="pkg in toolPackages"
          :key="pkg.name"
          :package="pkg"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const PackageCard = {
  props: ['package'],
  template: `
    <div class="package-card" :class="package.status">
      <div class="package-header">
        <div class="package-name">{{ package.name }}</div>
        <div class="package-badge" :class="package.status">{{ package.statusLabel }}</div>
      </div>
      <div class="package-info">
        <div class="info-row">
          <span class="label">Version:</span>
          <span class="value">{{ package.version }}</span>
        </div>
        <div class="info-row" v-if="package.coverage">
          <span class="label">Coverage:</span>
          <span class="value">{{ package.coverage }}</span>
        </div>
        <div class="info-row">
          <span class="label">Production:</span>
          <span class="value">{{ package.production ? '✅' : '⚠️' }}</span>
        </div>
      </div>
    </div>
  `
}

const foundationPackages = ref([
  { name: '@objectql/types', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: 'N/A', production: true },
  { name: '@objectql/core', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: '70%', production: true },
  { name: '@objectql/platform-node', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: '65%', production: true },
])

const driverPackages = ref([
  { name: '@objectql/driver-sql', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: '90%', production: true },
  { name: '@objectql/driver-mongo', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: '85%', production: true },
  { name: '@objectql/driver-memory', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: '80%', production: true },
  { name: '@objectql/driver-localstorage', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: '75%', production: true },
  { name: '@objectql/driver-redis', version: '3.0.0', status: 'beta', statusLabel: '🔄 Beta', coverage: '60%', production: false },
  { name: '@objectql/driver-excel', version: '3.0.0', status: 'beta', statusLabel: '🔄 Beta', coverage: '50%', production: false },
  { name: '@objectql/driver-fs', version: '3.0.0', status: 'beta', statusLabel: '🔄 Beta', coverage: '40%', production: false },
  { name: '@objectql/sdk', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: '70%', production: true },
])

const toolPackages = ref([
  { name: '@objectql/server', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: '80%', production: true },
  { name: '@objectql/cli', version: '3.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: 'N/A', production: true },
  { name: 'vscode-objectql', version: '2.0.0', status: 'stable', statusLabel: '✅ Stable', coverage: 'N/A', production: true },
])
</script>

<style scoped>
.package-status {
  margin: 2rem 0;
}

.package-section {
  margin-bottom: 3rem;
}

.package-section h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--vp-c-text-1);
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.package-card {
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.2s ease;
}

.package-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.package-card.stable {
  border-left: 3px solid #10b981;
}

.package-card.beta {
  border-left: 3px solid #f59e0b;
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.package-name {
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  word-break: break-word;
}

.package-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.package-badge.stable {
  background: #10b98120;
  color: #10b981;
}

.package-badge.beta {
  background: #f59e0b20;
  color: #f59e0b;
}

.package-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.info-row .label {
  color: var(--vp-c-text-2);
}

.info-row .value {
  font-weight: 500;
  color: var(--vp-c-text-1);
  font-family: monospace;
}
</style>
