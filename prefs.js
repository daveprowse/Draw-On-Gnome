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
    }
    
    // !!! These are the changes for E.G.O. as per their issue #3 (11/3/2025 review). 
    // They negate the changes made for issue #2 by using "window" instead of "this". 
    // REMOVE these getter methods (lines 45, 53, 61 in your file):
    // get settings() { ... }
    // get internalShortcutSettings() { ... }
    // get drawingSettings() { ... }
    // 
    // Don't store settings as properties on THIS class (the exported one)
    
    fillPreferencesWindow(window) {
        // Store settings on the WINDOW object instead of on this class
        // This satisfies both fix #2 (use _settings.get_child) and fix #3 (don't store on exported class)
        window._settings = this.getSettings();
        window._internalShortcutSettings = window._settings.get_child('internal-shortcuts');
        window._drawingSettings = window._settings.get_child('drawing');
        
        window.search_enabled = true;

        let page1 = new PreferencesPage(this, window);
        let page2 = new DrawingPage(this, window);
        let page3 = new AboutPage(this);

        window.add(page1);
        window.add(page2);
        window.add(page3);
        
        // Clean up when window closes to allow garbage collection
        window.connect('close-request', () => {
            delete window._settings;
            delete window._internalShortcutSettings;
            delete window._drawingSettings;
        });
    }
}