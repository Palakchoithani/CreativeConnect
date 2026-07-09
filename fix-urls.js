const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./apps/web/src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:4000')) {
    // Replace 'http://localhost:4000/api...' with `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api...`
    // We need to be careful about quotes.
    
    // Replace single quotes: 'http://localhost:4000/api/...' -> `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/...`
    content = content.replace(/'http:\/\/localhost:4000([^']*)'/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}$1`");
    
    // Replace double quotes: "http://localhost:4000/api/..." -> `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/...`
    content = content.replace(/"http:\/\/localhost:4000([^"]*)"/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}$1`");
    
    // Replace inside backticks if it's already a template literal: `http://localhost:4000/api/${id}` -> `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/${id}`
    content = content.replace(/`http:\/\/localhost:4000([^`]*)`/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}$1`");
    
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Fixed:', file);
  }
});

console.log(`Successfully updated ${changedFiles} files!`);
