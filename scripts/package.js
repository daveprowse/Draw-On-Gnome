#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_UUID = 'draw-on-gnome@daveprowse.github.io';
const BUILD_DIR = './build';
const SRC_DIR = 'src';

// Files to exclude from package
const EXCLUDE_PATTERNS = [
    'node_modules/**',
    'build/**',
    '**/*.ts',
    '**/*.map',
    '.git/**',
    'scripts/**',
    '**/*.test.js',
    '**/*.spec.js',
    'metadata.json'
    // '**/.*', // hidden files
];

function createPackage() {
    console.log('📦 Creating extension package...');

    // Clean and create build directory
    if (fs.existsSync(BUILD_DIR)) {
        fs.rmSync(BUILD_DIR, { recursive: true });
    }
    fs.mkdirSync(`${BUILD_DIR}/${EXTENSION_UUID}`, { recursive: true });

    // Copy files with filtering
    copyFiles(SRC_DIR, `${BUILD_DIR}/${EXTENSION_UUID}`);

    // Copy root files
    const rootFiles = ['metadata.json', 'COPYING'];
    rootFiles.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, `${BUILD_DIR}/${EXTENSION_UUID}/${file}`);
            console.log(`✅ Copied ${file}`);
        }
    });

    // Copy locale files if they exist
    if (fs.existsSync('locale')) {
        copyFiles('locale', `${BUILD_DIR}/${EXTENSION_UUID}/locale`);
    }

    // Copy data files if they exist
    if (fs.existsSync('./data')) {
        copyFiles('./data', `${BUILD_DIR}/${EXTENSION_UUID}/data`);
    }

    // Validate required files
    validatePackage(`${BUILD_DIR}/${EXTENSION_UUID}`);

    // Create zip
    const originalDir = process.cwd();
    process.chdir(BUILD_DIR);

    try {
        execSync(`zip -r ${EXTENSION_UUID}.zip ${EXTENSION_UUID}/`, { stdio: 'inherit' });
        console.log(`✅ Extension package created: ${BUILD_DIR}/${EXTENSION_UUID}.zip`);

        // Show package size
        const stats = fs.statSync(`${EXTENSION_UUID}.zip`);
        console.log(`📊 Package size: ${(stats.size / 1024).toFixed(2)} KB`);
    } finally {
        process.chdir(originalDir);
    }
}

function copyFiles(src, dest) {
    if (!fs.existsSync(src)) return;

    const items = fs.readdirSync(src);

    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (shouldExclude(srcPath)) {
            return;
        }

        if (fs.statSync(srcPath).isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyFiles(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copied ${srcPath}`);
        }
    });
}

function shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(filePath);
    });
}

function validatePackage(packageDir) {
    const requiredFiles = [
        'extension.js',
        'metadata.json',
        'schemas/gschemas.compiled'
    ];

    console.log('🔍 Validating package...');

    requiredFiles.forEach(file => {
        const filePath = path.join(packageDir, file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Missing required file: ${filePath}`);
            process.exit(1);
        }
    });

    console.log('✅ Package validation passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    createPackage();
}

export { createPackage };
