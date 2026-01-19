<template>
  <div class="test-coverage">
    <div class="coverage-overview">
      <div class="coverage-card">
        <div class="card-header">
          <h4>Overall Coverage</h4>
          <span class="coverage-value">{{ overallCoverage }}%</span>
        </div>
        <div class="coverage-bar">
          <div class="coverage-fill" :style="{ width: overallCoverage + '%' }"></div>
        </div>
        <div class="coverage-status">
          <span :class="getCoverageClass(overallCoverage)">{{ getCoverageStatus(overallCoverage) }}</span>
          <span class="target">Target: 85%</span>
        </div>
      </div>
      
      <div class="coverage-stats">
        <div class="stat">
          <span class="stat-label">Total Test Files</span>
          <span class="stat-value">38</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Tests</span>
          <span class="stat-value">500+</span>
        </div>
        <div class="stat">
          <span class="stat-label">All Tests Passing</span>
          <span class="stat-value">✅</span>
        </div>
      </div>
    </div>
    
    <div class="package-coverage">
      <h4>Package Coverage Breakdown</h4>
      <div class="coverage-list">
        <div
          v-for="pkg in packages"
          :key="pkg.name"
          class="coverage-item"
        >
          <div class="pkg-info">
            <span class="pkg-name">{{ pkg.name }}</span>
            <span class="pkg-coverage" :class="getCoverageClass(pkg.coverage)">
              {{ pkg.coverage }}%
            </span>
          </div>
          <div class="pkg-bar">
            <div
              class="pkg-fill"
              :class="getCoverageClass(pkg.coverage)"
              :style="{ width: pkg.coverage + '%' }"
            ></div>
          </div>
          <div class="pkg-status">
            <span class="status-text">{{ getCoverageStatus(pkg.coverage) }}</span>
            <span class="target-text">Target: {{ pkg.target }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const overallCoverage = ref(75)

const packages = ref([
  { name: 'Core Engine', coverage: 70, target: 85 },
  { name: 'SQL Driver', coverage: 90, target: 90 },
  { name: 'MongoDB Driver', coverage: 85, target: 85 },
  { name: 'Memory Driver', coverage: 80, target: 80 },
  { name: 'Server', coverage: 80, target: 85 },
  { name: 'Platform Node', coverage: 65, target: 80 },
])

const getCoverageClass = (coverage) => {
  if (coverage >= 85) return 'excellent'
  if (coverage >= 70) return 'good'
  if (coverage >= 50) return 'moderate'
  return 'low'
}

const getCoverageStatus = (coverage) => {
  if (coverage >= 85) return 'Excellent'
  if (coverage >= 70) return 'Good'
  if (coverage >= 50) return 'Moderate'
  return 'Needs Improvement'
}
</script>

<style scoped>
.test-coverage {
  margin: 2rem 0;
}

.coverage-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.coverage-card {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h4 {
  font-size: 1rem;
  margin: 0;
  color: var(--vp-c-text-1);
}

.coverage-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--vp-c-brand-1);
}

.coverage-bar {
  height: 12px;
  background: var(--vp-c-bg-alt);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.coverage-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.coverage-status {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.coverage-status .excellent {
  color: #10b981;
  font-weight: 600;
}

.coverage-status .good {
  color: #3b82f6;
  font-weight: 600;
}

.coverage-status .moderate {
  color: #f59e0b;
  font-weight: 600;
}

.coverage-status .low {
  color: #ef4444;
  font-weight: 600;
}

.coverage-status .target {
  color: var(--vp-c-text-2);
}

.coverage-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.package-coverage {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.package-coverage h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
  color: var(--vp-c-text-1);
}

.coverage-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.coverage-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pkg-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pkg-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.pkg-coverage {
  font-size: 0.9rem;
  font-weight: 600;
}

.pkg-coverage.excellent {
  color: #10b981;
}

.pkg-coverage.good {
  color: #3b82f6;
}

.pkg-coverage.moderate {
  color: #f59e0b;
}

.pkg-coverage.low {
  color: #ef4444;
}

.pkg-bar {
  height: 8px;
  background: var(--vp-c-bg-alt);
  border-radius: 4px;
  overflow: hidden;
}

.pkg-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.pkg-fill.excellent {
  background: #10b981;
}

.pkg-fill.good {
  background: #3b82f6;
}

.pkg-fill.moderate {
  background: #f59e0b;
}

.pkg-fill.low {
  background: #ef4444;
}

.pkg-status {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.status-text {
  color: var(--vp-c-text-2);
}

.target-text {
  color: var(--vp-c-text-3);
  font-style: italic;
}

@media (max-width: 768px) {
  .coverage-overview {
    grid-template-columns: 1fr;
  }
}
</style>
