const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) { return null; }
  try { return yaml.load(match[1]); }
  catch(e) { return { _parseError: e.message }; }
}

function walk(dir) {
  return fs.readdirSync(dir).flatMap(function(f) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) { return walk(full); }
    return [full];
  });
}

const issues = [];
const validStatuses = ['active','completed','archived','concept'];

// --- projects ---
const projectFiles = walk('src/content/projects').filter(function(f) { return f.endsWith('.md'); });
for (const f of projectFiles) {
  const d = parseFile(f);
  const name = f.replace('src/content/','');
  if (!d) { issues.push(name + ': no frontmatter'); continue; }
  if (d._parseError) { issues.push(name + ': YAML parse error: ' + d._parseError); continue; }
  if (typeof d.featured !== 'boolean') { issues.push(name + ': featured expected boolean, got ' + typeof d.featured + ' value=' + JSON.stringify(d.featured)); }
  if (!d.title) { issues.push(name + ': missing required title'); }
  if (!d.status) { issues.push(name + ': missing required status'); }
  else if (!validStatuses.includes(d.status)) { issues.push(name + ': invalid status=' + d.status); }
  if (!d.category) { issues.push(name + ': missing required category'); }
  if (!Array.isArray(d.tags)) { issues.push(name + ': tags expected array, got ' + typeof d.tags); }
  if (!d.summary) { issues.push(name + ': missing required summary'); }
  if (d.order !== undefined && typeof d.order !== 'number') { issues.push(name + ': order expected number, got ' + typeof d.order + ' value=' + JSON.stringify(d.order)); }
  if (d.organizationUrl) {
    try { new URL(d.organizationUrl); }
    catch(e) { issues.push(name + ': organizationUrl invalid: ' + d.organizationUrl); }
  }
  if (d.highlights && (!Array.isArray(d.highlights) || d.highlights.length > 3)) { issues.push(name + ': highlights must be array max 3'); }
  if (d.links && Array.isArray(d.links)) {
    d.links.forEach(function(l, i) {
      try { new URL(l.url); }
      catch(e) { issues.push(name + ': links[' + i + '].url invalid: ' + l.url); }
    });
  }
  if (d.media) {
    if (!Array.isArray(d.media)) {
      issues.push(name + ': media expected array');
    } else {
      d.media.forEach(function(m, i) {
        if (!['image','video'].includes(m.type)) { issues.push(name + ': media[' + i + '].type invalid: ' + m.type); }
        if (m.type === 'image' && !m.alt) { issues.push(name + ': media[' + i + '] image missing alt'); }
      });
    }
  }
}

// --- about ---
const aboutFiles = walk('src/content/about').filter(function(f) { return f.endsWith('.md'); });
for (const f of aboutFiles) {
  const d = parseFile(f);
  const name = f.replace('src/content/','');
  if (!d) { issues.push(name + ': no frontmatter'); continue; }
  if (d._parseError) { issues.push(name + ': YAML parse error: ' + d._parseError); continue; }
  if (!d.metaDescription) { issues.push(name + ': missing required metaDescription'); }
  if (!Array.isArray(d.backgroundParagraphs)) { issues.push(name + ': backgroundParagraphs expected array'); }
  if (!Array.isArray(d.thinkItems)) { issues.push(name + ': thinkItems expected array'); }
  if (!Array.isArray(d.personalItems)) { issues.push(name + ': personalItems expected array'); }
  if (!Array.isArray(d.values)) { issues.push(name + ': values expected array'); }
}

// --- companies ---
const companyFiles = walk('src/content/companies').filter(function(f) { return f.endsWith('.md'); });
for (const f of companyFiles) {
  const d = parseFile(f);
  const name = f.replace('src/content/','');
  if (!d) { issues.push(name + ': no frontmatter'); continue; }
  if (d._parseError) { issues.push(name + ': YAML parse error: ' + d._parseError); continue; }
  if (typeof d.profiles !== 'object' || d.profiles === null || Array.isArray(d.profiles)) {
    issues.push(name + ': profiles expected record object, got ' + typeof d.profiles + ' value=' + JSON.stringify(d.profiles));
  } else {
    Object.entries(d.profiles).forEach(function(entry) {
      const key = entry[0];
      const val = entry[1];
      if (!val.summary) { issues.push(name + ': profiles.' + key + ' missing required summary'); }
      if (!val.companyInfo) { issues.push(name + ': profiles.' + key + ' missing required companyInfo'); }
      if (!val.myTimeInfo) { issues.push(name + ': profiles.' + key + ' missing required myTimeInfo'); }
    });
  }
}

if (issues.length === 0) {
  console.log('All content files pass schema validation.');
} else {
  issues.forEach(function(msg) { console.log('ISSUE: ' + msg); });
  console.log('\n' + issues.length + ' issue(s) found.');
}
