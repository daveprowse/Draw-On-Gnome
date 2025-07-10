#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_UUID = 'draw-on-gnome@daveprowse.github.io';
const EXTENSIONS_DIR = path.join(process.env.HOME, '.local/share/gnome-shell/extensions');
const TARGET_DIR = path.join(EXTENSIONS_DIR, EXTENSION_UUID);
const SRC_DIR = path.resolve('src');

function setupDevelopment() {
    console.log('🔧 Setting up development environment...');

    // Ensure schemas are compiled
    try {
        execSync('npm run compile-schemas', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Failed to compile schemas');
        process.exit(1);
    }

    // Remove existing installation
    if (fs.existsSync(TARGET_DIR)) {
        console.log('🗑️  Removing existing installation...');
        fs.rmSync(TARGET_DIR, { recursive: true });
    }

    // Create extensions directory if it doesn't exist
    fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });

    // Create symlink for development
    try {
        fs.symlinkSync(SRC_DIR, TARGET_DIR);
        console.log('✅ Development symlink created');
        console.log(`🔗 ${TARGET_DIR} -> ${SRC_DIR}`);
    } catch (error) {
        console.error('❌ Failed to create symlink:', error.message);
        process.exit(1);
    }

    console.log('\n📋 Next steps:');
    console.log('1. Restart GNOME Shell (Alt+F2, type "r", press Enter)');
    console.log('2. Enable the extension:');
    console.log(`   gnome-extensions enable ${EXTENSION_UUID}`);
    console.log('3. Start development with: npm run watch');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    setupDevelopment();
}

export { setupDevelopment };
