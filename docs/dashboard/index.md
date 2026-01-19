---
layout: page
title: Development Progress Dashboard
---

<script setup>
import ProgressOverview from './components/ProgressOverview.vue'
import PackageStatus from './components/PackageStatus.vue'
import FeatureMatrix from './components/FeatureMatrix.vue'
import TestCoverage from './components/TestCoverage.vue'
import MilestoneTimeline from './components/MilestoneTimeline.vue'
import RecentActivity from './components/RecentActivity.vue'
</script>

# ObjectQL Development Progress

<div class="dashboard-intro">
Visual evaluation dashboard for ObjectQL development progress. Updated automatically from GitHub Actions and project metadata.
</div>

## Overview

<ProgressOverview />

## Package Status

<PackageStatus />

## Feature Implementation

<FeatureMatrix />

## Test Coverage

<TestCoverage />

## Roadmap & Milestones

<MilestoneTimeline />

## Recent Activity

<RecentActivity />

---

<div class="dashboard-footer">
<p><strong>Last Updated:</strong> {{ new Date().toLocaleString() }}</p>
<p>Data is automatically synchronized from GitHub and CI/CD workflows.</p>
</div>

<style scoped>
.dashboard-intro {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  margin-bottom: 2rem;
}

.dashboard-footer {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}
</style>
