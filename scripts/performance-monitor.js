#!/usr/bin/env node

/**
 * Performance monitoring script for Vercel deployments
 * Tracks build times, bundle sizes, and deployment metrics
 */

const fs = require('fs-extra');
const path = require('path');
const { performance } = require('perf_hooks');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      buildStart: null,
      buildEnd: null,
      bundleSizes: {},
      dependencies: {},
      deploymentMetrics: {},
    };
    this.thresholds = {
      buildTime: 180000, // 3 minutes
      initialBundleSize: 1024 * 1024, // 1MB
      totalBundleSize: 5 * 1024 * 1024, // 5MB
      coldStartTime: 2000, // 2 seconds
    };
  }

  startBuildTimer() {
    this.metrics.buildStart = performance.now();
    console.log('📊 Performance monitoring started...');
  }

  endBuildTimer() {
    this.metrics.buildEnd = performance.now();
    const buildTime = this.metrics.buildEnd - this.metrics.buildStart;
    
    console.log(`⏱️  Build completed in ${(buildTime / 1000).toFixed(2)}s`);
    
    if (buildTime > this.thresholds.buildTime) {
      console.warn(`⚠️  Build time exceeded threshold: ${(buildTime / 1000).toFixed(2)}s > ${(this.thresholds.buildTime / 1000)}s`);
    } else {
      console.log(`✅ Build time within threshold: ${(buildTime / 1000).toFixed(2)}s`);
    }
    
    return buildTime;
  }

  async analyzeBundleSizes() {
    const webAppPath = path.join(__dirname, '..', 'apps', 'web');
    const nextBuildPath = path.join(webAppPath, '.next');
    
    if (!await fs.pathExists(nextBuildPath)) {
      console.warn('⚠️  No build output found, skipping bundle analysis');
      return;
    }

    try {
      // Analyze JavaScript bundles
      const staticPath = path.join(nextBuildPath, 'static');
      if (await fs.pathExists(staticPath)) {
        await this.analyzeStaticAssets(staticPath);
      }

      // Check for large dependencies
      await this.analyzeDependencies(webAppPath);
      
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
    }
  }

  async analyzeStaticAssets(staticPath) {
    const jsPath = path.join(staticPath, 'chunks');
    const cssPath = path.join(staticPath, 'css');
    
    let totalJSSize = 0;
    let totalCSSSize = 0;
    
    // Analyze JavaScript chunks
    if (await fs.pathExists(jsPath)) {
      const jsFiles = await fs.readdir(jsPath);
      for (const file of jsFiles) {
        if (file.endsWith('.js')) {
          const filePath = path.join(jsPath, file);
          const stats = await fs.stat(filePath);
          totalJSSize += stats.size;
          
          if (file.includes('main') || file.includes('app')) {
            this.metrics.bundleSizes.initial = stats.size;
          }
        }
      }
    }
    
    // Analyze CSS files
    if (await fs.pathExists(cssPath)) {
      const cssFiles = await fs.readdir(cssPath);
      for (const file of cssFiles) {
        if (file.endsWith('.css')) {
          const filePath = path.join(cssPath, file);
          const stats = await fs.stat(filePath);
          totalCSSSize += stats.size;
        }
      }
    }
    
    this.metrics.bundleSizes.totalJS = totalJSSize;
    this.metrics.bundleSizes.totalCSS = totalCSSSize;
    this.metrics.bundleSizes.total = totalJSSize + totalCSSSize;
    
    console.log(`📦 Bundle Analysis:`);
    console.log(`  JavaScript: ${this.formatBytes(totalJSSize)}`);
    console.log(`  CSS: ${this.formatBytes(totalCSSSize)}`);
    console.log(`  Total: ${this.formatBytes(this.metrics.bundleSizes.total)}`);
    
    // Check thresholds
    if (this.metrics.bundleSizes.initial > this.thresholds.initialBundleSize) {
      console.warn(`⚠️  Initial bundle size exceeded: ${this.formatBytes(this.metrics.bundleSizes.initial)}`);
    }
    
    if (this.metrics.bundleSizes.total > this.thresholds.totalBundleSize) {
      console.warn(`⚠️  Total bundle size exceeded: ${this.formatBytes(this.metrics.bundleSizes.total)}`);
    }
  }

  async analyzeDependencies(webAppPath) {
    const packageJsonPath = path.join(webAppPath, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    
    const heavyDependencies = [
      'puppeteer',
      'googleapis',
      '@google-cloud/kms',
      'openai',
      'bullmq',
      'framer-motion',
      'recharts',
    ];
    
    const foundHeavyDeps = [];
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of heavyDependencies) {
      if (allDeps[dep]) {
        foundHeavyDeps.push({ name: dep, version: allDeps[dep] });
      }
    }
    
    this.metrics.dependencies.heavy = foundHeavyDeps;
    this.metrics.dependencies.total = Object.keys(allDeps).length;
    
    console.log(`📚 Dependencies Analysis:`);
    console.log(`  Total dependencies: ${this.metrics.dependencies.total}`);
    console.log(`  Heavy dependencies: ${foundHeavyDeps.length}`);
    
    if (foundHeavyDeps.length > 0) {
      console.log(`  Heavy deps: ${foundHeavyDeps.map(d => d.name).join(', ')}`);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      buildTime: this.metrics.buildEnd - this.metrics.buildStart,
      performance: {
        buildTimeMs: this.metrics.buildEnd - this.metrics.buildStart,
        withinBuildThreshold: (this.metrics.buildEnd - this.metrics.buildStart) <= this.thresholds.buildTime,
        bundleSizes: this.metrics.bundleSizes,
        withinBundleThreshold: (this.metrics.bundleSizes.total || 0) <= this.thresholds.totalBundleSize,
      },
      dependencies: this.metrics.dependencies,
      recommendations: this.generateRecommendations(),
    };
    
    // Save report
    const reportsDir = path.join(__dirname, '..', 'reports');
    await fs.ensureDir(reportsDir);
    
    const reportPath = path.join(reportsDir, `performance-${Date.now()}.json`);
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    console.log(`📄 Performance report saved: ${reportPath}`);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if ((this.metrics.buildEnd - this.metrics.buildStart) > this.thresholds.buildTime) {
      recommendations.push({
        type: 'build-time',
        message: 'Build time exceeded threshold. Consider optimizing dependencies or build process.',
        action: 'Review heavy dependencies and implement more code splitting',
      });
    }
    
    if ((this.metrics.bundleSizes.total || 0) > this.thresholds.totalBundleSize) {
      recommendations.push({
        type: 'bundle-size',
        message: 'Bundle size exceeded threshold. Implement more dynamic imports.',
        action: 'Add dynamic imports for heavy libraries and implement tree shaking',
      });
    }
    
    if ((this.metrics.dependencies.heavy?.length || 0) > 5) {
      recommendations.push({
        type: 'dependencies',
        message: 'Many heavy dependencies detected. Consider alternatives or lazy loading.',
        action: 'Implement dynamic imports for puppeteer, googleapis, and other heavy packages',
      });
    }
    
    return recommendations;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI interface
async function runMonitoring() {
  const monitor = new PerformanceMonitor();
  
  if (process.argv.includes('--start')) {
    monitor.startBuildTimer();
  }
  
  if (process.argv.includes('--end')) {
    monitor.endBuildTimer();
  }
  
  if (process.argv.includes('--analyze')) {
    await monitor.analyzeBundleSizes();
  }
  
  if (process.argv.includes('--report')) {
    await monitor.generateReport();
  }
  
  if (process.argv.includes('--full')) {
    monitor.startBuildTimer();
    // Simulate build completion
    setTimeout(async () => {
      monitor.endBuildTimer();
      await monitor.analyzeBundleSizes();
      await monitor.generateReport();
    }, 1000);
  }
}

// Export for use in other scripts
module.exports = { PerformanceMonitor };

// Run if called directly
if (require.main === module) {
  runMonitoring().catch(console.error);
}