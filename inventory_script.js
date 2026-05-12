import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

function parseMarkdown(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

    if (!yamlMatch) {
        return { data: {}, body: content };
    }

    const yamlBlock = yamlMatch[1];
    const body = content.slice(yamlMatch[0].length);

    try {
        const parsed = yaml.load(yamlBlock);
        const data = parsed && typeof parsed === 'object' ? parsed : {};
        return { data, body };
    } catch (error) {
        throw new Error(`Failed to parse frontmatter in ${filePath}: ${error.message}`);
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveContentDir(...segments) {
    const dirPath = path.join(__dirname, ...segments);
    if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory does not exist: ${dirPath}`);
    }
    return dirPath;
}

const companiesDir = resolveContentDir('src', 'content', 'companies');
const projectsDir = resolveContentDir('src', 'content', 'projects');

const companies = fs.readdirSync(companiesDir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
        const { data } = parseMarkdown(path.join(companiesDir, file));
        return {
            filename: file,
            profile: data.profile || ''
        };
    });

const projects = fs.readdirSync(projectsDir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
        const { data, body } = parseMarkdown(path.join(projectsDir, file));
        const bodyLower = body.toLowerCase();
        const problem = bodyLower.includes('## problem') || bodyLower.includes('### problem');
        const approach = bodyLower.includes('## approach') || bodyLower.includes('### approach');
        const outcome = bodyLower.includes('## outcome') || bodyLower.includes('### outcome');

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
try {
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
} catch (error) {
    console.error(`Inventory generation failed: ${error.message}`);
    process.exitCode = 1;
}
