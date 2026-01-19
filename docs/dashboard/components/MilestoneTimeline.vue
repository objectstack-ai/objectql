<template>
  <div class="milestone-timeline">
    <div class="timeline-header">
      <div class="quarter-nav">
        <button class="quarter-btn active">Q1 2026</button>
        <button class="quarter-btn">Q2 2026</button>
        <button class="quarter-btn">Q3 2026</button>
      </div>
    </div>
    
    <div class="timeline-container">
      <div
        v-for="(milestone, index) in milestones"
        :key="index"
        class="milestone"
        :class="milestone.status"
      >
        <div class="milestone-marker">
          <div class="marker-dot" :class="milestone.status"></div>
          <div class="marker-line" v-if="index < milestones.length - 1"></div>
        </div>
        
        <div class="milestone-content">
          <div class="milestone-header">
            <h4>{{ milestone.title }}</h4>
            <span class="milestone-date">{{ milestone.date }}</span>
          </div>
          
          <div class="milestone-status">
            <span class="status-badge" :class="milestone.status">
              {{ milestone.statusLabel }}
            </span>
            <span v-if="milestone.progress" class="progress-text">
              {{ milestone.progress }}% Complete
            </span>
          </div>
          
          <ul class="milestone-items">
            <li v-for="item in milestone.items" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="roadmap-summary">
      <h4>Upcoming Milestones</h4>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-title">v3.1.0 - Production Ready</div>
          <div class="card-date">March 2026</div>
          <ul class="card-items">
            <li>85%+ test coverage</li>
            <li>Security audit complete</li>
            <li>Performance optimizations</li>
          </ul>
        </div>
        
        <div class="summary-card">
          <div class="card-title">v3.2.0 - Enterprise Features</div>
          <div class="card-date">May 2026</div>
          <ul class="card-items">
            <li>Workflow engine v1.0</li>
            <li>Multi-tenancy support</li>
            <li>Advanced RBAC with RLS</li>
          </ul>
        </div>
        
        <div class="summary-card">
          <div class="card-title">v3.3.0 - Advanced APIs</div>
          <div class="card-date">Q3 2026</div>
          <ul class="card-items">
            <li>GraphQL endpoint</li>
            <li>WebSocket support</li>
            <li>Real-time subscriptions</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const milestones = ref([
  {
    title: 'v3.0.0 Release',
    date: 'January 2026',
    status: 'complete',
    statusLabel: '✅ Complete',
    items: [
      'VitePress documentation refactor',
      'File attachment API',
      'Memory and LocalStorage drivers stable',
      'Core protocol finalized'
    ]
  },
  {
    title: 'Foundation Stabilization',
    date: 'February 2026',
    status: 'progress',
    statusLabel: '🔄 In Progress',
    progress: 60,
    items: [
      'Core engine optimization',
      'Driver reliability improvements',
      'Error handling redesign',
      'Test coverage increase (target: 85%)'
    ]
  },
  {
    title: 'Security & Permissions',
    date: 'March 2026',
    status: 'progress',
    statusLabel: '🔄 In Progress',
    progress: 30,
    items: [
      'Row-level security (RLS) compiler',
      'Field-level permissions',
      'Audit system implementation',
      'Security audit'
    ]
  },
  {
    title: 'Workflow Engine v1.0',
    date: 'April 2026',
    status: 'planned',
    statusLabel: '📋 Planned',
    items: [
      'State machine execution',
      'Approval workflows',
      'Parallel task execution',
      'Workflow versioning'
    ]
  },
  {
    title: 'Multi-Tenancy Support',
    date: 'May 2026',
    status: 'planned',
    statusLabel: '📋 Planned',
    items: [
      'Schema-per-tenant support',
      'Tenant isolation validation',
      'Resource quota enforcement',
      'Tenant management API'
    ]
  }
])
</script>

<style scoped>
.milestone-timeline {
  margin: 2rem 0;
}

.timeline-header {
  margin-bottom: 2rem;
}

.quarter-nav {
  display: flex;
  gap: 0.5rem;
}

.quarter-btn {
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.quarter-btn:hover {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
}

.quarter-btn.active {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

.timeline-container {
  position: relative;
  padding: 1rem 0;
}

.milestone {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.milestone-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0.5rem;
}

.marker-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  z-index: 1;
  flex-shrink: 0;
}

.marker-dot.complete {
  background: #10b981;
  border-color: #10b981;
}

.marker-dot.progress {
  background: #3b82f6;
  border-color: #3b82f6;
}

.marker-dot.planned {
  background: var(--vp-c-bg);
  border-color: var(--vp-c-divider);
}

.marker-line {
  width: 2px;
  flex: 1;
  background: var(--vp-c-divider);
  margin-top: 0.5rem;
  min-height: 60px;
}

.milestone-content {
  flex: 1;
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.milestone.complete .milestone-content {
  border-left: 3px solid #10b981;
}

.milestone.progress .milestone-content {
  border-left: 3px solid #3b82f6;
}

.milestone.planned .milestone-content {
  border-left: 3px solid var(--vp-c-divider);
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.milestone-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.milestone-date {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.milestone-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.complete {
  background: #10b98120;
  color: #10b981;
}

.status-badge.progress {
  background: #3b82f620;
  color: #3b82f6;
}

.status-badge.planned {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
}

.progress-text {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.milestone-items {
  margin: 0;
  padding-left: 1.5rem;
  list-style: disc;
}

.milestone-items li {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.roadmap-summary {
  margin-top: 3rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.roadmap-summary h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  padding: 1.25rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.card-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  margin-bottom: 0.5rem;
}

.card-date {
  font-size: 0.85rem;
  color: var(--vp-c-brand-1);
  margin-bottom: 1rem;
}

.card-items {
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;
}

.card-items li {
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
</style>
