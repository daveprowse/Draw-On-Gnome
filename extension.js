/*
 * Copyright 2019 Abakkk
 * Copyright 2023 zhrexl
 * Copyright 2024-2026 Dave Prowse
 
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
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { Files } from './files.js';
import * as AreaManager from './areamanager.js';

/* ── Quick Settings toggle tile ────────────────────────────── */
const DrawingToggle = GObject.registerClass(
class DrawingToggle extends QuickToggle {
    _init() {
        super._init({
            title: 'Drawing Mode',
            iconName: 'applications-graphics-symbolic',
            toggleMode: true,
        });
    }
});

/* ── Panel indicator + toggle container ─────────────────────── */
const DrawingIndicator = GObject.registerClass(
class DrawingIndicator extends SystemIndicator {
    _init(settings) {
        super._init();
        this._settings = settings;

        // Panel icon — passive status indicator (always visible while loaded)
        this._panelIcon = this._addIndicator();
        this._panelIcon.icon_name = 'applications-graphics-symbolic';
        this._panelIcon.visible = true;

        // Quick Settings tile
        this._toggle = new DrawingToggle();
        this.quickSettingsItems.push(this._toggle);
    }

    get toggle() { return this._toggle; }

    /** Call from the extension to keep the toggle in sync with drawing state. */
    sync(active) {
        this._toggle.set_checked(active);
    }

    destroy() {
        this.quickSettingsItems.forEach(item => item.destroy());
        super.destroy();
    }
});

/* ── Extension ───────────────────────────────────────────────── */
export default class DrawOnGnomeExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._indicator = null;
        this._settingsChangedId = null;
    }

    enable() {
        this.settings = this.getSettings();
        this.internalShortcutSettings = this.getSettings(
            this.metadata['settings-schema'] + '.internal-shortcuts');
        this.drawingSettings = this.getSettings(
            this.metadata['settings-schema'] + '.drawing');

        this.FILES = new Files(this);
        this.areaManager = new AreaManager.AreaManager(this);
        this.areaManager.enable();

        this._setupIndicator();
        this._settingsChangedId = this.settings.connect(
            'changed::quicktoggle-disabled',
            this._setupIndicator.bind(this));
    }

    disable() {
        if (this._settingsChangedId) {
            this.settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        this._destroyIndicator();
        this.areaManager.disable();
        this.areaManager = null;
        this.settings = null;
        this.internalShortcutSettings = null;
        this.drawingSettings = null;
        this.FILES = null;
    }

    _setupIndicator() {
        const disabled = this.settings.get_boolean('quicktoggle-disabled');
        if (disabled) {
            this._destroyIndicator();
            return;
        }
        if (!this._indicator) {
            this._indicator = new DrawingIndicator(this.settings);
            this._indicator.toggle.connect('clicked', this._onToggleClicked.bind(this));
            // This is the call that was missing — registers both the panel icon
            // and the Quick Settings tile in one step.
            Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        }
    }

    _destroyIndicator() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }

    /** Called by AreaManager whenever drawing state changes. */
    syncIndicator(active) {
        if (this._indicator)
            this._indicator.sync(active);
    }

    _onToggleClicked() {
        // Close the panel before toggling — instance method, not a module export
        Main.panel.closeQuickSettings();
        this.areaManager.toggleDrawing();
    }
}