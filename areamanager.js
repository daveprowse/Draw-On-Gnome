/*
 * Copyright 2019 Abakkk 
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

/* jslint esversion: 6 (2019) */
/* eslint version: 9.16 (2024) */
/* exported init */

import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as OsdWindow from 'resource:///org/gnome/shell/ui/osdWindow.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Area from './area.js';
import * as Helper from './helper.js';

import { SHELL_MAJOR_VERSION } from './utils.js';

// AreaManager assigns one DrawingArea per monitor (updateAreas()),
// distributes keybinding callbacks to the active area
// and handles stylesheet and monitor changes.
export class AreaManager {

    constructor(extension) {
    this._extension = extension;
    
    // Store references to settings instances from extension
    this._settings = extension.settings;
    this._internalShortcutSettings = extension.internalShortcutSettings;
    this._drawingSettings = extension.drawingSettings;
    
    this._SHELL_MAJOR_VERSION = SHELL_MAJOR_VERSION;
    this._HIDE_TIMEOUT_LONG = 2500;
    
    this._DRAWING_ACTION_MODE = Math.pow(2,14);
    this._WRITING_ACTION_MODE = Math.pow(2,15);
    this._WARNING_COLOR_STYLE_CLASS_NAME = 'login-dialog-message-warning';
}

    enable() {
        this.areas = [];
        this.activeArea = null;
        this.grab = null;
        
        Main.wm.addKeybinding('toggle-drawing',
                              this._settings,
                              Meta.KeyBindingFlags.NONE,
                              Shell.ActionMode.ALL,
                              this.toggleDrawing.bind(this));
        
        Main.wm.addKeybinding('toggle-modal',
                              this._settings,
                              Meta.KeyBindingFlags.NONE,
                              Shell.ActionMode.ALL,
                              this.toggleModal.bind(this));
        
        Main.wm.addKeybinding('erase-drawings',
                              this._settings,
                              Meta.KeyBindingFlags.NONE,
                              Shell.ActionMode.ALL,
                              this.eraseDrawings.bind(this));
        
        this.updateAreas();
        this.monitorChangedHandler = Main.layoutManager.connect('monitors-changed', this.updateAreas.bind(this));
        
        this.updateIndicator();
        this.indicatorSettingHandler = this._settings.connect('changed::indicator-disabled', this.updateIndicator.bind(this));
        
        this.desktopSettingHandler = this._settings.connect('changed::drawing-on-desktop', this.onDesktopSettingChanged.bind(this));
        this.persistentOverRestartsSettingHandler = this._settings.connect('changed::persistent-over-restarts', this.onPersistentOverRestartsSettingChanged.bind(this));
        this.persistentOverTogglesSettingHandler = this._settings.connect('changed::persistent-over-toggles', this.onPersistentOverTogglesSettingChanged.bind(this));
    }
    
    get persistentOverToggles() {
        return this._settings.get_boolean('persistent-over-toggles');
    }
    
    get persistentOverRestarts() {
        return this._settings.get_boolean('persistent-over-toggles') && this._settings.get_boolean('persistent-over-restarts');
    }
    
    get onDesktop() {
        return this._settings.get_boolean('persistent-over-toggles') && this._settings.get_boolean('drawing-on-desktop');
    }
    
    get toolPalette() {
        return this._extension.getSettings(this._extension.metadata['settings-schema'] + '.drawing').get_value('tool-palette').deep_unpack()
    }
    
    get toolColor() {
        return this._extension.getSettings(this._extension.metadata['settings-schema'] + '.drawing').get_string("tool-color")
    }
    
    get toolSize() {
        return this._extension.getSettings(this._extension.metadata['settings-schema'] + '.drawing').get_int('tool-size');
    }
    
    onDesktopSettingChanged() {
        if (this.onDesktop)
            this.areas.forEach(area => area.show());
        else
            this.areas.forEach(area => area.hide());
    }
    
    onPersistentOverRestartsSettingChanged() {
        if (this.persistentOverRestarts)
            this.areas[Main.layoutManager.primaryIndex].syncPersistent();
    }
    
    onPersistentOverTogglesSettingChanged() {
        if (!this.persistentOverToggles && !this.activeArea)
            this.eraseDrawings();
            
        this.onPersistentOverRestartsSettingChanged();
        this.onDesktopSettingChanged();
    }
    
    updateIndicator() {
        if (this.indicator) {
            this.indicator.disable();
            this.indicator = null;
        }
        if (!this._settings.get_boolean('indicator-disabled')) {
            this.indicator = new DrawingIndicator();
            this.indicator.enable();
        }
    }
    
    updateAreas() {
        if (this.activeArea)
            this.toggleDrawing();
        this.removeAreas();
        
        this.monitors = Main.layoutManager.monitors;
        
        let toolConf = {
            "toolPalette" : this.toolPalette,
            "toolColor" : this.toolColor,
            "toolSize" : this.toolSize
        };
        
        for (let i = 0; i < this.monitors.length; i++) {
            let monitor = this.monitors[i];
            let helper = new Helper.DrawingHelper(this._extension, { name: 'drawOnGnomeHelper' + i }, monitor);
            let loadPersistent = i == Main.layoutManager.primaryIndex && this.persistentOverRestarts;
            // Some utils for the drawing area menus.
            let areaManagerUtils = {
                getHiddenList: () => this.hiddenList || null,
                togglePanelAndDockOpacity: this.togglePanelAndDockOpacity.bind(this),
                openPreferences: this.openPreferences.bind(this)
            };
            let area = new Area.DrawingArea(this._extension, { name: 'drawOnGnomeArea' + i }, monitor, helper, areaManagerUtils, loadPersistent, toolConf);
            
            Main.layoutManager._backgroundGroup.insert_child_above(area, Main.layoutManager._bgManagers[i].backgroundActor);
            if (!this.onDesktop)
                area.hide();
            
            area.set_position(monitor.x, monitor.y);
            area.set_size(monitor.width, monitor.height);
            area.leaveDrawingHandler = area.connect('leave-drawing-mode', this.toggleDrawing.bind(this));
            area.pointerCursorChangedHandler = area.connect('pointer-cursor-changed', this.setCursor.bind(this));
            area.showOsdHandler = area.connect('show-osd', this.showOsd.bind(this));
            this.areas.push(area);
        }
    }
    
    addInternalKeybindings() {
        // unavailable when writing
        this.internalKeybindings1 = {
            'undo': this.activeArea.undo.bind(this.activeArea),
            'redo': this.activeArea.redo.bind(this.activeArea),
            'delete-last-element': this.activeArea.deleteLastElement.bind(this.activeArea),
            'smooth-last-element': this.activeArea.smoothLastElement.bind(this.activeArea),
            'increment-line-width': () => this.activeArea.incrementLineWidth(1),
            'decrement-line-width': () => this.activeArea.incrementLineWidth(-1),
            'increment-line-width-more': () => this.activeArea.incrementLineWidth(5),
            'decrement-line-width-more': () => this.activeArea.incrementLineWidth(-5),
            'paste-image-files': this.activeArea.pasteImageFiles.bind(this.activeArea),
            'switch-linejoin': this.activeArea.switchLineJoin.bind(this.activeArea),
            'switch-linecap': this.activeArea.switchLineCap.bind(this.activeArea),
            // Removed 'switch-fill-rule' - moved to internalKeybindings2 - intermittent issue of fill rule shortcut
            'switch-dash' : this.activeArea.switchDash.bind(this.activeArea),
            'switch-fill' : this.activeArea.switchFill.bind(this.activeArea),
            'switch-image-file' : this.activeArea.switchImageFile.bind(this.activeArea, false),
            'switch-image-file-reverse' : this.activeArea.switchImageFile.bind(this.activeArea, true),
            'select-none-shape': () => this.activeArea.selectTool(Area.Tool.NONE),
            'select-line-shape': () => this.activeArea.selectTool(Area.Tool.LINE),
            'select-arrow-shape': () => this.activeArea.selectTool(Area.Tool.ARROW),
            'select-laser-shape': () => {
                if (this.activeArea.currentTool === Area.Tool.LASER) {
                    this.activeArea.stopLaserPointer();
                    this.activeArea.selectTool(Area.Tool.NONE); // Always go to pencil
                } else {
                    this.activeArea.selectTool(Area.Tool.LASER);
                }
            },
            'select-highlighter-shape': () => this.activeArea.selectTool(Area.Tool.HIGHLIGHTER),
            'select-ellipse-shape': () => this.activeArea.selectTool(Area.Tool.ELLIPSE),
            'select-rectangle-shape': () => this.activeArea.selectTool(Area.Tool.RECTANGLE),
            'select-text-shape': () => this.activeArea.selectTool(Area.Tool.TEXT),
            'select-image-shape': () => this.activeArea.selectTool(Area.Tool.IMAGE),
            'select-polygon-shape': () => this.activeArea.selectTool(Area.Tool.POLYGON),
            'select-polyline-shape': () => this.activeArea.selectTool(Area.Tool.POLYLINE),
            'select-move-tool': () => this.activeArea.selectTool(Area.Tool.MOVE),
            'select-resize-tool': () => this.activeArea.selectTool(Area.Tool.RESIZE),
            'select-mirror-tool': () => this.activeArea.selectTool(Area.Tool.MIRROR)
        };
        
        // available when writing
        this.internalKeybindings2 = {            
            'export-to-svg': this.activeArea.exportToSvg.bind(this.activeArea),
            'save-as-json': this.activeArea.saveAsJson.bind(this.activeArea, true, null),
            'open-previous-json': this.activeArea.loadPreviousJson.bind(this.activeArea),
            'open-next-json': this.activeArea.loadNextJson.bind(this.activeArea),
            'pick-color': this.activeArea.pickColor.bind(this.activeArea),
            'toggle-background': this.activeArea.toggleBackground.bind(this.activeArea),
            'toggle-grid': this.activeArea.toggleGrid.bind(this.activeArea),
            'toggle-square-area': this.activeArea.toggleSquareArea.bind(this.activeArea),
            'switch-color-palette': this.activeArea.switchColorPalette.bind(this.activeArea, false),
            'switch-color-palette-reverse': this.activeArea.switchColorPalette.bind(this.activeArea, true),
            'switch-font-family': this.activeArea.switchFontFamily.bind(this.activeArea, false),
            'switch-font-family-reverse': this.activeArea.switchFontFamily.bind(this.activeArea, true),
            'switch-font-weight': this.activeArea.switchFontWeight.bind(this.activeArea),
            'switch-font-style': this.activeArea.switchFontStyle.bind(this.activeArea),
            'switch-text-alignment': this.activeArea.switchTextAlignment.bind(this.activeArea),
            'toggle-panel-and-dock-visibility': this.togglePanelAndDockOpacity.bind(this),
            'toggle-help': this.activeArea.toggleHelp.bind(this.activeArea),
            'open-preferences': this.openPreferences.bind(this)
        };
        
        for (let key in this.internalKeybindings1) {
            Main.wm.addKeybinding(key,
                                  this._extension.getSettings(this._extension.metadata['settings-schema'] + '.internal-shortcuts'),
                                  Meta.KeyBindingFlags.NONE,
                                  this._DRAWING_ACTION_MODE,
                                  this.internalKeybindings1[key]);
        }
        
        for (let key in this.internalKeybindings2) {
            Main.wm.addKeybinding(key,
                                  this._extension.getSettings(this._extension.metadata['settings-schema'] + '.internal-shortcuts'),
                                  Meta.KeyBindingFlags.NONE,
                                  this._DRAWING_ACTION_MODE | this._WRITING_ACTION_MODE,
                                  this.internalKeybindings2[key]);
        }
        
        for (let i = 1; i < 10; i++) {
            let iCaptured = i;
            Main.wm.addKeybinding('select-color' + i,
                                  this._extension.getSettings(this._extension.metadata['settings-schema'] + '.internal-shortcuts'),
                                  Meta.KeyBindingFlags.NONE,
                                  this._DRAWING_ACTION_MODE | this._WRITING_ACTION_MODE,
                                  this.activeArea.selectColor.bind(this.activeArea, iCaptured - 1));
        }
    }
    
    removeInternalKeybindings() {
        for (let key in this.internalKeybindings1)
            Main.wm.removeKeybinding(key);
        
        for (let key in this.internalKeybindings2)
            Main.wm.removeKeybinding(key);
        
        for (let i = 1; i < 10; i++)
            Main.wm.removeKeybinding('select-color' + i);
    }
    
    openPreferences() {
        if (this.activeArea)
            this.toggleDrawing();
        this._extension.openPreferences();
    }
    
    eraseDrawings() {
        this.areas.forEach(area => area.erase());
        if (this.persistentOverRestarts)
            this.areas[Main.layoutManager.primaryIndex].savePersistent();
    }
    
    togglePanelAndDockOpacity() {
        if (this.hiddenList) {
            this.hiddenList.forEach(item => item.actor.set_opacity(item.oldOpacity));
            this.hiddenList = null;
        } else {
            let activeIndex = this.areas.indexOf(this.activeArea);
            
            // dash-to-dock - disabled (user doesn't want dash hidden)
            let dtdContainers = [];
            // OLD CODE (kept as comment for reference):
            // let dtdContainers = Main.uiGroup.get_children().filter((actor) => {
            //     return actor.name && actor.name == 'dashtodockContainer' &&
            //            ((actor._delegate && actor._delegate._monitorIndex !== undefined &&
            //              actor._delegate._monitorIndex == activeIndex) ||
            //             (actor._monitorIndex !== undefined &&
            //              actor._monitorIndex == activeIndex));
            // });
            
            // for simplicity, we assume that main dash-to-panel panel is displayed on primary monitor
            // and we hide all secondary panels together if the active area is not on the primary
            let name = activeIndex == Main.layoutManager.primaryIndex ? 'panelBox' : 'dashtopanelSecondaryPanelBox';
            let panelBoxes = Main.uiGroup.get_children().filter((actor) => {
                return actor.name && actor.name == name ||
                       // dtp v37+
                       actor.get_children().length && actor.get_children()[0].name && actor.get_children()[0].name == name;
            });
            
            let actorToHide = dtdContainers.concat(panelBoxes);
            this.hiddenList = [];
            actorToHide.forEach(actor => {
                this.hiddenList.push({ actor: actor, oldOpacity: actor.get_opacity() });
                actor.set_opacity(0);
            });
        }
    }
    
    toggleArea() {
        if (!this.activeArea)
            return;
        
        let activeIndex = this.areas.indexOf(this.activeArea);
        
        if (this.activeArea.get_parent() == Main.uiGroup) {
            Main.uiGroup.set_child_at_index(Main.layoutManager.keyboardBox, this.oldKeyboardIndex);
            Main.uiGroup.remove_child(this.activeArea);
            Main.layoutManager._backgroundGroup.insert_child_above(this.activeArea, Main.layoutManager._bgManagers[activeIndex].backgroundActor);
            if (!this.onDesktop)
                this.activeArea.hide();
        } else {
            Main.layoutManager._backgroundGroup.remove_child(this.activeArea);
            Main.uiGroup.add_child(this.activeArea);
            // move the keyboard above the area to make it available with text entries
            this.oldKeyboardIndex = Main.uiGroup.get_children().indexOf(Main.layoutManager.keyboardBox);
            Main.uiGroup.set_child_above_sibling(Main.layoutManager.keyboardBox, this.activeArea);
        }
    }
    
    toggleModal(source) {
        if (!this.activeArea)
            return;

        this.activeArea.closeMenu();
        if (this._findModal(this.grab) != -1) {
            Main.popModal(this.grab);
            if (source && source == global.display)
              this.showOsd(null, this._extension.FILES.ICONS.UNGRAB, _("Keyboard and pointer released"), null, null, false);
                // Translators: "released" as the opposite of "grabbed"


            this.setCursor(null, 'DEFAULT');
            this.activeArea.reactive = false;
            this.removeInternalKeybindings();

        } else {
            // add Shell.ActionMode.NORMAL to keep system keybindings enabled (e.g. Alt + F2 ...)
            let actionMode = (this.activeArea.isWriting ? this._WRITING_ACTION_MODE : this._DRAWING_ACTION_MODE) | Shell.ActionMode.NORMAL  | Shell.ActionMode.OVERVIEW;
            this.grab = Main.pushModal(this.activeArea, { actionMode: actionMode });
            if (this.grab.get_seat_state() === Clutter.GrabState.NONE) {
                Main.popModal(this.grab);
                return false;
            }
            this.addInternalKeybindings();
            this.activeArea.reactive = true;
            this.activeArea.initPointerCursor();
            if (source && source == global.display)
                this.showOsd(null, this._extension.FILES.ICONS.GRAB, _("Keyboard and pointer grabbed"), null, null, false);
        }
        
        return true;
    }
    
    toggleDrawing() {
        if (this.activeArea) {
            let activeIndex = this.areas.indexOf(this.activeArea);
            let save = activeIndex == Main.layoutManager.primaryIndex && this.persistentOverRestarts;
            let erase = !this.persistentOverToggles;

            this.showOsd(null, this._extension.FILES.ICONS.LEAVE, _("Leaving drawing mode"));
            this.activeArea.leaveDrawingMode(save, erase);

            if (this.hiddenList)
                this.togglePanelAndDockOpacity();
            
            if (this._findModal(this.grab) != -1)
                this.toggleModal();

            this.toggleArea();
            this.activeArea = null;
        } else {
            // avoid to deal with Meta changes (global.display/global.screen)
            let currentIndex = Main.layoutManager.monitors.indexOf(Main.layoutManager.currentMonitor);
            this.activeArea = this.areas[currentIndex];
            this.toggleArea();
            if (!this.toggleModal()) {
                this.toggleArea();
                this.activeArea = null;
                return;
            }
            
            this.activeArea.enterDrawingMode();
            this.osdDisabled = this._settings.get_boolean('osd-disabled');
            // <span size="medium"> is a clutter/mutter 3.38 bug workaround: https://gitlab.gnome.org/GNOME/mutter/-/issues/1467
            // Translators: %s is a key label
            let label = `<small>${_("Press <i>Ctrl+F1</i> for help").format(this.activeArea.helper.helpKeyLabel)}</small>\n\n<span size="medium">${_("Entering drawing mode")}</span>`;
            this.showOsd(null, this._extension.FILES.ICONS.ENTER, label, null, null, true);
        }
        
        if (this.indicator)
            this.indicator.sync(Boolean(this.activeArea));
    }
    
    // Use level -1 to set no level through a signal.
    showOsd(emitter, icon, label, color, level, long) {
        let activeIndex = this.areas.indexOf(this.activeArea);
        if (activeIndex == -1 || this.osdDisabled)
            return;
        
        // let hideTimeoutSave;
        // if (long && this._GS_VERSION >= '3.28.0') {
        //     hideTimeoutSave = OsdWindow.HIDE_TIMEOUT;
        //     OsdWindow.HIDE_TIMEOUT = this._HIDE_TIMEOUT_LONG;
        // }
        
        let maxLevel;
        if (level == -1)
            level = null;
        else if (level > 100)
            maxLevel = 2;
        
        // GS 3.32- : bar from 0 to 100
        // GS 3.34+ : bar from 0 to 1
        if (level && this._SHELL_MAJOR_VERSION >= 3)
            level = level / 100;
        
        if (!icon)
            icon = this._extension.FILES.ICONS.ENTER;
        
        if (this._SHELL_MAJOR_VERSION >= 49)
            Main.osdWindowManager.showOne(activeIndex, icon, label, level, maxLevel);
        else
            Main.osdWindowManager.show(activeIndex, icon, label, level, maxLevel);
        
        let osdWindow = Main.osdWindowManager._osdWindows[activeIndex];
        
        osdWindow._label.get_clutter_text().set_use_markup(true);
        
        if (color) {
            osdWindow._icon.set_style(`color:${color};`);
            osdWindow._label.set_style(`color:${color};`);
            let osdColorChangedHandler = osdWindow._label.connect('notify::text', () => {
                osdWindow._icon.set_style(`color:;`);
                osdWindow._label.set_style(`color:;`);
                osdWindow._label.disconnect(osdColorChangedHandler);
            });
        }
        
        if (level === 0) {
            osdWindow._label.add_style_class_name(this._WARNING_COLOR_STYLE_CLASS_NAME);
            // the same label is shared by all GS OSD so the style must be removed after being used
            let osdLabelChangedHandler = osdWindow._label.connect('notify::text', () => {
                osdWindow._label.remove_style_class_name(this._WARNING_COLOR_STYLE_CLASS_NAME);
                osdWindow._label.disconnect(osdLabelChangedHandler);
            });
        }
        
        // if (hideTimeoutSave)
        //     OsdWindow.HIDE_TIMEOUT = hideTimeoutSave;
    }
    
    setCursor(sourceActor_, cursorName) {
        // Map cursor names for GNOME 46/47 fallback compatibility
        let cursorMap = {
            'MOVE': this._SHELL_MAJOR_VERSION >= 48 ? 'MOVE' : 'DND_MOVE',
            'POINTER': this._SHELL_MAJOR_VERSION >= 48 ? 'POINTER' : 'POINTING_HAND', 
            'NONE': this._SHELL_MAJOR_VERSION >= 48 ? 'NONE' : 'BLANK',
            'CROSSHAIR': 'CROSSHAIR',
            'TEXT': this._SHELL_MAJOR_VERSION >= 48 ? 'TEXT' : 'IBEAM',
            'DEFAULT': 'DEFAULT'
        };
        
        let mappedCursorName = cursorMap[cursorName] || cursorName;
        
        // Safety check: verify the cursor constant exists before using it
        if (!Meta.Cursor[mappedCursorName]) {
            // Fallback to DEFAULT if cursor doesn't exist
            console.debug(`Draw On Gnome: Cursor ${mappedCursorName} not found, using DEFAULT`);
            mappedCursorName = 'DEFAULT';
        }
        
        // Check display or screen (API changes)  
        try {
            if (global.display.set_cursor)
                global.display.set_cursor(Meta.Cursor[mappedCursorName]);
            else if (global.screen && global.screen.set_cursor)
                global.screen.set_cursor(Meta.Cursor[mappedCursorName]);
        } catch (e) {
            console.debug(`Draw On Gnome: Error setting cursor ${mappedCursorName}: ${e.message}`);
        }
    }
    
    removeAreas() {
        for (const area of this.areas) {
            area.disconnect(area.leaveDrawingHandler);
            area.disconnect(area.showOsdHandler);
            area.destroy();
        }
        this.areas = [];
    }
    
    disable() {
        if (this.monitorChangedHandler) {
            Main.layoutManager.disconnect(this.monitorChangedHandler);
            this.monitorChangedHandler = null;
        }
        if (this.indicatorSettingHandler) {
            this._settings.disconnect(this.indicatorSettingHandler);
            this.indicatorSettingHandler = null;
        }
        if (this.desktopSettingHandler) {
            this._settings.disconnect(this.desktopSettingHandler);
            this.desktopSettingHandler = null;
        }
        if (this.persistentOverTogglesSettingHandler) {
            this._settings.disconnect(this.persistentOverTogglesSettingHandler);
            this.persistentOverTogglesSettingHandler = null;
        }
        if (this.persistentOverRestartsSettingHandler) {
            this._settings.disconnect(this.persistentOverRestartsSettingHandler);
            this.persistentOverRestartsSettingHandler = null;
        }
        
        if (this.activeArea)
            this.toggleDrawing();
        Main.wm.removeKeybinding('toggle-drawing');
        Main.wm.removeKeybinding('toggle-modal');
        Main.wm.removeKeybinding('erase-drawings');
        this.removeAreas();
        // this._extension.FILES.IMAGES.disable();
        // this._extension.FILES.JSONS.disable();
        if (this.indicator)
            this.indicator.disable();
    }

    /**
     * @private
     * @param {Clutter.Grab} grab - grab
     */
    _findModal(grab) {
        return Main.modalActorFocusStack.findIndex(modal => modal.grab === grab);
    }

};


export class DrawingIndicator {

    enable() {
        let [menuAlignment, dontCreateMenu] = [0, true];
        this.button = new PanelMenu.Button(menuAlignment, "Drawing Indicator", dontCreateMenu);
        this.buttonActor = this._SHELL_MAJOR_VERSION >= 3 ? this.button.actor: this.button;
        Main.panel.addToStatusArea('draw-on-gnome-indicator', this.button);
        
        this.icon = new St.Icon({ icon_name: 'applications-graphics-symbolic',
                                  style_class: 'system-status-icon screencast-indicator' });
        this.buttonActor.add_child(this.icon);
        this.buttonActor.visible = false;
    }

    sync(visible) {
        this.buttonActor.visible = visible;
    }
    
    disable() {
        this.button.destroy();
    }
};


