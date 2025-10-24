/*
 * Copyright 2022 zhrexl
 * Originally Forked from Abakkk
 * Copyright 2024 Dave Prowse
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-FileCopyrightText: 2022 zhrexl
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileContributor: Modified by Dave Prowse 
 */

/* eslint version: 9.16 (2024) */

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import PreferencesPage from './ui/preferencespage.js';
import DrawingPage from './ui/drawingpage.js';
import AboutPage from './ui/about.js';

export default class DrawOnGnomeExtensionPreferences extends ExtensionPreferences {

    constructor(metadata) {
        super(metadata);
        // Initialize settings cache
        this._settings = null;
        this._internalShortcutSettings = null;
        this._drawingSettings = null;
    }
    
    // Get or create the main settings instance
    get settings() {
        if (!this._settings) {
            this._settings = this.getSettings();
        }
        return this._settings;
    }
    
    // Get or create the internal shortcuts settings instance
    get internalShortcutSettings() {
        if (!this._internalShortcutSettings) {
            this._internalShortcutSettings = this.getSettings(this.metadata['settings-schema'] + '.internal-shortcuts');
        }
        return this._internalShortcutSettings;
    }
    
    // Get or create the drawing settings instance
    get drawingSettings() {
        if (!this._drawingSettings) {
            this._drawingSettings = this.getSettings(this.metadata['settings-schema'] + '.drawing');
        }
        return this._drawingSettings;
    }
    
    fillPreferencesWindow(window) {
        window._settings = this.settings;  // Use the cached property
        window.search_enabled = true;

        let page1 = new PreferencesPage(this);
        let page2 = new DrawingPage(this, window);
        let page3 = new AboutPage(this);

        window.add(page1);
        window.add(page2);
        window.add(page3);
    }
}