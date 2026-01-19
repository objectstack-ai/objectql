<template>
  <div class="progress-overview">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ overallProgress }}%</div>
        <div class="stat-label">Overall Completion</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ testCoverage }}%</div>
        <div class="stat-label">Test Coverage</div>
        <div class="progress-bar">
          <div class="progress-fill coverage" :style="{ width: testCoverage + '%' }"></div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ packagesStable }}/{{ totalPackages }}</div>
        <div class="stat-label">Stable Packages</div>
        <div class="progress-bar">
          <div class="progress-fill stable" :style="{ width: (packagesStable / totalPackages * 100) + '%' }"></div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ featuresComplete }}/{{ totalFeatures }}</div>
        <div class="stat-label">Features Complete</div>
        <div class="progress-bar">
          <div class="progress-fill features" :style="{ width: (featuresComplete / totalFeatures * 100) + '%' }"></div>
        </div>
      </div>
    </div>
    
    <div class="status-summary">
      <div class="summary-item">
        <span class="status-badge stable">✅</span>
        <span>Core Engine: Stable (v3.0.0)</span>
      </div>
      <div class="summary-item">
        <span class="status-badge progress">🔄</span>
        <span>Workflow Engine: 35% Complete</span>
      </div>
      <div class="summary-item">
        <span class="status-badge progress">🔄</span>
        <span>Security & Permissions: 70% Complete</span>
      </div>
      <div class="summary-item">
        <span class="status-badge planned">📋</span>
        <span>GraphQL API: Planned for v3.3.0</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Based on docs/project-status.md data
const overallProgress = ref(75)
const testCoverage = ref(75)
const packagesStable = ref(11)
const totalPackages = ref(14)
const featuresComplete = ref(68)
const totalFeatures = ref(91)
</script>

<style scoped>
.progress-overview {
  margin: 2rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
}

.progress-bar {
  height: 8px;
  background: var(--vp-c-bg-alt);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--vp-c-brand-1);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.coverage {
  background: #10b981;
}

.progress-fill.stable {
  background: #3b82f6;
}

.progress-fill.features {
  background: #8b5cf6;
}

.status-summary {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
}

.status-badge {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.status-badge.stable {
  filter: none;
}

.status-badge.progress {
  filter: none;
}

.status-badge.planned {
  filter: none;
}
</style>
