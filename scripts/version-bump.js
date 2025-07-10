#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';

function bumpVersion(type = 'patch') {
    console.log(`🔄 Bumping ${type} version...`);
    
    // Read current versions
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
    
    const currentVersion = packageJson.version;
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    let newVersion;
    switch (type) {
        case 'major':
            newVersion = `${major + 1}.0.0`;
            break;
        case 'minor':
            newVersion = `${major}.${minor + 1}.0`;
            break;
        case 'patch':
        default:
            newVersion = `${major}.${minor}.${patch + 1}`;
            break;
    }
    
    // Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    
    // Update metadata.json
    metadata['version-name'] = newVersion;
    metadata.version = parseInt(newVersion.replace(/\./g, ''));
    fs.writeFileSync('metadata.json', JSON.stringify(metadata, null, 4) + '\n');
    
    console.log(`✅ Version bumped: ${currentVersion} -> ${newVersion}`);
    
    // Create git tag
    try {
        execSync(`git add package.json metadata.json`);
        execSync(`git commit -m "chore: bump version to ${newVersion}"`);
        execSync(`git tag v${newVersion}`);
        console.log(`🏷️  Created git tag: v${newVersion}`);
    } catch (error) {
        console.warn('⚠️  Could not create git commit/tag:', error.message);
    }
}

const type = process.argv[2] || 'patch';
if (!['major', 'minor', 'patch'].includes(type)) {
    console.error('❌ Invalid version type. Use: major, minor, or patch');
    process.exit(1);
}

bumpVersion(type);
