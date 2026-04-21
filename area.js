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
/* exported Tool, DrawingArea */

import Cairo from 'cairo';
import System from 'system';

import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';

// This line is not necessary for GNOME 47, but is necessary for GNOME 46 backward compatibility (if variables are used properly elsewhere)
// Old nullish coalescing operator: const Color = Clutter.Color ?? Cogl.Color;
// GNOME 46/47 compatibility: Use ternary operator instead
const Color = Clutter.Color ? Clutter.Color : Cogl.Color;

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Pango from 'gi://Pango';
import PangoCairo from 'gi://PangoCairo';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Screenshot from 'resource:///org/gnome/shell/ui/screenshot.js';

import { gettext as _, pgettext } from 'resource:///org/gnome/shell/extensions/extension.js';

import { CURATED_UUID as UUID } from './utils.js';
import * as Elements from './elements.js'
import { Image } from './files.js'
import * as Menu from './menu.js'

import Meta from 'gi://Meta';

const MOTION_TIME = 1; // ms, time accuracy for free drawing, max is about 33 ms. The lower it is, the smoother the drawing is.
const TEXT_CURSOR_TIME = 600; // ms
const ELEMENT_GRABBER_TIME = 80; // ms, default is about 16 ms
const TOGGLE_ANIMATION_DURATION = 300; // ms
const GRID_TILES_HORIZONTAL_NUMBER = 30;
const COLOR_PICKER_EXTENSION_UUID = 'color-picker@tuberry';

const HIGHLIGHTER_YELLOW = Color.from_string('#ffff00')[1];

const { Shape, StaticColor, TextAlignment, Transformation } = Elements;
const { DisplayStrings } = Menu;

const FontGenericFamilies = ['Sans-Serif', 'Serif', 'Monospace', 'Cursive', 'Fantasy'];
const Manipulation = { MOVE: 100, RESIZE: 101, MIRROR: 102 };
export const Tool = {
    getNameOf: function (value) {
        return Object.keys(this).find(key => this[key] == value);
    },
    ...Shape,
    ...Manipulation
};
Object.defineProperty(Tool, 'getNameOf', { enumerable: false });



// Drawing layers are the proper drawing area widgets (painted thanks to Cairo).
const DrawingLayer = GObject.registerClass({
    GTypeName: `${UUID}-DrawingLayer`,
}, class DrawingArea extends St.DrawingArea {
    _init(repaintFunction, getHasImageFunction) {
        this._repaint = repaintFunction;
        this._getHasImage = getHasImageFunction || (() => false);
        super._init();
    }

    // Bind the size of layers and layer container.
    vfunc_parent_set() {
        this.clear_constraints();

        if (this.get_parent())
            this.add_constraint(new Clutter.BindConstraint({ coordinate: Clutter.BindCoordinate.SIZE, source: this.get_parent() }));
    }

    vfunc_repaint() {
        let cr = this.get_context();

        try {
            this._repaint(cr);
        } catch (e) {
            logError(e, "An error occured while painting");
        }

        cr.$dispose();
        if (this._getHasImage())
            System.gc();
    }
});

// Darwing area is a container that manages drawing elements and drawing layers.
// There is a drawing element for each "brushstroke".
// There is a separated layer for the current element so only the current element is redisplayed when drawing.
// It handles pointer/mouse/(touch?) events and some keyboard events.
export const DrawingArea = GObject.registerClass({
    GTypeName: `${UUID}-DrawingArea`,
    Signals: {
        'show-osd': { param_types: [Gio.Icon.$gtype, GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_DOUBLE, GObject.TYPE_BOOLEAN] },
        'pointer-cursor-changed': { param_types: [GObject.TYPE_STRING] },
        'leave-drawing-mode': {}
    },
}, class DrawingArea extends St.Widget {

    _init(extension, params, monitor, helper, areaManagerUtils, loadPersistent, toolConf) {
        super._init({ style_class: 'draw-on-gnome', name: params.name });
        this._extension = extension;
        this.monitor = monitor;
        this.helper = helper;
        this.areaManagerUtils = areaManagerUtils;

        this.layerContainer = new St.Widget({ width: monitor.width, height: monitor.height });
        this.add_child(this.layerContainer);
        this.add_child(this.helper);

        this.backLayer = new DrawingLayer(this._repaintBack.bind(this), this._getHasImageBack.bind(this));
        this.layerContainer.add_child(this.backLayer);
        this.foreLayer = new DrawingLayer(this._repaintFore.bind(this), this._getHasImageFore.bind(this));
        this.layerContainer.add_child(this.foreLayer);

        this.gridLayer = new DrawingLayer(this._repaintGrid.bind(this));
        this.gridLayer.hide();
        this.gridLayer.opacity = 0;
        this.layerContainer.add_child(this.gridLayer);
        
        // Ruler layer - shows with grid
        this.rulerLayer = new DrawingLayer(this._repaintRulers.bind(this));
        this.rulerLayer.hide();
        this.rulerLayer.opacity = 0;
        this.rulerLayer.reactive = false;  // Clicks pass through
        this.layerContainer.add_child(this.rulerLayer);
        
        // Track mouse position for ruler highlights
        this.rulerMouseX = 0;
        this.rulerMouseY = 0;
        
        // Laser pointer layer and state
        this.laserLayer = new DrawingLayer(this._repaintLaser.bind(this));
        this.laserLayer.hide();
        this.laserLayer.opacity = 0;
        this.laserLayer.reactive = false;  // ADD THIS LINE - allows clicks to pass through
        this.layerContainer.add_child(this.laserLayer);
        
        // Laser pointer state variables
        this.laserPointerActive = false;
        this.laserPointerX = 0;
        this.laserPointerY = 0;
        this.laserTrailPoints = [];
        this.laserTrailMaxLength = 15;
        this.laserAnimationTimeoutId = null;
        this.laserKeyPressed = false;
        
        // Laser pointer state variables
        this.laserPointerActive = false;
        this.laserPointerX = 0;
        this.laserPointerY = 0;
        this.laserTrailPoints = [];
        this.laserTrailMaxLength = 15;
        this.laserAnimationTimeoutId = null;
        this.laserKeyPressed = false;
        this.laserTrailTimeoutId = null;  // ADD THIS LINE
        // End laser pointer code

        this.elements = [];
        
        this.undoneElements = [];
        this.currentElement = null;
        this.currentTool = Shape.NONE;
        if (toolConf["toolPalette"][0] != "") {
            this.currentPalette = toolConf["toolPalette"]
        }
        if (toolConf["toolColor"] != "") {
            this.currentColor = this.getColorFromString(toolConf["toolColor"], "White");
        }
        this.currentImage = null;
        this.currentTextAlignment = Clutter.get_default_text_direction() == Clutter.TextDirection.RTL ? TextAlignment.RIGHT : TextAlignment.LEFT;
        let fontName = St.Settings && St.Settings.get().font_name || this._extension.getSettings('org.gnome.desktop.interface').get_string('font-name');
        this.currentFont = Pango.FontDescription.from_string(fontName);
        this.currentFont.unset_fields(Pango.FontMask.SIZE);
        this.defaultFontFamily = this.currentFont.get_family();
        this.currentLineWidth = toolConf["toolSize"];
        this.currentLineJoin = Cairo.LineJoin.ROUND;
        this.currentLineCap = Cairo.LineCap.ROUND;
        this.currentFillRule = Cairo.FillRule.WINDING;
        this.isSquareArea = false;
        this.hasBackground = false;
        this.textHasCursor = false;
        this.dashedLine = false;
        this.fill = false;

        this.connect('notify::reactive', this._onReactiveChanged.bind(this));
        this.drawingSettingsChangedHandler = this._extension.drawingSettings.connect('changed', this._onDrawingSettingsChanged.bind(this));
        this._onDrawingSettingsChanged();

        if (loadPersistent)
            this._loadPersistent();
    }

    get menu() {
        if (!this._menu)
            this._menu = new Menu.DrawingMenu(this._extension, this, this.monitor, Tool, this.areaManagerUtils);
        return this._menu;
    }

    closeMenu() {
        if (this._menu)
            this._menu.close();
    }

    get isWriting() {
        return this.textEntry;
    }

    get currentTool() {
        return this._currentTool;
    }

    set currentTool(tool) {
        this._currentTool = tool;
        if (this.hasManipulationTool)
            this._startElementGrabber();
        else
            this._stopElementGrabber();
    }

    get currentPalette() {
        return this._currentPalette;
    }

    set currentPalette(palette) {
        this._currentPalette = palette;
        this.colors = palette[1].map(colorString => this.getColorFromString(colorString, 'White'));
        if (!this.colors[0])
            this.colors.push(StaticColor.WHITE);
        this._extension.drawingSettings.set_value("tool-palette", new GLib.Variant('(sas)', palette))
    }

    get currentImage() {
        if (!this._currentImage)
            this._currentImage = this._extension.FILES.IMAGES.getNext(this._currentImage);

        return this._currentImage;
    }

    set currentImage(image) {
        this._currentImage = image;
    }

    get currentFontFamily() {
        return this.currentFont.get_family();
    }

    set currentFontFamily(family) {
        this.currentFont.set_family(family);
    }

    get currentFontStyle() {
        return this.currentFont.get_style();
    }

    set currentFontStyle(style) {
        this.currentFont.set_style(style);
    }

    get currentFontWeight() {
        return this.currentFont.get_weight();
    }

    set currentFontWeight(weight) {
        this.currentFont.set_weight(weight);
    }

    get hasManipulationTool() {
        // No Object.values method in GS 3.24.
        return Object.keys(Manipulation).map(key => Manipulation[key]).indexOf(this.currentTool) != -1;
    }

    // Boolean wrapper for switch menu item.
    get currentEvenodd() {
        return this.currentFillRule == Cairo.FillRule.EVEN_ODD;
    }

    set currentEvenodd(evenodd) {
        this.currentFillRule = evenodd ? Cairo.FillRule.EVEN_ODD : Cairo.FillRule.WINDING;
    }

    get fontFamilies() {
        if (!this._fontFamilies) {
            let otherFontFamilies = Elements.getAllFontFamilies().filter(family => {
                return family != this.defaultFontFamily && FontGenericFamilies.indexOf(family) == -1;
            });
            this._fontFamilies = [this.defaultFontFamily].concat(FontGenericFamilies, otherFontFamilies);
        }
        return this._fontFamilies;
    }

    _onDrawingSettingsChanged() {
        this.palettes = this._extension.drawingSettings.get_value('palettes').deep_unpack();
        if (!this.colors) {
            if (this.palettes[0])
                this.currentPalette = this.palettes[0];
            else
                this.currentPalette = ['Palette', ['White']];
        }
        if (!this.currentColor) {
            this.currentColor = this.colors[0];
            this.currentColorIndex = 0; // Track that we're using the first color
        }

        if (this._extension.drawingSettings.get_boolean('square-area-auto')) {
            this.squareAreaSize = Math.pow(2, 6);
            while (this.squareAreaSize * 2 < Math.min(this.monitor.width, this.monitor.height))
                this.squareAreaSize *= 2;
        } else {
            this.squareAreaSize = this._extension.drawingSettings.get_uint('square-area-size');
        }

        this.areaBackgroundColor = this.getColorFromString(this._extension.drawingSettings.get_string('background-color'), 'Black');

        this.gridColor = this.getColorFromString(this._extension.drawingSettings.get_string('grid-color'), 'Gray');
        if (this._extension.drawingSettings.get_boolean('grid-line-auto')) {
            this.gridLineSpacing = Math.round(this.monitor.width / (5 * GRID_TILES_HORIZONTAL_NUMBER));
            this.gridLineWidth = this.gridLineSpacing / 20;
        } else {
            this.gridLineSpacing = this._extension.drawingSettings.get_uint('grid-line-spacing');
            this.gridLineWidth = Math.round(this._extension.drawingSettings.get_double('grid-line-width') * 100) / 100;
        }

        this.dashOffset = Math.round(this._extension.drawingSettings.get_double('dash-offset') * 100) / 100;
        if (this._extension.drawingSettings.get_boolean('dash-array-auto')) {            
            this.dashArray = [0,0];  
        } else {
            let on = Math.round(this._extension.drawingSettings.get_double('dash-array-on') * 100) / 100;
            let off = Math.round(this._extension.drawingSettings.get_double('dash-array-off') * 100) / 100;
            this.dashArray = [on, off];
        }
    }

    _repaintBack(cr) {
        this.elements.forEach(element => {
            cr.save();
            element.buildCairo(cr, {
                showElementBounds: this.grabbedElement && this.grabbedElement == element,
                drawElementBounds: this.grabPoint ? true : false
            });

            if (this.grabPoint)
                this._searchElementToGrab(cr, element);

            if (element.fill && !element.isStraightLine) {
                cr.fillPreserve();
                if (element.shape == Shape.NONE || element.shape == Shape.LINE)
                    cr.closePath();
            }

            // Don't stroke images - they're already painted
                if (element.shape !== Shape.IMAGE) {
                    cr.stroke();
                }
            element._addMarks(cr);
            cr.restore();

        });

        if (this.currentElement && this.currentElement.eraser) {
            this.currentElement.buildCairo(cr, {
                showTextCursor: this.textHasCursor,
                showElementBounds: this.currentElement.shape != Shape.TEXT || !this.isWriting,
                dummyStroke: this.currentElement.fill && this.currentElement.line.lineWidth == 0
            });
            cr.stroke();
        }
    }

    _repaintFore(cr) {
        if (!this.currentElement || this.currentElement.eraser)
            return;

        this.currentElement.buildCairo(cr, {
            showTextCursor: this.textHasCursor,
            showElementBounds: this.currentElement.shape != Shape.TEXT || !this.isWriting,
            dummyStroke: this.currentElement.fill && this.currentElement.line.lineWidth == 0
        });
        cr.stroke();
    }

    _repaintGrid(cr) {
        if (!this.reactive)
            return;

        cr.setSourceColor(this.gridColor);

        let [gridX, gridY] = [0, 0];
        while (gridX < this.monitor.width / 2) {
            cr.setLineWidth((gridX / this.gridLineSpacing) % 5 ? this.gridLineWidth / 2 : this.gridLineWidth);
            cr.moveTo(this.monitor.width / 2 + gridX, 0);
            cr.lineTo(this.monitor.width / 2 + gridX, this.monitor.height);
            cr.moveTo(this.monitor.width / 2 - gridX, 0);
            cr.lineTo(this.monitor.width / 2 - gridX, this.monitor.height);
            gridX += this.gridLineSpacing;
            cr.stroke();
        }
        while (gridY < this.monitor.height / 2) {
            cr.setLineWidth((gridY / this.gridLineSpacing) % 5 ? this.gridLineWidth / 2 : this.gridLineWidth);
            cr.moveTo(0, this.monitor.height / 2 + gridY);
            cr.lineTo(this.monitor.width, this.monitor.height / 2 + gridY);
            cr.moveTo(0, this.monitor.height / 2 - gridY);
            cr.lineTo(this.monitor.width, this.monitor.height / 2 - gridY);
            gridY += this.gridLineSpacing;
            cr.stroke();
        }
    }

    _repaintRulers(cr) {
        if (!this.reactive || !this.hasGrid)
            return;
        
        const RULER_WIDTH = 40;
        const RULER_OPACITY = 0.7;
        
        // Calculate lighter color (30% lighter than grid)
        let lighterColor = new Color({
            red: Math.min(255, this.gridColor.red + 77),
            green: Math.min(255, this.gridColor.green + 77),
            blue: Math.min(255, this.gridColor.blue + 77),
            alpha: Math.floor(this.gridColor.alpha * RULER_OPACITY)
        });
        
        // Create Pango layout for text
        let layout = this.rulerLayer.create_pango_layout('');
        let fontDesc = Pango.FontDescription.from_string('Sans Bold 9');
        layout.set_font_description(fontDesc);
        
        // === LEFT RULER (Y-axis) ===
        cr.save();
        
        // Draw ruler background
        cr.setSourceRGBA(
            lighterColor.red / 255,
            lighterColor.green / 255,
            lighterColor.blue / 255,
            lighterColor.alpha / 255
        );
        cr.rectangle(0, 0, RULER_WIDTH, this.monitor.height);
        cr.fill();
        
        // Draw Y-axis tick marks
        cr.setSourceColor(this.gridColor);
        let centerY = this.monitor.height / 2;
        let gridUnit = 0;
        let y = 0;
        
        while (y < this.monitor.height / 2) {
            let isMainMark = (gridUnit % 5 === 0);
            cr.setLineWidth(isMainMark ? 2 : 1);
            
            let tickLength = isMainMark ? 12 : 6;
            // Marks above center
            cr.moveTo(RULER_WIDTH - tickLength, centerY - y);
            cr.lineTo(RULER_WIDTH, centerY - y);
            cr.stroke();
            
            // Marks below center
            cr.moveTo(RULER_WIDTH - tickLength, centerY + y);
            cr.lineTo(RULER_WIDTH, centerY + y);
            cr.stroke();
            
            y += this.gridLineSpacing;
            gridUnit++;
        }
        
        // Draw Y-axis numbers (separate pass for proper rendering)
        gridUnit = 0;
        y = 0;
        cr.setSourceRGBA(0.1, 0.1, 0.1, 0.9); // Dark gray text
        
        while (y < this.monitor.height / 2) {
            let isMainMark = (gridUnit % 5 === 0);
            
            if (isMainMark && gridUnit > 0) {
                layout.set_text(String(gridUnit), -1);
                let [textWidth, textHeight] = layout.get_pixel_size();
                
                // Above center
                cr.moveTo(5, centerY - y - textHeight / 2);
                PangoCairo.show_layout(cr, layout);
                
                // Below center
                cr.moveTo(5, centerY + y - textHeight / 2);
                PangoCairo.show_layout(cr, layout);
            }
            
            y += this.gridLineSpacing;
            gridUnit++;
        }
        
        // Highlight current Y position - darker and more visible
        if (this.rulerMouseY >= 0 && this.rulerMouseY <= this.monitor.height) {
            cr.setSourceRGBA(0.2, 0.5, 0.8, 0.6); // Blue highlight, more opaque
            cr.rectangle(0, this.rulerMouseY - 2, RULER_WIDTH, 4);
            cr.fill();
        }
        
        cr.restore();
        
        // === BOTTOM RULER (X-axis) ===
        cr.save();
        
        // Draw ruler background
        cr.setSourceRGBA(
            lighterColor.red / 255,
            lighterColor.green / 255,
            lighterColor.blue / 255,
            lighterColor.alpha / 255
        );
        cr.rectangle(0, this.monitor.height - RULER_WIDTH, this.monitor.width, RULER_WIDTH);
        cr.fill();
        
        // Draw X-axis tick marks
        cr.setSourceColor(this.gridColor);
        let centerX = this.monitor.width / 2;
        gridUnit = 0;
        let x = 0;
        
        while (x < this.monitor.width / 2) {
            let isMainMark = (gridUnit % 5 === 0);
            cr.setLineWidth(isMainMark ? 2 : 1);
            
            let tickLength = isMainMark ? 12 : 6;
            // Marks left of center
            cr.moveTo(centerX - x, this.monitor.height - RULER_WIDTH);
            cr.lineTo(centerX - x, this.monitor.height - RULER_WIDTH + tickLength);
            cr.stroke();
            
            // Marks right of center
            cr.moveTo(centerX + x, this.monitor.height - RULER_WIDTH);
            cr.lineTo(centerX + x, this.monitor.height - RULER_WIDTH + tickLength);
            cr.stroke();
            
            x += this.gridLineSpacing;
            gridUnit++;
        }
        
        // Draw X-axis numbers (separate pass for proper rendering)
        gridUnit = 0;
        x = 0;
        cr.setSourceRGBA(0.1, 0.1, 0.1, 0.9); // Dark gray text
        
        while (x < this.monitor.width / 2) {
            let isMainMark = (gridUnit % 5 === 0);
            
            if (isMainMark && gridUnit > 0) {
                layout.set_text(String(gridUnit), -1);
                let [textWidth, textHeight] = layout.get_pixel_size();
                
                // Left of center
                cr.moveTo(centerX - x - textWidth / 2, this.monitor.height - RULER_WIDTH + 15);
                PangoCairo.show_layout(cr, layout);
                
                // Right of center
                cr.moveTo(centerX + x - textWidth / 2, this.monitor.height - RULER_WIDTH + 15);
                PangoCairo.show_layout(cr, layout);
            }
            
            x += this.gridLineSpacing;
            gridUnit++;
        }
        
        // Highlight current X position - darker and more visible
        if (this.rulerMouseX >= 0 && this.rulerMouseX <= this.monitor.width) {
            cr.setSourceRGBA(0.2, 0.5, 0.8, 0.6); // Blue highlight, more opaque
            cr.rectangle(this.rulerMouseX - 2, this.monitor.height - RULER_WIDTH, 4, RULER_WIDTH);
            cr.fill();
        }
        
        cr.restore();
    }

    // Laser Rendering Method
    _repaintLaser(cr) {
        if (!this.laserPointerActive || this.laserTrailPoints.length === 0)
            return;
        
        // Draw the laser trail with fading opacity
        for (let i = 0; i < this.laserTrailPoints.length; i++) {
            let point = this.laserTrailPoints[i];
            let opacity = (i + 1) / this.laserTrailPoints.length;
            let radius = 8 + (opacity * 4);
            
            cr.setSourceRGBA(1.0, 0.1, 0.1, opacity * 0.7);
            cr.arc(point[0], point[1], radius, 0, 2 * Math.PI);
            cr.fill();
        }
        
        // Draw the main laser pointer
        let mainRadius = 14;
        
        // Outer glow
        let gradient = new Cairo.RadialGradient(
            this.laserPointerX, this.laserPointerY, 0,
            this.laserPointerX, this.laserPointerY, mainRadius * 1.5
        );
        gradient.addColorStopRGBA(0, 1.0, 0.2, 0.2, 0.9);
        gradient.addColorStopRGBA(0.5, 1.0, 0.1, 0.1, 0.6);
        gradient.addColorStopRGBA(1, 1.0, 0.0, 0.0, 0.0);
        
        cr.setSource(gradient);
        cr.arc(this.laserPointerX, this.laserPointerY, mainRadius * 1.5, 0, 2 * Math.PI);
        cr.fill();
        
        // Inner bright core
        cr.setSourceRGBA(1.0, 0.3, 0.3, 0.95);
        cr.arc(this.laserPointerX, this.laserPointerY, mainRadius, 0, 2 * Math.PI);
        cr.fill();
        
        // Central hot spot
        cr.setSourceRGBA(1.0, 0.9, 0.9, 1.0);
        cr.arc(this.laserPointerX, this.laserPointerY, mainRadius * 0.4, 0, 2 * Math.PI);
        cr.fill();
    }

    // End Laser Rendering Method code

    _getHasImageBack() {
        return this.elements.some(element => element.shape == Shape.IMAGE);
    }

    _getHasImageFore() {
        return this.currentElement && this.currentElement.shape == Shape.IMAGE || false;
    }

    _redisplay() {
        // force area to emit 'repaint'
        this.backLayer.queue_repaint();
        this.foreLayer.queue_repaint();
        if (this.hasGrid) {
            this.gridLayer.queue_repaint();
            this.rulerLayer.queue_repaint();
        }
    }

    _transformStagePoint(stageX, stageY) {
        let [s, x, y] = this.transform_stage_point(stageX, stageY);
        if (!s || !this.layerContainer.get_allocation_box().contains(x, y))
            return [false, 0, 0];

        return this.layerContainer.transform_stage_point(stageX, stageY);
    }

    _onButtonPressed(actor, event) {
        if (this.spaceKeyPressed)
            return Clutter.EVENT_PROPAGATE;

        let button = event.get_button();
        let [x, y] = event.get_coords();
        let controlPressed = event.has_control_modifier();
        let shiftPressed = event.has_shift_modifier();

        if (this.currentElement && this.currentElement.shape == Shape.TEXT && this.isWriting)
            // finish writing
            this._stopWriting();

        if (this.helper.visible) {
            // hide helper
            this.toggleHelp();
            return Clutter.EVENT_STOP;
        }

        // Laser Button Press Handling Code

        if (button == 1) {
            if (this.laserPointerActive) {
                this.stopLaserPointer();
            }
            
            if (this.hasManipulationTool) {
                if (this.grabbedElement)
                    this._startTransforming(x, y, controlPressed, shiftPressed);
            } else {
                this._startDrawing(x, y, shiftPressed, (event.get_device ? event.get_device() : null) || event.get_source_device());
            }
            return Clutter.EVENT_STOP;
            // End Laser Button Press Handling Code

        } else if (button == 2) {
            this.switchFill();
        } else if (button == 3) {
            this._stopAll();

            this.menu.open(x, y);
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _onKeyboardPopupMenu() {
        this._stopAll();

        if (this.helper.visible)
            this.toggleHelp();
        this.menu.popup();
        return Clutter.EVENT_STOP;
    }

    // Laser Integration (pressed) - replaced old code

    _onStageKeyPressed(actor, event) {
        if (event.get_key_symbol() == Clutter.KEY_Escape) {
            if (this.laserPointerActive) {
                this.stopLaserPointer();
                return Clutter.EVENT_STOP;
            }
            if (this.helper.visible)
                this.toggleHelp();
            else
                this.emit('leave-drawing-mode');
            return Clutter.EVENT_STOP;
        } else if (event.get_key_symbol() == Clutter.KEY_space) {
            this.spaceKeyPressed = true;
        } else if (event.get_key_symbol() == Clutter.KEY_Alt_R) {
            // Right Alt key for laser pointer
            this.laserKeyPressed = true;
            if (!this.laserPointerActive) {
                let [x, y] = global.get_pointer();
                let [success, localX, localY] = this._transformStagePoint(x, y);
                if (success) {
                    this.startLaserPointer(localX, localY);
                }
            }
        }

        return Clutter.EVENT_PROPAGATE;
    }

    // End Laser Integration (pressed)

    // Laser Integration (released)

    _onStageKeyReleased(actor, event) {
        if (event.get_key_symbol() == Clutter.KEY_space) {
            this.spaceKeyPressed = false;
        } else if (event.get_key_symbol() == Clutter.KEY_Alt_R) {
            this.laserKeyPressed = false;
            if (this.laserPointerActive) {
                this.stopLaserPointer();
            }
        }

        return Clutter.EVENT_PROPAGATE;
    }

    // End Laser Integration (released)

    _onKeyPressed(actor, event) {
        if (event.get_key_symbol() == Clutter.KEY_Escape) {
            if (this.helper.visible) {
                this.toggleHelp();
            } else
                this.emit('leave-drawing-mode');
            return Clutter.EVENT_STOP;
        }

        if (this.currentElement && this.currentElement.shape == Shape.LINE &&
            (event.get_key_symbol() == Clutter.KEY_Return ||
                event.get_key_symbol() == Clutter.KEY_KP_Enter ||
                event.get_key_symbol() == Clutter.KEY_Control_L)) {

            if (this.currentElement.points.length == 2)
                // Translators: %s is a key label
                this.emit('show-osd', this._extension.FILES.ICONS.ARC, _("Press <i>%s</i> to get\na fourth control point")
                    .format(Meta.accelerator_name(0, Clutter.KEY_Return)), "", -1, true);
            this.currentElement.addPoint();
            this.updatePointerCursor(true);
            this._redisplay();
            return Clutter.EVENT_STOP;
        } else if (this.currentElement &&
            (this.currentElement.shape == Shape.POLYGON || this.currentElement.shape == Shape.POLYLINE) &&
            (event.get_key_symbol() == Clutter.KEY_Return || event.get_key_symbol() == Clutter.KEY_KP_Enter)) {

            this.currentElement.addPoint();
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _onScroll(actor, event) {
        if (this.helper.visible)
            return Clutter.EVENT_PROPAGATE;
        let direction = event.get_scroll_direction();
        if (direction == Clutter.ScrollDirection.UP)
            this.incrementLineWidth(1);
        else if (direction == Clutter.ScrollDirection.DOWN)
            this.incrementLineWidth(-1);
        else
            return Clutter.EVENT_PROPAGATE;
        return Clutter.EVENT_STOP;
    }

    _searchElementToGrab(cr, element) {
        if (element.getContainsPoint(cr, this.grabPoint[0], this.grabPoint[1]))
            this.grabbedElement = element;
        else if (this.grabbedElement == element)
            this.grabbedElement = null;

        if (element == this.elements[this.elements.length - 1])
            // All elements have been tested, the winner is the last.
            this.updatePointerCursor();
    }

    _startElementGrabber() {
        if (this.elementGrabberHandler)
            return;

        this.elementGrabberHandler = this.connect('motion-event', (actor, event) => {
            if (this.motionHandler || this.grabbedElementLocked) {
                this.grabPoint = null;
                return;
            }

            // Reduce computing without notable effect.
            if (event.get_time() - (this.elementGrabberTimestamp || 0) < ELEMENT_GRABBER_TIME)
                return;
            this.elementGrabberTimestamp = event.get_time();

            let coords = event.get_coords();
            let [s, x, y] = this._transformStagePoint(coords[0], coords[1]);
            if (!s)
                return;

            this.grabPoint = [x, y];
            this.grabbedElement = null;
            // this._redisplay calls this._searchElementToGrab.
            this._redisplay();
        });
    }

    _stopElementGrabber() {
        if (this.elementGrabberHandler) {
            this.disconnect(this.elementGrabberHandler);
            this.grabPoint = null;
            this.elementGrabberHandler = null;
        }
    }

    _startTransforming(stageX, stageY, controlPressed, duplicate) {
        let [success, startX, startY] = this._transformStagePoint(stageX, stageY);

        if (!success)
            return;

        if (this.currentTool == Manipulation.MIRROR) {
            this.grabbedElementLocked = !this.grabbedElementLocked;
            if (this.grabbedElementLocked) {
                this.updatePointerCursor();
                let label = controlPressed ? _("Mark a point of symmetry") : _("Draw a line of symmetry");
                this.emit('show-osd', this._extension.FILES.ICONS.TOOL_MIRROR, label, "", -1, true);
                return;
            }
        }

        this.grabPoint = null;

        this.buttonReleasedHandler = this.connect('button-release-event', (actor, event) => {
            this._stopTransforming();
        });

        if (duplicate) {
            // deep cloning
            let copy = new this.grabbedElement.constructor(JSON.parse(JSON.stringify(this.grabbedElement)));
            if (this.grabbedElement.color)
                copy.color = this.grabbedElement.color;
            if (this.grabbedElement.font)
                copy.font = this.grabbedElement.font;
            if (this.grabbedElement.image)
                copy.image = this.grabbedElement.image;
            this.elements.push(copy);
            this.grabbedElement = copy;
        }

        let undoable = !duplicate;

        if (this.currentTool == Manipulation.MOVE)
            this.grabbedElement.startTransformation(startX, startY, controlPressed ? Transformation.ROTATION : Transformation.TRANSLATION, undoable);
        else if (this.currentTool == Manipulation.RESIZE)
            this.grabbedElement.startTransformation(startX, startY, controlPressed ? Transformation.STRETCH : Transformation.SCALE_PRESERVE, undoable);
        else if (this.currentTool == Manipulation.MIRROR) {
            this.grabbedElement.startTransformation(startX, startY, controlPressed ? Transformation.INVERSION : Transformation.REFLECTION, undoable);
            this._redisplay();
        }

        // Laser Motion Handling

        this.motionHandler = this.connect('motion-event', (actor, event) => {
            let coords = event.get_coords();
            let [s, x, y] = this._transformStagePoint(coords[0], coords[1]);
            if (!s)
                return;
                        
            if (this.spaceKeyPressed)
                return;

            let controlPressed = event.has_control_modifier();
            this._updateTransforming(x, y, controlPressed);
        });

        // End Laser Motion Handling
    }

    _updateTransforming(x, y, controlPressed) {
        let undoable = this.grabbedElement.lastTransformation.undoable || false;

        if (controlPressed && this.grabbedElement.lastTransformation.type == Transformation.TRANSLATION) {
            this.grabbedElement.stopTransformation();
            this.grabbedElement.startTransformation(x, y, Transformation.ROTATION, undoable);
        } else if (!controlPressed && this.grabbedElement.lastTransformation.type == Transformation.ROTATION) {
            this.grabbedElement.stopTransformation();
            this.grabbedElement.startTransformation(x, y, Transformation.TRANSLATION, undoable);
        }

        if (controlPressed && this.grabbedElement.lastTransformation.type == Transformation.SCALE_PRESERVE) {
            this.grabbedElement.stopTransformation();
            this.grabbedElement.startTransformation(x, y, Transformation.STRETCH, undoable);
        } else if (!controlPressed && this.grabbedElement.lastTransformation.type == Transformation.STRETCH) {
            this.grabbedElement.stopTransformation();
            this.grabbedElement.startTransformation(x, y, Transformation.SCALE_PRESERVE, undoable);
        }

        if (controlPressed && this.grabbedElement.lastTransformation.type == Transformation.REFLECTION) {
            this.grabbedElement.transformations.pop();
            this.grabbedElement.startTransformation(x, y, Transformation.INVERSION, undoable);
        } else if (!controlPressed && this.grabbedElement.lastTransformation.type == Transformation.INVERSION) {
            this.grabbedElement.transformations.pop();
            this.grabbedElement.startTransformation(x, y, Transformation.REFLECTION, undoable);
        }

        this.grabbedElement.updateTransformation(x, y);
        this._redisplay();
    }

    _stopTransforming() {
        if (this.motionHandler) {
            this.disconnect(this.motionHandler);
            this.motionHandler = null;
        }
        if (this.buttonReleasedHandler) {
            this.disconnect(this.buttonReleasedHandler);
            this.buttonReleasedHandler = null;
        }

        this.grabbedElement.stopTransformation();
        this.grabbedElement = null;
        this.grabbedElementLocked = false;
        this._redisplay();
    }

    _startDrawing(stageX, stageY, shiftPressed, clickedDevice) {
        let [success, startX, startY] = this._transformStagePoint(stageX, stageY);

        if (!success)
            return;

        // Handle laser pointer tool
        if (this.currentTool == Shape.LASER) {
            if (!this.laserPointerActive) {
                this.startLaserPointer(startX, startY);
            }
            return; // Don't create a drawing element
        }

        // Start Highlighter section
        // Handle highlighter tool - creates semi-transparent yellow filled rectangles
        if (this.currentTool == Shape.HIGHLIGHTER) {
            this.buttonReleasedHandler = this.connect('button-release-event', (actor, event) => {
                this._stopDrawing();
            });
            
            // Yellow highlighter with 50% transparency
            let highlighterColor = HIGHLIGHTER_YELLOW.copy();
            highlighterColor.alpha = 128;
            
            // Add toJSON method so color saves properly
            highlighterColor.toJSON = function() {
                return this.to_string();
            };
            highlighterColor.toString = function() {
                return this.to_string();
            };
            
            // Use RECTANGLE shape with fill enabled for highlighting
            this.currentElement = new Elements.DrawingElement({
                shape: Shape.RECTANGLE,
                color: highlighterColor,
                eraser: false,
                fill: true,
                fillRule: this.currentFillRule,
                line: { lineWidth: 2,    // ← CHANGED: 2 instead of 0
                        lineJoin: Cairo.LineJoin.ROUND, 
                        lineCap: Cairo.LineCap.ROUND },
                dash: { active: false, array: [0, 0], offset: 0 },
                points: []
            });
            
            this.currentElement.startDrawing(startX, startY);
            
            // Standard motion handler
            if (this.motionHandler) {
                this.disconnect(this.motionHandler);
                this.motionHandler = null;
            }
            
            this.motionHandler = this.connect('motion-event', (actor, event) => {
                let coords = event.get_coords();
                let [s, x, y] = this._transformStagePoint(coords[0], coords[1]);
                if (!s)
                    return;
                
                if (clickedDevice != (event.get_device ? event.get_device() : null) && clickedDevice != event.get_source_device())
                    return Clutter.EVENT_PROPAGATE;

                if (this.spaceKeyPressed)
                    return;

                let controlPressed = event.has_control_modifier();
                this._updateDrawing(x, y, controlPressed);
            });
            
            return;
        }
                
        // } else if (this.currentTool == Shape.HIGHLIGHTER) {
        //     // Highlighter uses yellow color with semi-transparency
        //     let highlighterColor = HIGHLIGHTER_YELLOW.copy();
        //     highlighterColor.alpha = 128; // 50% transparency
            
        //     this.currentElement = new Elements.DrawingElement({
        //         shape: Shape.RECTANGLE,
        //         color: highlighterColor,
        //         eraser: false,
        //         fill: true,  
        //         line: { lineWidth: 2, lineJoin: this.currentLineJoin, lineCap: this.currentLineCap },
        //         points: []
        //     });

            
        // End Highlighter section

        this.buttonReleasedHandler = this.connect('button-release-event', (actor, event) => {
            this._stopDrawing();
        });

        if (this.currentTool == Shape.TEXT) {
            this.currentElement = new Elements.DrawingElement({
                shape: this.currentTool,
                color: this.currentColor,
                eraser: shiftPressed,
                font: this.currentFont.copy(),
                // Translators: initial content of the text area
                text: pgettext("text-area-content", "Text"),
                textAlignment: this.currentTextAlignment,
                points: []
            });  
                
        } else if (this.currentTool == Shape.IMAGE) {
            this.currentElement = new Elements.DrawingElement({
                shape: this.currentTool,
                color: this.currentColor,
                colored: shiftPressed,
                image: this.currentImage,
                points: []
            });
        } else {
            // Calculate dash array dynamically based on line width if in auto mode
            let dashArray = this.dashArray;
            if (this._extension.drawingSettings.get_boolean('dash-array-auto') && this.dashedLine) {
                // Scale dash pattern with line width: dash = 3x width, gap = 2x width
                let dashLength = Math.max(this.currentLineWidth * 3, 8);
                let gapLength = Math.max(this.currentLineWidth * 2, 4);
                // alternative formula for larger gaps: * 2,6, * 2,6
                dashArray = [dashLength, gapLength];
            }
            
            this.currentElement = new Elements.DrawingElement({
                shape: this.currentTool,
                color: this.currentColor,
                eraser: shiftPressed,
                fill: this.fill,
                fillRule: this.currentFillRule,
                line: { lineWidth: this.currentLineWidth, 
                        lineJoin: this.currentLineJoin, 
                        lineCap: this.currentLineCap },
                dash: { active: this.dashedLine, 
                        array: dashArray, 
                        offset: this.dashOffset },
                points: []
            });
        }

        this.currentElement.startDrawing(startX, startY);

        if (this.currentTool == Shape.POLYGON || this.currentTool == Shape.POLYLINE) {
            let icon = this._extension.FILES.ICONS[this.currentTool == Shape.POLYGON ? 'TOOL_POLYGON' : 'TOOL_POLYLINE'];
            // Translators: %s is a key label
            this.emit('show-osd', icon, _("Press <i>%s</i> to mark vertices")
                .format(Meta.accelerator_name(0, Clutter.KEY_Return)), "", -1, true);
        }
        // Wayland supports two cursors so its important to disconnect motionhandler to avoid broken two cursors drawing
        if (this.motionHandler) {
            this.disconnect(this.motionHandler);
            this.motionHandler = null;
        }

        // Laser Motion Handling

        this.motionHandler = this.connect('motion-event', (actor, event) => {
            let coords = event.get_coords();
            let [s, x, y] = this._transformStagePoint(coords[0], coords[1]);
            if (!s)
                return;
            
            // To avoid painting due to the wrong device (2 cursors wayland support)
            //Modified for GNOME 46/47 support
            if (clickedDevice != (event.get_device ? event.get_device() : null) && clickedDevice != event.get_source_device())
                return Clutter.EVENT_PROPAGATE;            

            if (this.spaceKeyPressed)
                return;

            let controlPressed = event.has_control_modifier();
            this._updateDrawing(x, y, controlPressed);

        });

        // End Laser Motion Handling
    }

    _updateDrawing(x, y, controlPressed) {
        if (!this.currentElement)
            return;

        this.currentElement.updateDrawing(x, y, controlPressed);

        if (this.currentElement.eraser)
            this._redisplay();
        else
            this.foreLayer.queue_repaint();
        this.updatePointerCursor(controlPressed);
    }

    _stopDrawing() {
        if (this.motionHandler) {
            this.disconnect(this.motionHandler);
            this.motionHandler = null;
        }
        if (this.buttonReleasedHandler) {
            this.disconnect(this.buttonReleasedHandler);
            this.buttonReleasedHandler = null;
        }

        // skip when a polygon has not at least 3 points
        if (this.currentElement && this.currentElement.shape == Shape.POLYGON && this.currentElement.points.length < 3)
            this.currentElement = null;

        if (this.currentElement)
            this.currentElement.stopDrawing();

        if (this.currentElement && this.currentElement.points.length >= 2) {
            if (this.currentElement.shape == Shape.TEXT && !this.isWriting) {
                this._startWriting();
                return;
            }

        // For images, use original size instead of drag size
        if (this.currentElement && this.currentElement.shape == Shape.IMAGE && this.currentElement.points.length >= 1) {
            let pixbuf = this.currentElement.image.getPixbuf(this.currentElement.colored ? this.currentElement.color.toJSON() : null);
            let [startX, startY] = this.currentElement.points[0];
            // Place image at click point with original dimensions
            this.currentElement.points[1] = [startX + pixbuf.get_width(), startY + pixbuf.get_height()];
            this.currentElement.preserveAspectRatio = true;
        }

            this.elements.push(this.currentElement);
        }

        this.currentElement = null;
        this._redisplay();
        this.updatePointerCursor();
    }

    _startWriting() {
        let [stageX, stageY] = this.get_transformed_position();
        let [x, y] = [this.currentElement.x, this.currentElement.y];
        this.currentElement.text = '';
        this.currentElement.cursorPosition = 0;
        // Translators: %s is a key label
        this.emit('show-osd', this._extension.FILES.ICONS.TOOL_TEXT, _("Press <i>%s</i>\nto start a new line")
            .format(Meta.accelerator_name(0, Clutter.KEY_Return)), "", -1, true);
        this._updateTextCursorTimeout();
        this.textHasCursor = true;
        this._redisplay();

        // Do not hide and do not set opacity to 0 because:
        // 1. ibusCandidatePopup need a mapped text entry to init correctly its position.
        // 2. 'cursor-changed' signal is no emitted if the text entry is not visible.
        this.textEntry = new St.Entry({ opacity: 1, x: stageX + x, y: stageY + y });
        this.insert_child_below(this.textEntry, null);
        this.textEntry.grab_key_focus();
        this.updatePointerCursor();

        let ibusCandidatePopup = Main.layoutManager.uiGroup.get_children().find(child =>
            child.has_style_class_name && child.has_style_class_name('candidate-popup-boxpointer'));
        if (ibusCandidatePopup) {
            this.ibusHandler = ibusCandidatePopup.connect('notify::visible', () => {
                if (ibusCandidatePopup.visible) {
                    this.set_child_above_sibling(this.textEntry, null);
                    this.textEntry.opacity = 255;
                }
            });
            this.textEntry.connect('destroy', () => ibusCandidatePopup.disconnect(this.ibusHandler));
        }

        this.textEntry.clutterText.set_single_line_mode(false);
        this.textEntry.clutterText.set_activatable(false);

        let showCursorOnPositionChanged = true;
        this.textEntry.clutterText.connect('text-changed', clutterText => {
            this.textEntry.y = stageY + y + (this.textEntry.clutterText.get_layout().get_line_count() - 1) * this.currentElement.height;
            this.currentElement.text = clutterText.text;
            showCursorOnPositionChanged = false;
            this._redisplay();
        });

        this.textEntry.clutterText.connect('cursor-changed', clutterText => {
            this.currentElement.cursorPosition = clutterText.cursorPosition;
            this._updateTextCursorTimeout();
            let cursorPosition = clutterText.cursorPosition == -1 ? clutterText.text.length : clutterText.cursorPosition;
            this.textHasCursor = showCursorOnPositionChanged || GLib.unichar_isspace(clutterText.text.charAt(cursorPosition - 1));
            showCursorOnPositionChanged = true;
            this._redisplay();
        });

        this.textEntry.clutterText.connect('key-press-event', (clutterText, event) => {
            if (event.get_key_symbol() == Clutter.KEY_Escape) {
                this._stopWriting();
                return Clutter.EVENT_STOP;
            }

            return Clutter.EVENT_PROPAGATE;
        });
    }

    _stopWriting() {
        if (this.currentElement.text.length > 0)
            this.elements.push(this.currentElement);

        this.currentElement = null;
        this._stopTextCursorTimeout();
        
        // Store textEntry reference before destroying
        const textEntry = this.textEntry;
        delete this.textEntry;
        
        // Defer focus grab to avoid GNOME Shell 48.3/48.4 crash
        // This ensures the text entry is fully destroyed before regaining focus
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            // Version-compatible check: is_finalized() doesn't exist in all GNOME versions
            // Check if widget still exists and hasn't been destroyed
            try {
                if (textEntry && textEntry.get_stage()) {
                    // Widget still has a stage, safe to destroy
                    textEntry.destroy();
                }
            } catch (e) {
                // Widget already destroyed or finalized, ignore
            }
            
            // Only grab focus if the area is still reactive
            if (this.reactive) {
                this.grab_key_focus();
            }
            
            this.updatePointerCursor();
            this._redisplay();
            
            return GLib.SOURCE_REMOVE;
        });
    }

    setPointerCursor(pointerCursorName) {
        if (!this.currentPointerCursorName || this.currentPointerCursorName != pointerCursorName) {
            this.currentPointerCursorName = pointerCursorName;
            this.emit('pointer-cursor-changed', pointerCursorName);
        }
    }

    //Modifying MOVE_OR_RESIZE_WINDOW, to MOVE, both now function. //check in future versions of GNOME.
    updatePointerCursor(controlPressed) {
        // Laser cursor handling
        
        if (this.laserPointerActive) {
            this.setPointerCursor('CROSSHAIR');
            return;
        }
        // End laser cursor handling

        if (this.currentTool == Manipulation.MIRROR && this.grabbedElementLocked)
            this.setPointerCursor('CROSSHAIR');
        else if (this.hasManipulationTool)
            this.setPointerCursor(this.grabbedElement ? 'MOVE' : 'DEFAULT');
        else if (this.currentElement && this.currentElement.shape == Shape.TEXT && this.isWriting)
            this.setPointerCursor('TEXT');
        else if (!this.currentElement)
            this.setPointerCursor(this.currentTool == Shape.NONE ? 'POINTER' : 'CROSSHAIR');
        else if (this.currentElement.shape != Shape.NONE && controlPressed)
            this.setPointerCursor('MOVE');
    }

    initPointerCursor() {
        this.currentPointerCursorName = null;
        this.updatePointerCursor();
    }

    _stopTextCursorTimeout() {
        if (this.textCursorTimeoutId) {
            GLib.source_remove(this.textCursorTimeoutId);
            this.textCursorTimeoutId = null;
        }
        this.textHasCursor = false;
    }

    _updateTextCursorTimeout() {
        this._stopTextCursorTimeout();
        this.textCursorTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TEXT_CURSOR_TIME, () => {
            this.textHasCursor = !this.textHasCursor;
            this._redisplay();
            return GLib.SOURCE_CONTINUE;
        });
    }

    // A priori there is nothing to stop, except transformations, if there is no current element.
    // 'force' argument is passed when leaving drawing mode to ensure all is clean, as a workaround for possible bugs.
    _stopAll(force) {
        // Stop laser if active
        if (this.laserPointerActive) {
            this.stopLaserPointer();
            // Also switch away from laser tool so motion doesn't restart it
            if (this.currentTool === Shape.LASER) {
                this.currentTool = this.previousTool || Shape.NONE;
            }
        }
        // End laser stop method mods

        if (this.grabbedElement) {
            this._stopTransforming();
            this.grabbedElement = null;
            this.grabbedElementLocked = null;
            this.updatePointerCursor();
        }

        if (!this.currentElement && !force)
            return;

        if (this.isWriting)
            this._stopWriting();

        this._stopDrawing();
    }

    erase() {
        this.deleteLastElement();
        this.elements = [];
        this.undoneElements = [];
        this._redisplay();
    }

    deleteLastElement() {
        this._stopAll();
        this.elements.pop();

        if (this.elements.length)
            this.elements[this.elements.length - 1].resetUndoneTransformations();

        this._redisplay();
    }

    undo() {
        if (!this.elements.length)
            return;

        let success = this.elements[this.elements.length - 1].undoTransformation();
        if (!success) {
            this.undoneElements.push(this.elements.pop());
            if (this.elements.length)
                this.elements[this.elements.length - 1].resetUndoneTransformations();
        }

        this._redisplay();
    }

    redo() {
        let success = false;

        if (this.elements.length)
            success = this.elements[this.elements.length - 1].redoTransformation();

        if (!success && this.undoneElements.length > 0)
            this.elements.push(this.undoneElements.pop());

        this._redisplay();
    }

    smoothLastElement() {
        if (this.elements.length > 0 && this.elements[this.elements.length - 1].shape == Shape.NONE) {
            this.elements[this.elements.length - 1].smoothAll();
            this._redisplay();
        }
    }

    toggleBackground() {
        this.hasBackground = !this.hasBackground;
        let backgroundColor = this.hasBackground ? this.areaBackgroundColor : StaticColor.TRANSPARENT;

        if (this.ease) {
            this.remove_all_transitions();
            this.ease({
                backgroundColor,
                duration: TOGGLE_ANIMATION_DURATION,
                transition: Clutter.AnimationMode.EASE_IN_OUT_QUAD
            });
        } else {
            this.set_background_color(backgroundColor);
        }
    }

    get hasGrid() {
        return this.gridLayer.visible;
    }

    toggleGrid() {
        // The grid layer is repainted when the visibility changes.
        if (this.gridLayer.ease) {
            this.gridLayer.remove_all_transitions();
            this.rulerLayer.remove_all_transitions();
            let visible = !this.gridLayer.visible;
            
            this.gridLayer.visible = true;
            this.rulerLayer.visible = true;
            
            this.gridLayer.ease({
                opacity: visible ? 255 : 0,
                duration: TOGGLE_ANIMATION_DURATION,
                transition: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
                onStopped: () => this.gridLayer.visible = visible
            });
            
            this.rulerLayer.ease({
                opacity: visible ? 255 : 0,
                duration: TOGGLE_ANIMATION_DURATION,
                transition: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
                onStopped: () => this.rulerLayer.visible = visible
            });
        } else {
            this.gridLayer.visible = !this.gridLayer.visible;
            this.rulerLayer.visible = !this.rulerLayer.visible;
        }
    }

    toggleSquareArea() {
        this.isSquareArea = !this.isSquareArea;
        let x, y, width, height, onComplete;

        if (this.isSquareArea) {
            this.layerContainer.add_style_class_name('draw-on-gnome-square-area');
            [x, y] = [(this.monitor.width - this.squareAreaSize) / 2, (this.monitor.height - this.squareAreaSize) / 2];
            width = height = this.squareAreaSize;
            onComplete = () => { };
        } else {
            x = y = 0;
            [width, height] = [this.monitor.width, this.monitor.height];
            onComplete = () => this.layerContainer.remove_style_class_name('draw-on-gnome-square-area');
        }

        if (this.layerContainer.ease) {
            this.layerContainer.remove_all_transitions();
            this.layerContainer.ease({
                x, y, width, height, onComplete,
                duration: TOGGLE_ANIMATION_DURATION,
                transition: Clutter.AnimationMode.EASE_OUT_QUAD
            });
        } else {
            this.layerContainer.set_position(x, y);
            this.layerContainer.set_size(width, height);
            onComplete();
        }
    }

    selectColor(index) {
        if (!this.colors[index])
            return;

        this.currentColorIndex = index; // Track which index is selected
        this.currentColor = this.colors[index];
        this._extension.drawingSettings.set_string("tool-color", this.colors[index].to_string());
        if (this.currentElement) {
            this.currentElement.color = this.currentColor;
            this._redisplay();
        }
        
        // Use light background for Ctrl+9 (index 8) to make dark colors readable
        let osdBackground = (index === 8) ? '#deddda' : this.currentColor.to_string().slice(0, 7);
        
        // Foreground color markup is not displayed since 3.36, use style instead but the transparency is lost.
        this.emit('show-osd', this._extension.FILES.ICONS.COLOR, String(this.currentColor), osdBackground, -1, false);
    }

    selectTool(tool) {
        this.currentTool = tool;
        this.emit('show-osd', this._extension.FILES.ICONS[`TOOL_${Tool.getNameOf(tool)}`] || null, DisplayStrings.Tool[tool], "", -1, false);
        this.updatePointerCursor();
    }

    // Laser Control Methods
    startLaserPointer(x, y) {
        if (this.laserPointerActive)
            return;
        
        this.laserPointerActive = true;
        this.laserPointerX = x;
        this.laserPointerY = y;
        this.laserTrailPoints = [[x, y]];
        
        this.laserLayer.show();
        this.laserLayer.ease({
            opacity: 255,
            duration: 100,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD
        });
        
        this._startLaserAnimation();
        this.setPointerCursor('NONE');
        
        if (!this._laserPointerShownOnce) {
            this._laserPointerShownOnce = true;
            this.emit('show-osd', this._extension.FILES.ICONS.TOOL_ARROW, 
                      _("Laser Pointer Active"), 
                      _("Release Shift to deactivate"), -1, true);
        }
    }

    updateLaserPointer(x, y) {
        if (!this.laserPointerActive)
            return;
        
        this.laserPointerX = x;
        this.laserPointerY = y;
        
        this.laserTrailPoints.push([x, y]);
        
        if (this.laserTrailPoints.length > this.laserTrailMaxLength) {
            this.laserTrailPoints.shift();
        }
        
        // Clear any existing timeout
        if (this.laserTrailTimeoutId) {
            GLib.source_remove(this.laserTrailTimeoutId);
            this.laserTrailTimeoutId = null;
        }
        
        // Set new timeout to clear trail after 100ms of no movement
        // Might need to lower this to 50 ms, need to test more...
        this.laserTrailTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            if (this.laserPointerActive) {
                // Fade out the trail by removing points
                if (this.laserTrailPoints.length > 1) {
                    // Remove half the trail points for fade effect
                    let removeCount = Math.ceil(this.laserTrailPoints.length / 2);
                    this.laserTrailPoints.splice(0, removeCount);
                    return GLib.SOURCE_CONTINUE; // Keep running to fade more
                } else {
                    // Clear all trail points
                    this.laserTrailPoints = [[this.laserPointerX, this.laserPointerY]];
                }
            }
            this.laserTrailTimeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    stopLaserPointer() {
        if (!this.laserPointerActive)
            return;
        
        this.laserPointerActive = false;
        this._stopLaserAnimation();
        
        // Clean up trail timeout - ADD THESE LINES
        if (this.laserTrailTimeoutId) {
            GLib.source_remove(this.laserTrailTimeoutId);
            this.laserTrailTimeoutId = null;
        }
        
        this.laserLayer.ease({
            opacity: 0,
            duration: 200,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                this.laserLayer.hide();
                this.laserTrailPoints = [];
            }
        });
        
        this.updatePointerCursor();
    }

    _startLaserAnimation() {
        if (this.laserAnimationTimeoutId)
            return;
        
        this.laserAnimationTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
            if (this.laserPointerActive) {
                this.laserLayer.queue_repaint();
                return GLib.SOURCE_CONTINUE;
            }
            this.laserAnimationTimeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    _stopLaserAnimation() {
        if (this.laserAnimationTimeoutId) {
            GLib.source_remove(this.laserAnimationTimeoutId);
            this.laserAnimationTimeoutId = null;
        }
    }

    // End Laser Control Methods

    switchFill() {
        this.fill = !this.fill;
        let icon = this._extension.FILES.ICONS[this.fill ? 'FILL' : 'STROKE'];
        this.emit('show-osd', icon, DisplayStrings.getFill(this.fill), "", -1, false);
    }

    switchFillRule() {
        this.currentFillRule = this.currentFillRule == 1 ? 0 : this.currentFillRule + 1;
        let icon = this._extension.FILES.ICONS[this.currentEvenodd ? 'FILLRULE_EVENODD' : 'FILLRULE_NONZERO'];
        this.emit('show-osd', icon, DisplayStrings.FillRule[this.currentFillRule], "", -1, false);
    }

    switchColorPalette(reverse) {
        // Find current palette by name (not reference) since palette may come from saved config
        let currentPaletteName = this.currentPalette[0];
        let index = this.palettes.findIndex(p => p[0] === currentPaletteName);
        
        // If not found, default to first palette
        if (index === -1) {
            index = 0;
        }
        
        if (reverse)
            this.currentPalette = index <= 0 ? this.palettes[this.palettes.length - 1] : this.palettes[index - 1];
        else
            this.currentPalette = index == this.palettes.length - 1 ? this.palettes[0] : this.palettes[index + 1];
        
        // Preserve the color index when switching palettes
        // If we had a color selected (e.g. Ctrl+1), select the same index in the new palette
        if (this.currentColorIndex !== undefined && this.colors[this.currentColorIndex]) {
            this.currentColor = this.colors[this.currentColorIndex];
            this._extension.drawingSettings.set_string("tool-color", this.colors[this.currentColorIndex].to_string());
            if (this.currentElement) {
                this.currentElement.color = this.currentColor;
                this._redisplay();
            }
        }
        
        this.emit('show-osd', this._extension.FILES.ICONS.PALETTE, this.currentPalette[0], "", -1, false);
    }

    switchDash() {
        this.dashedLine = !this.dashedLine;        
        let icon = this._extension.FILES.ICONS[this.dashedLine ? 'DASHED_LINE' : 'FULL_LINE'];
        this.emit('show-osd', icon, DisplayStrings.getDashedLine(this.dashedLine), "", -1, false);
    }

    incrementLineWidth(increment) {
        this.currentLineWidth = Math.max(this.currentLineWidth + increment, 1);
        this.emit('show-osd', null, DisplayStrings.getPixels(this.currentLineWidth), "", 2 * this.currentLineWidth, false);
        this._extension.drawingSettings.set_int("tool-size", this.currentLineWidth)
    }

    switchLineJoin() {
        this.currentLineJoin = this.currentLineJoin == 2 ? 0 : this.currentLineJoin + 1;
        this.emit('show-osd', this._extension.FILES.ICONS.LINEJOIN, DisplayStrings.LineJoin[this.currentLineJoin], "", -1, false);
    }

    switchLineCap() {
        this.currentLineCap = this.currentLineCap == 2 ? 0 : this.currentLineCap + 1;
        this.emit('show-osd', this._extension.FILES.ICONS.LINECAP, DisplayStrings.LineCap[this.currentLineCap], "", -1, false);
    }

    switchFontWeight() {
        let fontWeights = Object.keys(DisplayStrings.FontWeight).map(key => Number(key));
        let index = fontWeights.indexOf(this.currentFontWeight);
        this.currentFontWeight = index == fontWeights.length - 1 ? fontWeights[0] : fontWeights[index + 1];
        if (this.currentElement && this.currentElement.font) {
            this.currentElement.font.set_weight(this.currentFontWeight);
            this._redisplay();
        }
        this.emit('show-osd', this._extension.FILES.ICONS.FONT_WEIGHT, `<span font_weight="${this.currentFontWeight}">` +
            `${DisplayStrings.FontWeight[this.currentFontWeight]}</span>`, "", -1, false);
    }

    switchFontStyle() {
        this.currentFontStyle = this.currentFontStyle == 2 ? 0 : this.currentFontStyle + 1;
        if (this.currentElement && this.currentElement.font) {
            this.currentElement.font.set_style(this.currentFontStyle);
            this._redisplay();
        }
        this.emit('show-osd', this._extension.FILES.ICONS.FONT_STYLE, `<span font_style="${DisplayStrings.FontStyleMarkup[this.currentFontStyle]}">` +
            `${DisplayStrings.FontStyle[this.currentFontStyle]}</span>`, "", -1, false);
    }

    switchFontFamily(reverse) {
        let index = Math.max(0, this.fontFamilies.indexOf(this.currentFontFamily));
        if (reverse)
            this.currentFontFamily = (index == 0) ? this.fontFamilies[this.fontFamilies.length - 1] : this.fontFamilies[index - 1];
        else
            this.currentFontFamily = (index == this.fontFamilies.length - 1) ? this.fontFamilies[0] : this.fontFamilies[index + 1];
        if (this.currentElement && this.currentElement.font) {
            this.currentElement.font.set_family(this.currentFontFamily);
            this._redisplay();
        }
        this.emit('show-osd', this._extension.FILES.ICONS.FONT_FAMILY, `<span font_family="${this.currentFontFamily}">${DisplayStrings.getFontFamily(this.currentFontFamily)}</span>`, "", -1, false);
    }

    switchTextAlignment() {
        this.currentTextAlignment = this.currentTextAlignment == 2 ? 0 : this.currentTextAlignment + 1;
        if (this.currentElement && this.currentElement.textAlignment != this.currentTextAlignment) {
            this.currentElement.textAlignment = this.currentTextAlignment;
            this._redisplay();
        }
        let icon = this._extension.FILES.ICONS[this.currentTextAlignment == TextAlignment.RIGHT ? 'RIGHT_ALIGNED' : this.currentTextAlignment == TextAlignment.CENTER ? 'CENTERED' : 'LEFT_ALIGNED'];
        this.emit('show-osd', icon, DisplayStrings.TextAlignment[this.currentTextAlignment], "", -1, false);
    }

    switchImageFile(reverse) {
        this.currentImage = this._extension.FILES.IMAGES[reverse ? 'getPrevious' : 'getNext'](this.currentImage);
        if (this.currentImage)
            this.emit('show-osd', this.currentImage.gicon, this.currentImage.toString(), "", -1, false);
    }

    pasteImageFiles() {
        this._extension.FILES.IMAGES.addImagesFromClipboard(lastImage => {
            this.currentImage = lastImage;
            this.currentTool = Shape.IMAGE;
            this.updatePointerCursor();
            this.emit('show-osd', this.currentImage.gicon, this.currentImage.toString(), "", -1, false);
        });
    }

    _onColorPicked(color) {
        if (color instanceof Color)
            color = color.to_string().slice(0, -2);

        this.currentColor = this.getColorFromString(color);
        this._extension.drawingSettings.set_string("tool-color", color);
        if (this.currentElement) {
            this.currentElement.color = this.currentColor;
            this._redisplay();
        }
        this.emit('show-osd', this._extension.FILES.ICONS.COLOR, String(this.currentColor), this.currentColor.to_string().slice(0, 7), -1, false);
        this.initPointerCursor();

        if (this._extension.settings.get_boolean("copy-picked-hex")) {
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, color);
        }
    }

    pickColor() {
        if (!Screenshot.PickPixel)
            // GS 3.28-
            return;

        // Translators: It is displayed in an OSD notification to ask the user to start picking, so it should use the imperative mood.
        this.emit('show-osd', this._extension.FILES.ICONS.COLOR_PICKER, pgettext("osd-notification", "Pick a color"), "", -1, false);

        let extension = Main.extensionManager && Main.extensionManager.lookup(COLOR_PICKER_EXTENSION_UUID);
        if (extension && extension.state == ExtensionUtils.ExtensionState.ENABLED && extension.stateObj && extension.stateObj.pickAsync) {
            extension.stateObj.pickAsync().then(result => {
                if (typeof result == 'string')
                    this._onColorPicked(result);
                else
                    this.initPointerCursor();
            }).catch(e => {
                this.initPointerCursor();
            });

            return;
        }

        try {
            let screenshot = new Shell.Screenshot();
            let pickPixel = new Screenshot.PickPixel(screenshot);

            if (pickPixel.pickAsync) {
                pickPixel.pickAsync().then(result => {
                    if (result instanceof Color) {
                        // GS 3.38+
                        this._onColorPicked(result);
                    } else {
                        // GS 3.36
                        let graphenePoint = result;
                        screenshot.pick_color(graphenePoint.x, graphenePoint.y, (o, res) => {
                            let [, color] = screenshot.pick_color_finish(res);
                            this._onColorPicked(color);
                        });
                    }
                }).catch(() => this.initPointerCursor());
            } else {
                // GS 3.34-
                pickPixel.show();
                pickPixel.connect('finished', (pickPixel, coords) => {
                    if (coords)
                        screenshot.pick_color(...coords, (o, res) => {
                            let [, color] = screenshot.pick_color_finish(res);
                            this._onColorPicked(color);
                        });
                    else
                        this.initPointerCursor();
                });
            }
        } catch (e) {
            console.error(`${this._extension.metadata.uuid}: color picker failed: ${e.message}`);
            this.initPointerCursor();
        }
    }

    toggleHelp() {
        if (this.helper.visible) {
            this.helper.hideHelp();
            if (this.textEntry)
                this.textEntry.grab_key_focus();
        } else {
            this.helper.showHelp();
            this.grab_key_focus();
        }
    }

    // The area is reactive when it is modal.
    _onReactiveChanged() {
        if (this.hasGrid)
            this._redisplay();
        if (this.helper.visible)
            this.toggleHelp();
        if (this.textEntry && this.reactive)
            this.textEntry.grab_key_focus();

        if (this.reactive) {
            this.stageKeyPressedHandler = global.stage.connect('key-press-event', this._onStageKeyPressed.bind(this));
            this.stageKeyReleasedHandler = global.stage.connect('key-release-event', this._onStageKeyReleased.bind(this));
        } else {
            if (this.stageKeyPressedHandler) {
                global.stage.disconnect(this.stageKeyPressedHandler);
                this.stageKeyPressedHandler = null;
            }
            if (this.stageKeyReleasedHandler) {
                global.stage.disconnect(this.stageKeyReleasedHandler);
                this.stageKeyReleasedHandler = null;
            }
            this.spaceKeyPressed = false;
            this.laserKeyPressed = false;
        }
    }

    // New Laser Method
    _onLaserMotion(actor, event) {
        // Update ruler mouse position tracking
        let coords = event.get_coords();
        let [success, x, y] = this._transformStagePoint(coords[0], coords[1]);
        
        if (success && this.hasGrid && this.rulerLayer.visible) {
            this.rulerMouseX = x;
            this.rulerMouseY = y;
            this.rulerLayer.queue_repaint();
        }
        
        if (this.currentTool == Shape.LASER) {
            if (success) {
                if (!this.laserPointerActive) {
                    this.startLaserPointer(x, y);
                } else {
                    this.updateLaserPointer(x, y);
                }
                return Clutter.EVENT_STOP;
            }
        }
        
        return Clutter.EVENT_PROPAGATE;
    }



    destroy() {
        this.textCursorTimeoutId = null;
        this._stopAll(true);

        // Clean up laser pointer
        if (this.laserAnimationTimeoutId) {
            GLib.source_remove(this.laserAnimationTimeoutId);
            this.laserAnimationTimeoutId = null;
        }
        if (this.laserTrailTimeoutId) {
            GLib.source_remove(this.laserTrailTimeoutId);
            this.laserTrailTimeoutId = null;
        }
        this.laserLayer = null;
        
        // Clean up rulers
        this.rulerLayer = null;
        // End laser pointer cleanup

        this._extension.drawingSettings.disconnect(this.drawingSettingsChangedHandler);
        this.erase();
        if (this._menu)
            this._menu.disable();
        delete this.areaManagerUtils;
        
        super.destroy();
    }

    enterDrawingMode() {
        this.keyPressedHandler = this.connect('key-press-event', this._onKeyPressed.bind(this));
        this.buttonPressedHandler = this.connect('button-press-event', this._onButtonPressed.bind(this));
        this.keyboardPopupMenuHandler = this.connect('popup-menu', this._onKeyboardPopupMenu.bind(this));
        this.scrollHandler = this.connect('scroll-event', this._onScroll.bind(this));
        
        // Add dedicated motion handler for laser pointer
        this.laserMotionHandler = this.connect('motion-event', this._onLaserMotion.bind(this));
        
        this.set_background_color(this.reactive && this.hasBackground ? this.areaBackgroundColor : null);
    }

    leaveDrawingMode(save, erase) {
        if (this.keyPressedHandler) {
            this.disconnect(this.keyPressedHandler);
            this.keyPressedHandler = null;
        }
        if (this.buttonPressedHandler) {
            this.disconnect(this.buttonPressedHandler);
            this.buttonPressedHandler = null;
        }
        if (this.keyboardPopupMenuHandler) {
            this.disconnect(this.keyboardPopupMenuHandler);
            this.keyboardPopupMenuHandler = null;
        }
        if (this.scrollHandler) {
            this.disconnect(this.scrollHandler);
            this.scrollHandler = null;
        }
        // More laser motion handling
        if (this.laserMotionHandler) {
            this.disconnect(this.laserMotionHandler);
            this.laserMotionHandler = null;
        }
        // Clean up laser pointer
        if (this.laserPointerActive) {
            this.stopLaserPointer();
        }
        if (this.laserAnimationTimeoutId) {
            GLib.source_remove(this.laserAnimationTimeoutId);
            this.laserAnimationTimeoutId = null;
        }

        this._stopAll(true);

        if (erase)
            this.erase();

        this.closeMenu();
        this.set_background_color(null);
        this._extension.FILES.IMAGES.reset();
        if (save)
            this.savePersistent();
    }

    // Used by the menu.
    getSvgContentsForJson(json) {
        let elements = [];
        let elementsContent = '';

        elements.push(...JSON.parse(json.contents).map(object => {
            if (object.color)
                object.color = this.getColorFromString(object.color, 'White');
            if (object.font && typeof object.font == 'string')
                object.font = Pango.FontDescription.from_string(object.font);
            if (object.image)
                object.image = new Image(object.image);
            return new Elements.DrawingElement(object);
        }));
        elements.forEach(element => elementsContent += element.buildSVG('transparent'));

        let prefixes = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';

        let getGiconSvgContent = () => {
            let size = Math.min(this.monitor.width, this.monitor.height);
            let [x, y] = [(this.monitor.width - size) / 2, (this.monitor.height - size) / 2];
            return `<svg viewBox="${x} ${y} ${size} ${size}" ${prefixes}>${elementsContent}\n</svg>`;
        };

        let getImageSvgContent = () => {
            return `<svg viewBox="0 0 ${this.layerContainer.width} ${this.layerContainer.height}" ${prefixes}>${elementsContent}\n</svg>`;
        };

        return [getGiconSvgContent, getImageSvgContent];
    }

    exportToSvg() {
        this._stopAll();

        let prefixes = 'xmlns="http://www.w3.org/2000/svg"';
        if (this.elements.some(element => element.shape == Shape.IMAGE))
            prefixes += ' xmlns:xlink="http://www.w3.org/1999/xlink"';
        let content = `<svg viewBox="0 0 ${this.layerContainer.width} ${this.layerContainer.height}" ${prefixes}>`;
        let backgroundColorString = this.hasBackground ? String(this.areaBackgroundColor) : 'transparent';
        if (backgroundColorString != 'transparent')
            content += `\n  <rect id="background" width="100%" height="100%" fill="${backgroundColorString}"/>`;
        this.elements.forEach(element => content += element.buildSVG(backgroundColorString));
        content += "\n</svg>";

        if (this._extension.FILES.saveSvg(content)) {
            let flashspot = new Screenshot.Flashspot(this);
            flashspot.fire();
            if (global.play_theme_sound) {
                global.play_theme_sound(0, 'screen-capture', "Save as SVG", null);
            } else if (global.display && global.display.get_sound_player) {
                let player = global.display.get_sound_player();
                player.play_from_theme('screen-capture', "Save as SVG", null);
            }
        }
    }

    _saveAsJson(json, notify, callback) {
        this._stopAll();

        // do not use "content = JSON.stringify(this.elements, null, 2);", neither "content = JSON.stringify(this.elements);"
        // do compromise between disk usage and human readability
        let contents = this.elements.length ? `[\n  ` + new Array(...this.elements.map(element => JSON.stringify(element))).join(`,\n\n  `) + `\n]` : '[]';

        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            json.contents = contents;
            if (notify)
                this.emit('show-osd', this._extension.FILES.ICONS.SAVE, json.name, "", -1, false);
            if (!json.isPersistent)
                this.currentJson = json;
            if (callback)
                callback();
        });
    }

    saveAsJsonWithName(name, callback) {
        this._saveAsJson(this._extension.FILES.JSONS.getNamed(name), false, callback);
    }

    saveAsJson(notify, callback) {
        this._saveAsJson(this._extension.FILES.JSONS.getDated(), notify, callback);
    }

    savePersistent() {
        this._saveAsJson(this._extension.FILES.JSONS.getPersistent());
    }

    syncPersistent() {
        // do not override peristent.json with an empty drawing when changing persistency setting
        if (!this.elements.length)
            this._loadPersistent();
        else
            this.savePersistent();

    }

    _loadJson(json, notify) {
        this._stopAll();

        this.elements = [];
        this.currentElement = null;

        if (!json.contents)
            return;

        this.elements.push(...JSON.parse(json.contents).map(object => {
            if (object.color)
                object.color = this.getColorFromString(object.color, 'White');
            if (object.font && typeof object.font == 'string')
                object.font = Pango.FontDescription.from_string(object.font);
            if (object.image)
                object.image = new Image(object.image);
            return new Elements.DrawingElement(object);
        }));

        if (notify)
            this.emit('show-osd', this._extension.FILES.ICONS.OPEN, json.name, "", -1, false);
        if (!json.isPersistent)
            this.currentJson = json;
    }

    _loadPersistent() {
        this._loadJson(this._extension.FILES.JSONS.getPersistent());
    }

    loadJson(json, notify) {
        this._loadJson(json, notify);
        this._redisplay();
    }

    loadPreviousJson() {
        let json = this._extension.FILES.JSONS.getPrevious(this.currentJson || null);
        if (json)
            this.loadJson(json, true);
    }

    loadNextJson() {
        let json = this._extension.FILES.JSONS.getNext(this.currentJson || null);
        if (json)
            this.loadJson(json, true);
    }

    get drawingContentsHasChanged() {
        let contents = `[\n  ` + new Array(...this.elements.map(element => JSON.stringify(element))).join(`,\n\n  `) + `\n]`;
        return contents != (this.currentJson && this.currentJson.contents);
    }

    // toJSON provides a string suitable for SVG color attribute whereas
    // toString provides a string suitable for displaying the color name to the user.
    getColorFromString(string, fallback) {
       // GNOME 49+ fix: Handle if already a Color object
        if (string && typeof string === 'object' && string.red !== undefined) {
            // GNOME 48.5 SVG export fix: Ensure toJSON method exists
            if (!string.toJSON || typeof string.toJSON !== 'function') {
                let colorStr;
                if (string.to_string && typeof string.to_string === 'function') {
                    // KEEP THE ALPHA - Don't slice it off!
                    colorStr = string.to_string(); // Preserves alpha channel
                } else {
                    // Include alpha in RGB format
                    colorStr = `rgba(${string.red},${string.green},${string.blue},${string.alpha})`;
                }
                string.toJSON = () => colorStr;
                string.toString = () => colorStr;
            }
            return string;
        }
        
        // Handle null/undefined/non-string
        if (!string || typeof string !== 'string') {
            let color = StaticColor[(fallback || 'White').toUpperCase()];
            if (!color) color = StaticColor.WHITE;
            color.toJSON = () => fallback || 'White';
            color.toString = () => fallback || 'White';
            return color;
        }
        
        // Original string handling - Now supports rgba() format with alpha
        let [colorString, displayName] = string.split(':');
        let [success, color] = Color.from_string(colorString);
        
        if (success) {
            color.toJSON = () => colorString;
            color.toString = () => displayName || colorString;
            return color;
        }

        console.warn(`${this._extension.metadata.uuid}: "${string}" color cannot be parsed.`);
        color = StaticColor[fallback.toUpperCase()];
        color.toJSON = () => fallback;
        color.toString = () => fallback;
        return color;
    }
});

