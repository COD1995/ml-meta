#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files to update
const filesToUpdate = [
  'books/algorithms/chapters/00-prologue.html',
  'papers/training-research/lora_fine_tuning.html',
  'books/pattern-classification/chapters/01-introduction.html',
  'books/algorithms/chapters/06-dynamic-programming.html',
  'books/algorithms/chapters/05-greedy-algorithms.html',
  'books/algorithms/chapters/01-algorithms-with-numbers.html',
  'math-foundations/in-simple-terms/cross_entropy_gradient.html'
];

function convertFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Pattern 1: Full explanation blocks with both original text and explanation
  const fullPattern = /<div class="explanation-block">\s*<div class="original-text-container">\s*<p class="original-text">\s*(?:<em>)?\s*([\s\S]*?)\s*(?:<\/em>)?\s*<\/p>\s*<\/div>\s*(?:<div class="explanation-text">\s*([\s\S]*?)\s*<\/div>)?\s*<\/div>/g;
  
  content = content.replace(fullPattern, (match, originalText, explanationText) => {
    // Clean up the original text
    originalText = originalText
      .replace(/<\/?em>/g, '') // Remove any nested em tags
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    if (explanationText && explanationText.trim()) {
      // If there's explanation text, include it after the blockquote
      return `<blockquote>\n          ${originalText}\n        </blockquote>\n        \n        ${explanationText.trim()}`;
    } else {
      // Just the blockquote
      return `<blockquote>\n          ${originalText}\n        </blockquote>`;
    }
  });
  
  // Pattern 2: Handle nested or complex explanation blocks
  // Sometimes the explanation-text div contains more complex HTML
  const complexPattern = /<div class="explanation-block">\s*<div class="original-text-container">\s*<p class="original-text">\s*<em>([\s\S]*?)<\/em>\s*<\/p>\s*<\/div>\s*<div class="explanation-text">([\s\S]*?)<\/div>\s*<\/div>/g;
  
  content = content.replace(complexPattern, (match, originalText, explanationContent) => {
    originalText = originalText.trim().replace(/\s+/g, ' ');
    return `<blockquote>\n          ${originalText}\n        </blockquote>\n        ${explanationContent.trim()}`;
  });
  
  // Pattern 3: Handle explanation blocks that might have different formatting
  const alternativePattern = /<div class="explanation-block">\s*<div class="original-text-container">\s*<p class="original-text">([\s\S]*?)<\/p>\s*<\/div>\s*(?:<div class="explanation-text">([\s\S]*?)<\/div>)?\s*<\/div>/g;
  
  content = content.replace(alternativePattern, (match, originalText, explanationText) => {
    // Remove em tags if present
    originalText = originalText
      .replace(/<\/?em>/g, '')
      .trim()
      .replace(/\s+/g, ' ');
    
    if (explanationText && explanationText.trim()) {
      return `<blockquote>\n          ${originalText}\n        </blockquote>\n        \n        ${explanationText.trim()}`;
    } else {
      return `<blockquote>\n          ${originalText}\n        </blockquote>`;
    }
  });
  
  // Check if any changes were made
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

// Main execution
console.log('🔄 Starting conversion of explanation blocks to blockquotes...\n');

let successCount = 0;
let totalCount = filesToUpdate.length;

filesToUpdate.forEach(file => {
  if (convertFile(file)) {
    successCount++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Conversion complete: ${successCount}/${totalCount} files updated`);
console.log('='.repeat(50));

if (successCount > 0) {
  console.log('\n✨ All explanation blocks have been converted to simpler blockquote format!');
  console.log('📝 The new format is much cleaner and easier to maintain.');
}