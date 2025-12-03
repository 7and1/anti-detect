#!/usr/bin/env node

/**
 * Bundle size analysis script
 * Analyzes the Next.js build output and reports bundle sizes
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../.next');
const CHUNKS_DIR = path.join(BUILD_DIR, 'static/chunks');

// File size thresholds (in KB)
const THRESHOLDS = {
  warning: 244, // Yellow warning at 244KB (uncompressed)
  error: 488, // Red error at 488KB (uncompressed)
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get color code based on size
 */
function getColorCode(sizeKB) {
  if (sizeKB >= THRESHOLDS.error) return '\x1b[31m'; // Red
  if (sizeKB >= THRESHOLDS.warning) return '\x1b[33m'; // Yellow
  return '\x1b[32m'; // Green
}

/**
 * Get all JavaScript files recursively
 */
function getJsFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getJsFiles(fullPath));
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Analyze bundle
 */
function analyzeBundle() {
  console.log('\n📦 Bundle Size Analysis\n');

  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Please run `pnpm build` first.');
    process.exit(1);
  }

  // Get all JS files
  const jsFiles = getJsFiles(CHUNKS_DIR);

  if (jsFiles.length === 0) {
    console.error('❌ No JavaScript files found in build output.');
    process.exit(1);
  }

  // Calculate sizes
  const fileSizes = jsFiles.map((file) => {
    const stat = fs.statSync(file);
    const relativePath = path.relative(CHUNKS_DIR, file);
    const sizeKB = stat.size / 1024;

    return {
      path: relativePath,
      size: stat.size,
      sizeKB,
    };
  });

  // Sort by size (descending)
  fileSizes.sort((a, b) => b.size - a.size);

  // Calculate total
  const totalSize = fileSizes.reduce((sum, file) => sum + file.size, 0);
  const totalSizeKB = totalSize / 1024;

  // Print results
  console.log('Top 10 largest chunks:\n');

  fileSizes.slice(0, 10).forEach((file, index) => {
    const colorCode = getColorCode(file.sizeKB);
    const resetCode = '\x1b[0m';
    const status =
      file.sizeKB >= THRESHOLDS.error
        ? '❌'
        : file.sizeKB >= THRESHOLDS.warning
        ? '⚠️'
        : '✅';

    console.log(
      `${status} ${index + 1}. ${file.path}\n   ${colorCode}${formatBytes(
        file.size
      )} (${file.sizeKB.toFixed(2)} KB)${resetCode}`
    );
  });

  console.log(`\n📊 Total JavaScript size: ${formatBytes(totalSize)} (${totalSizeKB.toFixed(2)} KB)`);
  console.log(`📁 Total chunks: ${fileSizes.length}`);

  // Check for problematic files
  const problematicFiles = fileSizes.filter((file) => file.sizeKB >= THRESHOLDS.warning);

  if (problematicFiles.length > 0) {
    console.log(`\n⚠️  ${problematicFiles.length} chunk(s) exceed size threshold`);
    console.log('\nRecommendations:');
    console.log('- Consider code splitting for large components');
    console.log('- Use dynamic imports for routes and heavy libraries');
    console.log('- Remove unused dependencies');
    console.log('- Enable tree shaking for third-party libraries');
  } else {
    console.log('\n✅ All chunks are within acceptable size limits');
  }

  // Exit with error code if there are problematic files
  if (problematicFiles.filter((f) => f.sizeKB >= THRESHOLDS.error).length > 0) {
    process.exit(1);
  }
}

// Run analysis
try {
  analyzeBundle();
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}
