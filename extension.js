/*
 * Copyright 2019 Abakkk
 * Copyright 2023 zhrexl
 * Copyright 2024 Dave Prowse
 
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
 * SPDX-FileCopyrightText: 2019 Abakkk
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileContributor: Modified by Dave Prowse
 */

/* eslint version: 9.16 (2024) */

import GObject from 'gi://GObject';

import { QuickToggle, SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';

import * as Panel from 'resource:///org/gnome/shell/ui/panel.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Files } from './files.js';

import * as AreaManager from './areamanager.js';

import { SHELL_MAJOR_VERSION } from './utils.js';


const FeatureToggle = GObject.registerClass(
class FeatureToggle extends QuickToggle {
    _init() {
        super._init({
            title: 'Drawing Mode',
            iconName: 'applications-graphics-symbolic',
            toggleMode: true,
        });
    }
});


const Indicator = GObject.registerClass(
class Indicator extends SystemIndicator {
    _init(extension) {
        super._init();
        
        this._extension = extension;

        this.toggle = new FeatureToggle();
        this.quickSettingsItems.push(this.toggle);
        this._addIndicator();
        
        this.connect('destroy', () => {
            this.quickSettingsItems.forEach(item => item.destroy());
        });
    }
    
    get_toggle() {
        return this.toggle;
    }
    
    // Connect the toggle to the extension's drawing functionality
    connectToExtension(toggleDrawingCallback) {
        this.toggle.connect('clicked', toggleDrawingCallback);
    }
});


export default class DrawOnGnomeExtension extends Extension {

    constructor(metadata) {
        super(metadata);
        this.indicator = null;
    }

    enable() {
        // Get settings instances ONCE - this is the entry point
        this.settings = this.getSettings();
        this.internalShortcutSettings = this.getSettings(this.metadata['settings-schema'] + '.internal-shortcuts');
        this.drawingSettings = this.getSettings(this.metadata['settings-schema'] + '.drawing');
        
        this.areaManager = new AreaManager.AreaManager(this);
        this.areaManager.enable();
        
        // Create indicator if GNOME version supports it and setting allows it
        this._updateIndicator();
        
        // Watch for settings changes
        this._settingsChangedId = this.settings.connect('changed::quicktoggle-disabled', 
            this._updateIndicator.bind(this));

        this.FILES = new Files(this);
    }

    disable() {
        // Disconnect settings signal
        if (this._settingsChangedId) {
            this.settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        
        // Destroy indicator if it exists
        if (this.indicator) {
            this.indicator.destroy();
            this.indicator = null;
        }
        
        this.areaManager.disable();
        delete this.areaManager;
        delete this.settings;
        delete this.internalShortcutSettings;
        this.FILES = null;
        this.drawingSettings = null;
        this.areaManager = null;
        this.internalShortcutSettings = null;
    }

    _updateIndicator() {
        // Only create indicator on GNOME 44+
        if (SHELL_MAJOR_VERSION < 44) {
            return;
        }
        
        const quicktoggleDisabled = this.settings.get_boolean('quicktoggle-disabled');
        
        if (quicktoggleDisabled && this.indicator) {
            // Setting says disabled, but we have an indicator - destroy it
            this.indicator.destroy();
            this.indicator = null;
        } else if (!quicktoggleDisabled && !this.indicator) {
            // Setting says enabled, but we don't have an indicator - create it
            this.indicator = new Indicator(this);
            this.indicator.connectToExtension(this._toggleDrawing.bind(this));
        }
    }

    _toggleDrawing() {
        Panel.closeQuickSettings();
        if (this.indicator) {
            this.indicator.get_toggle().set_checked(false);
        }
        this.areaManager.toggleDrawing();
    }
}