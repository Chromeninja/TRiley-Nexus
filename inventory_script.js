const fs = require('fs');
const path = require('path');

function parseMarkdown(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const yaml = yamlMatch ? yamlMatch[1] : '';
    const body = content.replace(yamlMatch ? yamlMatch[0] : '', '');

    const data = {};
    yaml.split('\n').forEach(line => {
        const [key, ...value] = line.split(':');
        if (key && value) {
            data[key.trim()] = value.join(':').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        }
    });

    return { data, body };
}

const companiesDir = 'src/content/companies';
const projectsDir = 'src/content/projects';

const companies = fs.readdirSync(companiesDir).filter(f => f.endsWith('.md')).map(file => {
    const { data } = parseMarkdown(path.join(companiesDir, file));
    return {
        filename: file,
        profile: data.profile || ''
    };
});

const projects = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md')).map(file => {
    const { data, body } = parseMarkdown(path.join(projectsDir, file));
    const problem = body.toLowerCase().includes('## problem') || body.toLowerCase().includes('### problem');
    const approach = body.toLowerCase().includes('## approach') || body.toLowerCase().includes('### approach');
    const outcome = body.toLowerCase().includes('## outcome') || body.toLowerCase().includes('### outcome');
    
    return {
        filename: file,
        org: data.organization || 'Unknown',
        title: data.title || '',
        roleTitle: data.roleTitle || '',
        category: data.category || '',
        timeframe: data.timeframe || '',
        p: problem ? 'Y' : 'N',
        a: approach ? 'Y' : 'N',
        o: outcome ? 'Y' : 'N'
    };
});

console.log('COMPANIES:');
console.log('Filename | Profile Key');
console.log('---|---');
companies.forEach(c => console.log(`${c.filename} | ${c.profile}`));

console.log('\nPROJECTS BY ORGANIZATION:');
const grouped = projects.reduce((acc, p) => {
    acc[p.org] = acc[p.org] || [];
    acc[p.org].push(p);
    return acc;
}, {});

Object.keys(grouped).sort().forEach(org => {
    console.log(`\n### ${org}`);
    console.log('Filename | Title | Role | Category | Timeframe | P/A/O');
    console.log('---|---|---|---|---|---');
    grouped[org].forEach(p => {
        console.log(`${p.filename} | ${p.title} | ${p.roleTitle} | ${p.category} | ${p.timeframe} | ${p.p}/${p.a}/${p.o}`);
    });
});
