<template>
  <div class="recent-activity">
    <div class="activity-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div class="activity-content">
      <div v-if="activeTab === 'commits'" class="activity-list">
        <div v-for="commit in commits" :key="commit.sha" class="activity-item">
          <div class="item-icon commit">📝</div>
          <div class="item-content">
            <div class="item-title">{{ commit.message }}</div>
            <div class="item-meta">
              <span class="meta-author">{{ commit.author }}</span>
              <span class="meta-separator">•</span>
              <span class="meta-date">{{ commit.date }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'releases'" class="activity-list">
        <div v-for="release in releases" :key="release.version" class="activity-item">
          <div class="item-icon release">🚀</div>
          <div class="item-content">
            <div class="item-title">{{ release.version }} - {{ release.title }}</div>
            <div class="item-description">{{ release.description }}</div>
            <div class="item-meta">
              <span class="meta-date">{{ release.date }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'milestones'" class="activity-list">
        <div v-for="milestone in recentMilestones" :key="milestone.id" class="activity-item">
          <div class="item-icon milestone">✅</div>
          <div class="item-content">
            <div class="item-title">{{ milestone.title }}</div>
            <ul class="milestone-achievements">
              <li v-for="item in milestone.items" :key="item">{{ item }}</li>
            </ul>
            <div class="item-meta">
              <span class="meta-date">{{ milestone.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('commits')

const tabs = [
  { id: 'commits', label: 'Recent Commits' },
  { id: 'releases', label: 'Releases' },
  { id: 'milestones', label: 'Milestones' }
]

const commits = ref([
  {
    sha: '1',
    message: 'Refactor ObjectQL adherence',
    author: 'Core Team',
    date: 'Jan 18, 2026'
  },
  {
    sha: '2',
    message: 'Add workflow engine foundation',
    author: 'Core Team',
    date: 'Jan 15, 2026'
  },
  {
    sha: '3',
    message: 'Improve test coverage for core package',
    author: 'Core Team',
    date: 'Jan 12, 2026'
  },
  {
    sha: '4',
    message: 'Update VitePress documentation',
    author: 'Core Team',
    date: 'Jan 10, 2026'
  },
  {
    sha: '5',
    message: 'Fix SQL driver connection pooling',
    author: 'Core Team',
    date: 'Jan 8, 2026'
  }
])

const releases = ref([
  {
    version: 'v3.0.0',
    title: 'Major Release',
    description: 'VitePress documentation refactor, file attachment API, stable memory and LocalStorage drivers',
    date: 'January 2026'
  },
  {
    version: 'v2.5.0',
    title: 'VSCode Extension v2.0',
    description: 'Enhanced IntelliSense, improved validation, and new code snippets',
    date: 'December 2025'
  },
  {
    version: 'v2.4.0',
    title: 'Driver Ecosystem Expansion',
    description: 'Added Redis and Excel drivers (experimental), MongoDB improvements',
    date: 'November 2025'
  }
])

const recentMilestones = ref([
  {
    id: '1',
    title: 'v3.0.0 Launch',
    items: [
      'VitePress documentation site refactor',
      'File attachment API completed',
      'Memory and LocalStorage drivers stable',
      'Core protocol finalized'
    ],
    date: 'January 2026'
  },
  {
    id: '2',
    title: 'Developer Tools Enhancement',
    items: [
      'VSCode extension v2.0 released',
      'CLI improvements for project scaffolding',
      'Enhanced validation and IntelliSense'
    ],
    date: 'December 2025'
  },
  {
    id: '3',
    title: 'Tutorial Suite Completion',
    items: [
      'Task Manager tutorial (Beginner)',
      'Micro-CRM tutorial (Intermediate)',
      'Federation tutorial (Advanced)',
      'AI Agent tutorial (AI-Native)'
    ],
    date: 'November 2025'
  }
])
</script>

<style scoped>
.recent-activity {
  margin: 2rem 0;
}

.activity-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.tab-btn {
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--vp-c-text-1);
}

.tab-btn.active {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
}

.activity-content {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  padding: 1.5rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.2s ease;
}

.activity-item:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateX(4px);
}

.item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  flex-shrink: 0;
}

.item-icon.commit {
  background: #3b82f620;
}

.item-icon.release {
  background: #10b98120;
}

.item-icon.milestone {
  background: #8b5cf620;
}

.item-content {
  flex: 1;
}

.item-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  margin-bottom: 0.5rem;
}

.item-description {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.meta-author {
  font-weight: 500;
}

.meta-separator {
  opacity: 0.5;
}

.milestone-achievements {
  margin: 0.75rem 0;
  padding-left: 1.25rem;
  list-style: disc;
}

.milestone-achievements li {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}
</style>
