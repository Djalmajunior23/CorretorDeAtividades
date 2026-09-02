const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace import "jspdf-autotable"; with import autoTable from "jspdf-autotable";
  content = content.replace(/import\s+"jspdf-autotable"\s*;/g, 'import autoTable from "jspdf-autotable";');

  // Replace (doc as any).autoTable({ with autoTable(doc, {
  content = content.replace(/\(doc\s+as\s+any\)\.autoTable\(/g, 'autoTable(doc, ');
  
  // Replace doc.autoTable({ with autoTable(doc, {
  content = content.replace(/doc\.autoTable\(/g, 'autoTable(doc, ');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

// glob logic
const getFiles = function (dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = getFiles('./src');
files.forEach(fixFile);
