<template>
  <div class="feature-matrix">
    <div class="matrix-section" v-for="category in featureCategories" :key="category.name">
      <h3>{{ category.name }}</h3>
      <div class="progress-header">
        <span>{{ category.completion }}% Complete</span>
        <div class="mini-progress">
          <div class="mini-fill" :style="{ width: category.completion + '%' }"></div>
        </div>
      </div>
      <div class="feature-list">
        <div
          v-for="feature in category.features"
          :key="feature.name"
          class="feature-item"
          :class="feature.status"
        >
          <span class="feature-icon">{{ getStatusIcon(feature.status) }}</span>
          <span class="feature-name">{{ feature.name }}</span>
          <span v-if="feature.note" class="feature-note">{{ feature.note }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const getStatusIcon = (status) => {
  switch (status) {
    case 'complete': return '✅'
    case 'progress': return '🔄'
    case 'planned': return '📋'
    default: return '⬜'
  }
}

const featureCategories = ref([
  {
    name: 'Core Features',
    completion: 90,
    features: [
      { name: 'Object definition (YAML)', status: 'complete' },
      { name: 'Field types', status: 'complete' },
      { name: 'Relationships (lookup, master-detail)', status: 'complete' },
      { name: 'CRUD operations', status: 'complete' },
      { name: 'Query language (filters, sorting, pagination)', status: 'complete' },
      { name: 'Aggregations', status: 'complete' },
      { name: 'Transactions', status: 'complete' },
      { name: 'Schema synchronization', status: 'complete' },
      { name: 'Data seeding', status: 'complete' },
    ]
  },
  {
    name: 'Validation & Rules',
    completion: 75,
    features: [
      { name: 'Field validation (required, min, max, regex)', status: 'complete' },
      { name: 'Cross-field validation', status: 'complete' },
      { name: 'Formula fields', status: 'complete' },
      { name: 'Default values', status: 'complete' },
      { name: 'Unique constraints', status: 'complete' },
      { name: 'Async validation', status: 'planned', note: 'External API calls' },
      { name: 'Custom validation functions', status: 'planned' },
    ]
  },
  {
    name: 'Business Logic',
    completion: 60,
    features: [
      { name: 'Hooks (before/after CRUD)', status: 'complete' },
      { name: 'Custom actions (RPC)', status: 'complete' },
      { name: 'Formula engine', status: 'complete' },
      { name: 'Workflow engine', status: 'progress', note: '35% complete' },
      { name: 'Approval processes', status: 'planned' },
      { name: 'Scheduled jobs', status: 'planned' },
    ]
  },
  {
    name: 'Security & Permissions',
    completion: 70,
    features: [
      { name: 'Basic RBAC framework', status: 'complete' },
      { name: 'User context', status: 'complete' },
      { name: 'Row-level security (RLS)', status: 'progress' },
      { name: 'Field-level permissions', status: 'progress' },
      { name: 'Permission inheritance', status: 'planned' },
      { name: 'Audit logging', status: 'progress' },
    ]
  },
  {
    name: 'API & Integration',
    completion: 80,
    features: [
      { name: 'JSON-RPC endpoint', status: 'complete' },
      { name: 'REST API', status: 'complete' },
      { name: 'File upload/download', status: 'complete' },
      { name: 'Metadata introspection API', status: 'complete' },
      { name: 'GraphQL endpoint', status: 'planned' },
      { name: 'WebSocket subscriptions', status: 'planned' },
    ]
  },
  {
    name: 'Documentation',
    completion: 75,
    features: [
      { name: 'Getting started guide', status: 'complete' },
      { name: 'Data modeling guide', status: 'complete' },
      { name: 'Query language guide', status: 'complete' },
      { name: 'Tutorials', status: 'complete' },
      { name: 'Driver guides', status: 'complete' },
      { name: 'Complete API reference', status: 'progress' },
      { name: 'Video tutorials', status: 'planned' },
    ]
  }
])
</script>

<style scoped>
.feature-matrix {
  margin: 2rem 0;
}

.matrix-section {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.matrix-section h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--vp-c-text-1);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.mini-progress {
  flex: 1;
  height: 6px;
  background: var(--vp-c-bg-alt);
  border-radius: 3px;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  background: var(--vp-c-brand-1);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.feature-item:hover {
  background: var(--vp-c-bg-alt);
}

.feature-item.complete {
  opacity: 1;
}

.feature-item.progress {
  opacity: 0.9;
}

.feature-item.planned {
  opacity: 0.7;
}

.feature-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.feature-name {
  flex: 1;
  color: var(--vp-c-text-1);
}

.feature-note {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  font-style: italic;
}
</style>
