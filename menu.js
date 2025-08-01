/*
 * Copyright 2019 Abakkk
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
 * SPDX-FileCopyrightText: 2019 Abakkk
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileContributor: Modified by Dave Prowse
 */

/* jslint esversion: 6 (2019) */
/* eslint version: 9.16 (2024) */

import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import St from 'gi://St';

import * as BoxPointer from 'resource:///org/gnome/shell/ui/boxpointer.js';
import * as Dash from 'resource:///org/gnome/shell/ui/dash.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Slider from 'resource:///org/gnome/shell/ui/slider.js';

import * as Config from 'resource:///org/gnome/shell/misc/config.js'

import {gettext as _, pgettext} from 'resource:///org/gnome/shell/extensions/extension.js';

import { CURATED_UUID as UUID } from './utils.js';


const GS_VERSION = Config.PACKAGE_VERSION;
// 150 labels with font-family style take ~15Mo
const FONT_FAMILY_STYLE = true;
// use 'login-dialog-message-warning' class in order to get GS theme warning color (default: #f57900)
const WARNING_COLOR_STYLE_CLASS_NAME = 'login-dialog-message-warning';




// Used by both menu and osd notifications.
export const DisplayStrings = {
    getDashedLine: function(dashed) {
        return dashed ? _("Dashed line") :
                        // Translators: as the alternative to "Dashed line"
                        _("Full line");
    },
    
    getFill: function(fill) {
        return fill ? _("Fill") :
                      // Translators: as the alternative to "Fill"
                      _("Outline");
    },
    
    get FillRule() {
        if (!this._FillRule)
            // Translators: fill-rule SVG attribute
            this._FillRule = { 0: _("Nonzero"), 1: _("Evenodd") };
        return this._FillRule;
    },
    
    getFontFamily: function(family) {
        if (!this._FontGenericFamily)
            // Translators: generic font-family SVG attribute
            this._FontGenericFamily = { 'Sans-Serif': pgettext("font-family", "Sans-Serif"), 'Serif': pgettext("font-family", "Serif"),
                                        'Monospace': pgettext("font-family", "Monospace"), 'Cursive': pgettext("font-family", "Cursive"),
                                        'Fantasy': pgettext("font-family", "Fantasy") };
        return this._FontGenericFamily[family] || family;
    },
    
    get FontStyle() {
        if (!this._FontStyle)
            // Translators: font-style SVG attribute
            this._FontStyle = { 0: pgettext("font-style", "Normal"), 1: pgettext("font-style", "Oblique"), 2: pgettext("font-style", "Italic") };
        return this._FontStyle;
    },
    
    FontStyleMarkup: { 0: 'normal', 1: 'oblique', 2: 'italic' },
    
    get FontWeight() {
        if (!this._FontWeight)
            // Translators: font-weight SVG attribute
            this._FontWeight = { 100: pgettext("font-weight", "Thin"), 200: pgettext("font-weight", "Ultra Light"), 300: pgettext("font-weight", "Light"),
                                 350: pgettext("font-weight", "Semi Light"), 380: pgettext("font-weight", "Book"), 400: pgettext("font-weight", "Normal"),
                                 500: pgettext("font-weight", "Medium"), 600: pgettext("font-weight", "Semi Bold"), 700: pgettext("font-weight", "Bold"),
                                 800: pgettext("font-weight", "Ultra Bold"), 900: pgettext("font-weight", "Heavy"), 1000: pgettext("font-weight", "Ultra Heavy") };
        return this._FontWeight;
    },
    
    get LineCap() {
        if (!this._LineCap)
            // Translators: stroke-linecap SVG attribute
            this._LineCap = { 0: pgettext("stroke-linecap", "Butt"), 1: pgettext("stroke-linecap", "Round"), 2: pgettext("stroke-linecap", "Square") };
        return this._LineCap;
    },
    
    get LineJoin() {
        if (!this._LineJoin)
            // Translators: stroke-linejoin SVG attribute
            this._LineJoin = { 0: pgettext("stroke-linejoin", "Miter"), 1: pgettext("stroke-linejoin", "Round"), 2: pgettext("stroke-linejoin", "Bevel") };
        return this._LineJoin;
    },
    
    getPixels(value) {
        // Translators: value in pixel unit (e.g. "5 px")
        return _("%f px").format(value);
    },
    
    get TextAlignment() {
        // Translators: text alignment
        if (!this._TextAlignment)
            this._TextAlignment = { 0: _("Left aligned"), 1: _("Centered"), 2: _("Right aligned") };
        
        return this._TextAlignment;
    },
    
    get Tool() {
        if (!this._Tool)
            this._Tool = { 0: pgettext("drawing-tool", "Free drawing"), 1: pgettext("drawing-tool", "Line"), 2: pgettext("drawing-tool", "Ellipse"),
                           3: pgettext("drawing-tool", "Rectangle"), 4: pgettext("drawing-tool", "Text"), 5: pgettext("drawing-tool", "Polygon"),
                           6: pgettext("drawing-tool", "Polyline"), 7: pgettext("drawing-tool", "Image"), 8: pgettext("drawing-tool", "Arrow"),
                           100: pgettext("drawing-tool", "Move"), 101: pgettext("drawing-tool", "Resize"), 102: pgettext("drawing-tool", "Mirror") };
        return this._Tool;
    }
};


export const DrawingMenu = GObject.registerClass({
    GTypeName: `${UUID}-DrawingMenu`,
}, class DrawingMenu extends GObject.Object {
    _init(extension, area, monitor, DrawingTool, areaManagerUtils) {
        super._init({});
        this._extension = extension;
        this.area = area;
        this.monitor = monitor;
        this.DrawingTool = DrawingTool;
        this.areaManagerUtils = areaManagerUtils;
        
        let side = Clutter.get_default_text_direction() == Clutter.TextDirection.RTL ? St.Side.RIGHT : St.Side.LEFT;
        this.menu = new PopupMenu.PopupMenu(Main.layoutManager.dummyCursor, 0.25, side);
        this.menuManager = new PopupMenu.PopupMenuManager(GS_VERSION < '3.33.0' ? { actor: this.area } : this.area);
        this.menuManager.addMenu(this.menu);
        
        Main.layoutManager.uiGroup.add_child(this.menu.actor);
        
        this.menu.actor.add_style_class_name('background-menu draw-on-gnome-menu');
        this.menu.actor.hide();
        this.hasSeparators = monitor.height >= 750;
        
        // do not close the menu on item activated
        this.menu.itemActivated = () => {};
        this.menu.connect('open-state-changed', this._onMenuOpenStateChanged.bind(this));
        
        // Case where the menu is closed (escape key) while the save entry clutter_text is active:
        // St.Entry clutter_text set the DEFAULT cursor on leave event with a delay and
        // overrides the cursor set by area.updatePointerCursor().
        // In order to update drawing cursor on menu closed, we need to leave the saveEntry before closing menu.
        // Since escape key press event can't be captured easily, the job is done in the menu close function.
        let menuCloseFunc = this.menu.close;
        this.menu.close = (animate) => {
            if (this.saveDrawingSubMenu && this.saveDrawingSubMenu.isOpen)
                this.saveDrawingSubMenu.close();
            menuCloseFunc.bind(this.menu)(animate);
        };
    }
    
    disable() {
        delete this.area;
        delete this.DrawingTool;
        delete this.areaManagerUtils;
        this.menuManager.removeMenu(this.menu);
        Main.layoutManager.uiGroup.remove_child(this.menu.actor);
        this.menu.destroy();
    }
    
    _onMenuOpenStateChanged(menu, open) {
        if (open) {
            this.area.setPointerCursor('DEFAULT');
        } else {
            this.area.updatePointerCursor();
            this.area.grab_key_focus();
        }
        
        let workArea = Main.layoutManager.getWorkAreaForMonitor(this.monitor.index);
        let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        let maxHeight = Math.round(workArea.height / scaleFactor);
        this.menu.actor.set_style(`max-height:${maxHeight}px;`);
    }
    
    popup() {
        if (this.menu.isOpen) {
            this.close();
        } else {
            this.open();
            this.menu.actor.navigate_focus(null, St.DirectionType.TAB_FORWARD, false); 
        }
    }
    
    open(x, y) {
        if (this.menu.isOpen)
            return;
        if (x === undefined || y === undefined)
            [x, y] = [this.area.monitor.x + this.area.monitor.width / 2, this.area.monitor.y + this.area.monitor.height / 2];
        this._redisplay();
        Main.layoutManager.setDummyCursorGeometry(x, y, 0, 0);
        let monitor = this.area.monitor;
        this.menu._arrowAlignment = (y - monitor.y) / monitor.height;
        this.menu.open(BoxPointer.PopupAnimation.NONE);
        this.menuManager.ignoreRelease();
    }
    
    close() {
        if (this.menu.isOpen)
            this.menu.close();
    }
    
    _redisplay() {
        this.menu.removeAll();
        
        let groupItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false, style_class: 'draw-on-gnome-menu-group-item' });
        this.undoButton = new ActionButton(this._getSummary('undo'), 'edit-undo-symbolic', this.area.undo.bind(this.area), this._updateActionSensitivity.bind(this));
        this.redoButton = new ActionButton(this._getSummary('redo'), 'edit-redo-symbolic', this.area.redo.bind(this.area), this._updateActionSensitivity.bind(this));
        this.eraseButton = new ActionButton(_("Erase"), 'edit-clear-all-symbolic', this.area.deleteLastElement.bind(this.area), this._updateActionSensitivity.bind(this));
        this.smoothButton = new ActionButton(_("Smooth"), this._extension.FILES.ICONS.SMOOTH, this.area.smoothLastElement.bind(this.area), this._updateActionSensitivity.bind(this));
        this.eraseButton.child.add_style_class_name('draw-on-gnome-menu-destructive-button');
        this._getActor(groupItem).add_child(this.undoButton);
        this._getActor(groupItem).add_child(this.redoButton);
        this._getActor(groupItem).add_child(this.eraseButton);
        this._getActor(groupItem).add_child(this.smoothButton);
        this.menu.addMenuItem(groupItem);
        this._addSeparator(this.menu, true);
        
        this.toolItem = this._addToolSubMenuItem(this.menu, this._updateSectionVisibility.bind(this));
        this.paletteItem = this._addPaletteSubMenuItem(this.menu, this._extension.FILES.ICONS.PALETTE);
        this.colorItem = this._addColorSubMenuItem(this.menu, this._extension.FILES.ICONS.COLOR);
        this.fillItem = this._addSwitchItem(this.menu, DisplayStrings.getFill(true), this._extension.FILES.ICONS.STROKE, this._extension.FILES.ICONS.FILL, this.area, 'fill', this._updateSectionVisibility.bind(this));
        this.fillSection = new PopupMenu.PopupMenuSection();
        this.fillSection.itemActivated = () => {};
        this.fillRuleItem = this._addSwitchItem(this.fillSection, DisplayStrings.FillRule[1], this._extension.FILES.ICONS.FILLRULE_NONZERO, this._extension.FILES.ICONS.FILLRULE_EVENODD, this.area, 'currentEvenodd');
        this.menu.addMenuItem(this.fillSection);
        this._addSeparator(this.menu);
        
        let lineSection = new PopupMenu.PopupMenuSection();
        this._addSliderItem(lineSection, this.area, 'currentLineWidth');
        this._addSubMenuItem(lineSection, this._extension.FILES.ICONS.LINEJOIN, DisplayStrings.LineJoin, this.area, 'currentLineJoin');
        this._addSubMenuItem(lineSection, this._extension.FILES.ICONS.LINECAP, DisplayStrings.LineCap, this.area, 'currentLineCap');
        this._addSwitchItem(lineSection, DisplayStrings.getDashedLine(true), this._extension.FILES.ICONS.FULL_LINE, this._extension.FILES.ICONS.DASHED_LINE, this.area, 'dashedLine');
        this._addSeparator(lineSection);
        this.menu.addMenuItem(lineSection);
        lineSection.itemActivated = () => {};
        this.lineSection = lineSection;
        
        let fontSection = new PopupMenu.PopupMenuSection();
        this._addFontFamilySubMenuItem(fontSection, this._extension.FILES.ICONS.FONT_FAMILY);
        this._addSubMenuItem(fontSection, this._extension.FILES.ICONS.FONT_WEIGHT, DisplayStrings.FontWeight, this.area, 'currentFontWeight');
        this._addSubMenuItem(fontSection, this._extension.FILES.ICONS.FONT_STYLE, DisplayStrings.FontStyle, this.area, 'currentFontStyle');
        this._addTextAlignmentSubMenuItem(fontSection);
        this._addSeparator(fontSection);
        this.menu.addMenuItem(fontSection);
        fontSection.itemActivated = () => {};
        this.fontSection = fontSection;
        
        let imageSection = new PopupMenu.PopupMenuSection();
        this.imageItem = this._addImageSubMenuItem(imageSection);
        this._addSeparator(imageSection);
        this.menu.addMenuItem(imageSection);
        imageSection.itemActivated = () => {};
        this.imageSection = imageSection;
        
        this._addSimpleSwitchItem(this.menu, this._getSummary('toggle-panel-and-dock-visibility'), !!this.areaManagerUtils.getHiddenList(), this.areaManagerUtils.togglePanelAndDockOpacity);
        this._addSimpleSwitchItem(this.menu, this._getSummary('toggle-background'), this.area.hasBackground, this.area.toggleBackground.bind(this.area));
        this._addSimpleSwitchItem(this.menu, this._getSummary('toggle-grid'), this.area.hasGrid, this.area.toggleGrid.bind(this.area));
        this._addSimpleSwitchItem(this.menu, this._getSummary('toggle-square-area'), this.area.isSquareArea, this.area.toggleSquareArea.bind(this.area));
        this._addSeparator(this.menu);
        
        this._addDrawingNameItem(this.menu);
        this._addOpenDrawingSubMenuItem(this.menu, _("Open drawing"), 'document-open-symbolic');
        this._addSaveDrawingSubMenuItem(this.menu, _("Save drawing as…"), 'document-save-as-symbolic');
        this._addSeparator(this.menu);
        
        groupItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false, style_class: 'draw-on-gnome-menu-group-item' });
        this.saveButton = new ActionButton(this._getSummary('save-as-json'), 'document-save-symbolic', this.area.saveAsJson.bind(this.area, false, this._onDrawingSaved.bind(this)), null);
        this.svgButton = new ActionButton(this._getSummary('export-to-svg'), this._extension.FILES.ICONS.DOCUMENT_EXPORT, this.area.exportToSvg.bind(this.area), null);
        this.prefsButton = new ActionButton(this._getSummary('open-preferences'), 'document-page-setup-symbolic', this.areaManagerUtils.openPreferences, null);
        this.helpButton = new ActionButton(this._getSummary('toggle-help'), 'preferences-desktop-keyboard-shortcuts-symbolic', () => { this.close(); this.area.toggleHelp(); }, null);
        this._getActor(groupItem).add_child(this.saveButton);
        this._getActor(groupItem).add_child(this.svgButton);
        this._getActor(groupItem).add_child(this.prefsButton);
        this._getActor(groupItem).add_child(this.helpButton);
        this.menu.addMenuItem(groupItem);
        
        this._updateActionSensitivity();
        this._updateSectionVisibility();
    }
    
    _updateActionSensitivity() {
        this.undoButton.child.reactive = this.area.elements.length > 0;
        this.redoButton.child.reactive = this.area.undoneElements.length > 0 || (this.area.elements.length && this.area.elements[this.area.elements.length - 1].canUndo);
        this.eraseButton.child.reactive = this.area.elements.length > 0;
        this.smoothButton.child.reactive = this.area.elements.length > 0 && this.area.elements[this.area.elements.length - 1].shape == this.DrawingTool.NONE;
        this.saveButton.child.reactive = this.area.elements.length > 0;
        this.svgButton.child.reactive = this.area.elements.length > 0;
        this.saveDrawingSubMenuItem.setSensitive(this.area.elements.length > 0);
    }
    
    _updateSectionVisibility() {
        let [isText, isImage] = [this.area.currentTool == this.DrawingTool.TEXT, this.area.currentTool == this.DrawingTool.IMAGE];
        this.lineSection.actor.visible = !isText && !isImage;
        this.fontSection.actor.visible = isText;
        this.imageSection.actor.visible = isImage;
        this.fillItem.setSensitive(!isText && !isImage);
        this.fillSection.setSensitive(!isText && !isImage);
        
        if (this.area.fill)
            this.fillSection.actor.show();
        else
            this.fillSection.actor.hide();
    }
    
    _addSwitchItem(menu, label, iconFalse, iconTrue, target, targetProperty, onToggled) {
        let item = new PopupMenu.PopupSwitchMenuItem(label, target[targetProperty]);
        
        item.icon = new St.Icon({ style_class: 'popup-menu-icon' });
        this._getActor(item).insert_child_at_index(item.icon, 1);
        let icon = target[targetProperty] ? iconTrue : iconFalse;
        if (icon)
            item.icon.set_gicon(icon);
        
        item.connect('toggled', (item, state) => {
            target[targetProperty] = state;
            let icon = target[targetProperty] ? iconTrue : iconFalse;
            if (icon)
                item.icon.set_gicon(icon);
            if (onToggled)
                onToggled();
        });
        menu.addMenuItem(item);
        return item;
    }
    
    _addSimpleSwitchItem(menu, label, active, onToggled) {
        let item = new PopupMenu.PopupSwitchMenuItem(label, active);
        item.connect('toggled', onToggled);
        menu.addMenuItem(item);
    }
    
    _addSliderItem(menu, target, targetProperty) {
        let item = new PopupMenu.PopupBaseMenuItem({ activate: false });
        let label = new St.Label({ text: DisplayStrings.getPixels(target[targetProperty]), style_class: 'draw-on-gnome-menu-slider-label' });
        let slider = new Slider.Slider(target[targetProperty] / 50);
        
        if (GS_VERSION < '3.33.0') {
            slider.connect('value-changed', (slider, value, property) => {
                target[targetProperty] = Math.max(Math.round(value * 50), 0);
                label.set_text(DisplayStrings.getPixels(target[targetProperty]));
                this._extension.drawingSettings.set_int("tool-size", target[targetProperty]);
                if (target[targetProperty] === 0)
                    label.add_style_class_name(WARNING_COLOR_STYLE_CLASS_NAME);
                else
                    label.remove_style_class_name(WARNING_COLOR_STYLE_CLASS_NAME);
            });
        } else {
            slider.connect('notify::value', () => {
                target[targetProperty] = Math.max(Math.round(slider.value * 50), 0);
                label.set_text(DisplayStrings.getPixels(target[targetProperty]));
                this._extension.drawingSettings.set_int("tool-size", target[targetProperty]);
                if (target[targetProperty] === 0)
                    label.add_style_class_name(WARNING_COLOR_STYLE_CLASS_NAME);
                else
                    label.remove_style_class_name(WARNING_COLOR_STYLE_CLASS_NAME);
            });
        }
        
        this._getActor(slider).x_expand = true;
        this._getActor(item).add_child(this._getActor(slider));
        this._getActor(item).add_child(label);
        if (slider.onKeyPressEvent)
            this._getActor(item).connect('key-press-event', slider.onKeyPressEvent.bind(slider));
        menu.addMenuItem(item);
    }
    
    _addSubMenuItem(menu, icon, obj, target, targetProperty) {
        let item = new PopupMenu.PopupSubMenuMenuItem(String(obj[target[targetProperty]]), icon ? true : false);
        
        item.icon.set_gicon(icon);
        item.menu.itemActivated = item.menu.close;
        
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            Object.keys(obj).forEach(key => {
                let text = targetProperty == 'currentFontWeight' ? `<span font_weight="${key}">${obj[key]}</span>` :
                           targetProperty == 'currentFontStyle' ? `<span font_style="${DisplayStrings.FontStyleMarkup[key]}">${obj[key]}</span>` :
                           String(obj[key]);
                
                let subItem = item.menu.addAction(text, () => {
                    item.label.set_text(String(obj[key]));
                    target[targetProperty] = Number(key);
                });
                
                subItem.label.get_clutter_text().set_use_markup(true);
                this._getActor(subItem).connect('key-focus-in', updateSubMenuAdjustment);
            });
            return GLib.SOURCE_REMOVE;
        });
        
        menu.addMenuItem(item);
    }
    
    _addToolSubMenuItem(menu, callback) {
        let item = new PopupMenu.PopupSubMenuMenuItem('', true);
        item.update = () => {
            item.label.set_text(DisplayStrings.Tool[this.area.currentTool]);
            let toolName = this.DrawingTool.getNameOf(this.area.currentTool);
            item.icon.set_gicon(this._extension.FILES.ICONS[`TOOL_${toolName}`]);
        };
        item.update();
        
        item.menu.itemActivated = item.menu.close;
        
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            Object.keys(DisplayStrings.Tool).forEach(key => {
                let text = DisplayStrings.Tool[key];
                let toolName = this.DrawingTool.getNameOf(key);
                let subItemIcon = this._extension.FILES.ICONS[`TOOL_${toolName}`];
                let subItem = item.menu.addAction(text, () => {
                    this.area.currentTool = Number(key);
                    item.update();
                    callback();
                }, subItemIcon);
                
                subItem.label.get_clutter_text().set_use_markup(true);
                this._getActor(subItem).connect('key-focus-in', updateSubMenuAdjustment);
                
                // change the display order of tools
                if (key == this.DrawingTool.POLYGON)
                    item.menu.moveMenuItem(subItem, Number(this.DrawingTool.TEXT));
                else if (key == this.DrawingTool.POLYLINE)
                    item.menu.moveMenuItem(subItem, Number(this.DrawingTool.TEXT) + 1);
            });
            return GLib.SOURCE_REMOVE;
        });
        
        menu.addMenuItem(item);
        return item;
    }
    
    _addPaletteSubMenuItem(menu, icon) {
        let text = _(this.area.currentPalette[0] || "Palette");
        let item = new PopupMenu.PopupSubMenuMenuItem(text, true);
        item.icon.set_gicon(icon);
        
        item.menu.itemActivated = item.menu.close;
        
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this.area.palettes.forEach(palette => {
                let [name, colors] = palette;
                if (!colors[0])
                    return;
                
                let subItem = item.menu.addAction(_(name || "Palette"), () => {
                    item.label.set_text(_(name || "Palette"));
                    this.area.currentPalette = palette;
                    this._populateColorSubMenu();
                });
                this._getActor(subItem).connect('key-focus-in', updateSubMenuAdjustment);
            });
            return GLib.SOURCE_REMOVE;
        });
        
        menu.addMenuItem(item);
        return item;
    }
    
    _addColorSubMenuItem(menu, icon) {
        let item = new PopupMenu.PopupSubMenuMenuItem(_("Color"), true);
        this.colorSubMenu = item.menu;
        item.icon.set_gicon(icon);
        item.icon.set_style(`color:${this.area.currentColor.to_string().slice(0, 7)};`);
        
        if (GS_VERSION >= '3.30') {
            let colorPickerCallback = () => {
                this.close();
                this.area.pickColor();
            };
            // Translators: It is displayed in a menu button tooltip or as a shortcut action description, so it should NOT use the imperative mood.
            let colorPickerButton = new ActionButton(_("Pick a color"), this._extension.FILES.ICONS.COLOR_PICKER, colorPickerCallback, null, true);
            let index = this._getActor(item).get_children().length - 1;
            this._getActor(item).insert_child_at_index(colorPickerButton, index);
        }
        
        item.menu.itemActivated = item.menu.close;
        
        this._populateColorSubMenu();
        menu.addMenuItem(item);
        return item;
    }
    
    _populateColorSubMenu() {
        this.colorSubMenu.removeAll();
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this.area.colors.forEach(color => {
                let text = String(color);
                let subItem = this.colorSubMenu.addAction(text, () => {
                    this.area.currentColor = color;
                    this._extension.drawingSettings.set_string("tool-color", color.to_string());
                    this.colorItem.icon.set_style(`color:${color.to_string().slice(0, 7)};`);
                });
                // Foreground color markup is not displayed since 3.36, use style instead but the transparency is lost.
                subItem.label.set_style(`color:${color.to_string().slice(0, 7)};`);
                this._getActor(subItem).connect('key-focus-in', updateSubMenuAdjustment);
            });
            return GLib.SOURCE_REMOVE;
        });
    }
    
    _addFontFamilySubMenuItem(menu, icon) {
        let item = new PopupMenu.PopupSubMenuMenuItem(DisplayStrings.getFontFamily(this.area.currentFontFamily), true);
        item.icon.set_gicon(icon);
        
        item.menu.itemActivated = item.menu.close;
        item.menu.actor.add_style_class_name('draw-on-gnome-menu-ellipsized');
        
        item.menu.openOld = item.menu.open;
        item.menu.open = (animate) => {
            if (!item.menu.isOpen && item.menu.isEmpty()) {
                this.area.fontFamilies.forEach(family => {
                    let subItem = item.menu.addAction(DisplayStrings.getFontFamily(family), () => {
                        item.label.set_text(DisplayStrings.getFontFamily(family));
                        this.area.currentFontFamily = family;
                    });
                    
                    if (FONT_FAMILY_STYLE)
                        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                            subItem.label.set_style(`font-family:${family}`);
                        });
                    
                    this._getActor(subItem).connect('key-focus-in', updateSubMenuAdjustment);
                });
            }
            item.menu.openOld();
        };
        
        menu.addMenuItem(item);
    }
    
    _addTextAlignmentSubMenuItem(menu) {
        let item = new PopupMenu.PopupSubMenuMenuItem(DisplayStrings.TextAlignment[this.area.currentTextAlignment], true);
        const TextAlignmentIcon = { 0: this._extension.FILES.ICONS.LEFT_ALIGNED, 1: this._extension.FILES.ICONS.CENTERED, 2: this._extension.FILES.ICONS.RIGHT_ALIGNED };
        item.icon.set_gicon(TextAlignmentIcon[this.area.currentTextAlignment]);
        
        item.menu.itemActivated = item.menu.close;
        
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            Object.keys(TextAlignmentIcon).forEach(key => {
                let subItem = item.menu.addAction(DisplayStrings.TextAlignment[key], () => {
                    item.label.set_text(DisplayStrings.TextAlignment[key]);
                    this.area.currentTextAlignment = key;
                    item.icon.set_gicon(TextAlignmentIcon[key]);
                });
                
                this._getActor(subItem).connect('key-focus-in', updateSubMenuAdjustment);
            });
            return GLib.SOURCE_REMOVE;
        });
        
        menu.addMenuItem(item);
    }
    
    _addImageSubMenuItem(menu, images) {
        let item = new PopupMenu.PopupSubMenuMenuItem('', true);
        item.update = () => {
            if (this.area.currentImage) { // null value. what consequences ?
                item.label.set_text(this.area.currentImage.toString());
                item.icon.set_gicon(this.area.currentImage.gicon);
            }
        };
        item.update();
        
        item.menu.itemActivated = item.menu.close;
        item.menu.actor.add_style_class_name('draw-on-gnome-menu-ellipsized');
        
        item.menu.openOld = item.menu.open;
        item.menu.open = (animate) => {
            if (!item.menu.isOpen && item.menu.isEmpty()) {
                this._extension.FILES.IMAGES.getSorted().forEach(image => {
                    let subItem = item.menu.addAction(image.toString(), () => {
                        this.area.currentImage = image;
                        item.update();
                    }, this._extension.FILES.ICONS.FAKE);
                    
                    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                        if (subItem.setIcon && image.thumbnailGicon)
                            subItem.setIcon(image.thumbnailGicon);
                    });
                    
                    this._getActor(subItem).connect('key-focus-in', updateSubMenuAdjustment);
                });
            }
            item.menu.openOld();
        };
        
        menu.addMenuItem(item);
        return item;
    }
    
    _addDrawingNameItem(menu) {
        this.drawingNameMenuItem = new PopupMenu.PopupMenuItem('', { reactive: false, activate: false });
        this.drawingNameMenuItem.setSensitive(false);
        this._getActor(this.drawingNameMenuItem).add_style_class_name('draw-on-gnome-menu-ellipsized');
        menu.addMenuItem(this.drawingNameMenuItem);
        this._updateDrawingNameMenuItem();
    }
    
    _updateDrawingNameMenuItem() {
        this._getActor(this.drawingNameMenuItem).visible = this.area.currentJson ? true : false;
        if (this.area.currentJson) {
            let prefix = this.area.drawingContentsHasChanged ? "* " : "";
            this.drawingNameMenuItem.label.set_text(`<i>${prefix}${this.area.currentJson.name}</i>`);
            this.drawingNameMenuItem.label.get_clutter_text().set_use_markup(true);
        }
    }
    
    _addOpenDrawingSubMenuItem(menu, label, icon) {
        let item = new PopupMenu.PopupSubMenuMenuItem(label, true);
        this.openDrawingSubMenuItem = item;
        this.openDrawingSubMenu = item.menu;
        item.setSensitive(Boolean(this._extension.FILES.JSONS.getSorted().length));
        item.icon.set_icon_name(icon);
        
        item.menu.itemActivated = item.menu.close;
        item.menu.actor.add_style_class_name('draw-on-gnome-menu-ellipsized');
        
        item.menu.openOld = item.menu.open;
        item.menu.open = (animate) => {
            if (!item.menu.isOpen)
                this._populateOpenDrawingSubMenu();
            item.menu.openOld();
        };
        
        menu.addMenuItem(item);
    }
    
    _populateOpenDrawingSubMenu() {
        this.openDrawingSubMenu.removeAll();
        this._extension.FILES.JSONS.getSorted().forEach(json => {
            if (!json.gicon)
                json.addSvgContents(...this.area.getSvgContentsForJson(json));
            
            let subItem = this.openDrawingSubMenu.addAction(`<i>${String(json)}</i>`, () => {
                this.area.loadJson(json);
                this._updateDrawingNameMenuItem();
                this._updateActionSensitivity();
            }, this._extension.FILES.ICONS.FAKE);
            
            GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                if (subItem.setIcon)
                    subItem.setIcon(json.gicon);
            });
            
            subItem.label.get_clutter_text().set_use_markup(true);
            this._getActor(subItem).connect('key-focus-in', updateSubMenuAdjustment);
            
            let expander = new St.Bin({
                style_class: 'popup-menu-item-expander',
                x_expand: true,
            });
            this._getActor(subItem).add_child(expander);
            
            let insertCallback = () => {
                this.area.currentImage = json.image;
                this.imageItem.update();
                this.area.currentTool = this.DrawingTool.IMAGE;
                this.toolItem.update();
                this._updateSectionVisibility();
            };
            let insertButton = new ActionButton(_("Add to images"), 'insert-image-symbolic', insertCallback, null, true);
            this._getActor(subItem).add_child(insertButton);
            
            let deleteCallback = () => {
                json.delete();
                subItem.destroy();
                this.openDrawingSubMenuItem.setSensitive(!this.openDrawingSubMenu.isEmpty());
            };
            let deleteButton = new ActionButton(_("Delete"), 'edit-delete-symbolic', deleteCallback, null, true);
            deleteButton.child.add_style_class_name('draw-on-gnome-menu-destructive-button');
            this._getActor(subItem).add_child(deleteButton);
        });
        
        this.openDrawingSubMenuItem.setSensitive(!this.openDrawingSubMenu.isEmpty());
    }
    
    _addSaveDrawingSubMenuItem(menu, label, icon) {
        let item = new PopupMenu.PopupSubMenuMenuItem(label, true);
        this.saveDrawingSubMenuItem = item;
        this.saveDrawingSubMenu = item.menu;
        item.icon.set_icon_name(icon);
        
        item.menu.itemActivated = item.menu.close;
        
        item.menu.openOld = item.menu.open;
        item.menu.open = (animate) => {
            if (!item.menu.isOpen)
                this._populateSaveDrawingSubMenu();
            item.menu.openOld();
        };
        menu.addMenuItem(item);
    }
    
    _updateSaveDrawingSubMenuItemSensitivity() {
        this.saveDrawingSubMenuItem.setSensitive(this.area.elements.length > 0);
    }
    
    _onDrawingSaved() {
        this._updateDrawingNameMenuItem();
        this.openDrawingSubMenuItem.setSensitive(true);
    }
    
    _populateSaveDrawingSubMenu() {
        this.saveDrawingSubMenu.removeAll();
        let saveEntry = new Entry({ initialTextGetter: () => this.area.currentJson ? this.area.currentJson.name : "",
                                    hint_text: _("Type a name"),
                                    entryActivateCallback: (text) => {
                                        this.area.saveAsJsonWithName(text, this._onDrawingSaved.bind(this));
                                        this.saveDrawingSubMenu.toggle();
                                    },
                                    invalidStrings: [this._extension.metadata['persistent-file-name'], '/'],
                                    primaryIconName: 'insert-text' });
        this.saveDrawingSubMenu.addMenuItem(saveEntry.item);
    }
    
    _addSeparator(menu, thin) {
        if (this.hasSeparators) {
            let separatorItem = new PopupMenu.PopupSeparatorMenuItem(' ');
            this._getActor(separatorItem).add_style_class_name('draw-on-gnome-menu-separator-item');
            if (thin)
                this._getActor(separatorItem).add_style_class_name('draw-on-gnome-menu-thin-separator-item');
            menu.addMenuItem(separatorItem);
        }
    }

    _getSummary(settingKey) {
        return this._extension.internalShortcutSettings.settings_schema.get_key(settingKey).get_summary();
    };

    _getActor(object) {
        return GS_VERSION < '3.33.0' ? object.actor : object;
    };
});




// based on ApplicationsButton.scrollToButton , https://gitlab.gnome.org/GNOME/gnome-shell-extensions/blob/master/extensions/apps-menu/extension.js
const updateSubMenuAdjustment = function(itemActor) {
    let scrollView = itemActor.get_parent().get_parent();
    let adjustment = scrollView.get_vscroll_bar().get_adjustment();
    let scrollViewAlloc = scrollView.get_allocation_box();
    let currentScrollValue = adjustment.get_value();
    let height = scrollViewAlloc.y2 - scrollViewAlloc.y1;
    let itemActorAlloc = itemActor.get_allocation_box();
    let newScrollValue = currentScrollValue;
    if (currentScrollValue > itemActorAlloc.y1 - 10)
        newScrollValue = itemActorAlloc.y1 - 10;
    if (height + currentScrollValue < itemActorAlloc.y2 + 10)
        newScrollValue = itemActorAlloc.y2 - height + 10;
    if (newScrollValue != currentScrollValue)
        adjustment.set_value(newScrollValue);
};




// An action button that uses upstream dash item tooltips.
const ActionButton = GObject.registerClass ({
    GTypeName: `${UUID}-DrawingMenuActionButton`,
    _labelShowing: false,
    _resetHoverTimeoutId: 0,
    _showLabelTimeoutId: 0,
    showLabel: Dash.DashItemContainer.prototype.showLabel,
    hideLabel: Dash.DashItemContainer.prototype.hideLabel,
    _syncLabel: Dash.Dash.prototype._syncLabel,
}, class ActionButton extends St.Bin {
    _init(name, icon, callback, callbackAfter, inline) {
        this._labelText = name;
        
        let button = new St.Button({ track_hover: true,
                                     x_align: Clutter.ActorAlign.CENTER,
                                     accessible_name: name,
                                     style_class: `button draw-on-gnome-menu-${inline ? 'inline' : 'action'}-button` });
        
        button.child = new St.Icon(typeof icon == 'string' ? { icon_name: icon } : { gicon: icon });
        if (inline)
            button.child.add_style_class_name('popup-menu-icon');
        
        button.connect('clicked', () => {
            callback();
            if (callbackAfter)
                callbackAfter();
        });
        button.bind_property('reactive', button, 'can_focus', GObject.BindingFlags.DEFAULT);
        //button.connect('notify::hover', () => this._syncLabel(this));
        
        super._init({ child: button, x_expand: inline ? false : true });
    }
    
    get label() {
        if (!this._label) {
            this._label = new St.Label({ style_class: 'dash-label' });
            Main.layoutManager.uiGroup.add_child(this._label);
            this.connect('destroy', () => this._label.destroy());
        }
        
        return this._label;
    }
});

// based on searchItem.js, https://github.com/leonardo-bartoli/gnome-shell-extension-Recents
// zhrexl: Registered as if it needed to extend Object but I might change that in the future
const Entry = GObject.registerClass({
    GTypeName: `${UUID}-DrawingMenuEntry`,
}, class Entry extends GObject.Object{
    _init(params) {
        this.params = params;
        this.item = new PopupMenu.PopupBaseMenuItem({ style_class: 'draw-on-gnome-menu-entry-item',
                                                      activate: false,
                                                      reactive: true,
                                                      can_focus: false });
        
        this.itemActor = GS_VERSION < '3.33.0' ? this.item.actor : this.item;
        
        this.entry = new St.Entry({
            hint_text: params.hint_text || "",
            style_class: 'search-entry draw-on-gnome-menu-entry',
            track_hover: true,
            reactive: true,
            can_focus: true,
            x_expand: true
        });
        
        this.entry.set_primary_icon(new St.Icon({ style_class: 'search-entry-icon',
                                                  icon_name: this.params.primaryIconName }));
        
        this.entry.clutter_text.connect('text-changed', this._onTextChanged.bind(this));
        this.entry.clutter_text.connect('activate', this._onTextActivated.bind(this));
        
        this.clearIcon = new St.Icon({
            style_class: 'search-entry-icon',
            icon_name: 'edit-clear-symbolic'
        });
        this.entry.connect('secondary-icon-clicked', this._reset.bind(this));
        
        this._getActor(this.item).add_child(this.entry);
        this._getActor(this.item).connect('notify::mapped', (actor) => {
            if (actor.mapped) {
                this.entry.set_text(this.params.initialTextGetter());
                this.entry.clutter_text.grab_key_focus();
            }
        });
    }
    
    _setError(hasError) {
        if (hasError)
            this.entry.add_style_class_name('draw-on-gnome-menu-entry-error');
        else
            this.entry.remove_style_class_name('draw-on-gnome-menu-entry-error');
    }
    
    _reset() {
        this.entry.text = '';
        this.entry.clutter_text.set_cursor_visible(true);
        this.entry.clutter_text.set_selection(0, 0);
        this._setError(false);
    }
    
    _onTextActivated(clutterText) {
        let text = clutterText.get_text();
        if (text.length == 0)
            return;
        if (this._getIsInvalid())
            return;
        this._reset();
        this.params.entryActivateCallback(text);
    }
    
    _onTextChanged(clutterText) {
        let text = clutterText.get_text();
        this.entry.set_secondary_icon(text.length ? this.clearIcon : null);
        
        if (text.length)
            this._setError(this._getIsInvalid());
    }
    
    _getIsInvalid() {
        return this.params.invalidStrings.some(invalidString => this.entry.text.indexOf(invalidString) != -1);
    }

    _getActor(object) {
        return GS_VERSION < '3.33.0' ? object.actor : object;
    };
});


