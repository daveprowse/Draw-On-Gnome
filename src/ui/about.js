/*
 * Copyright 2022 zhrexl
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
 * SPDX-FileCopyrightText: 2024 Dave Prowse
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { CURATED_UUID as UUID } from "../utils.js";

const MARGIN = 10;

//TODO: Follow GNOME HIG for About Pages
const AboutPage = GObject.registerClass({
    GTypeName: `${UUID}-AboutPage`,
}, class AboutPage extends Adw.PreferencesPage {
    constructor(extensionPreferences) {
        super({});
        this.set_title(_("About"));
        this.set_name("about");
        this.set_icon_name("dialog-question-symbolic");

        const aboutGroup = Adw.PreferencesGroup.new();
        const scrolledWindow = Gtk.ScrolledWindow.new();

        scrolledWindow.set_vexpand(true);
        scrolledWindow.hscrollbar_policy = Gtk.PolicyType.NEVER;

        aboutGroup.add(scrolledWindow);

        const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_top: 3 * MARGIN, margin_bottom: 3 * MARGIN, margin_start: 3 * MARGIN, margin_end: 3 * MARGIN });
        scrolledWindow.set_child(vbox);

        // Translators: you are free to translate the extension name, that is displayed in About page, or not
        const name = "<b> " + _("Draw On Gnome") + "</b>";
        // Translators: version number in "About" page
        const version = _("Version %f").format(extensionPreferences.metadata.version);
        // Translators: you are free to translate the extension description, that is displayed in About page, or not
        const description = _("Draw on your GNOME Desktop!.\nStart by pressing 'Super+Alt+D'. Have fun! :)");
        const link = "<span><a href=\"" + extensionPreferences.metadata.url + "\">" + extensionPreferences.metadata.url + "</a></span>";
        const licenseName = _("GNU General Public License, version 3 or later");
        const licenseLink = "https://www.gnu.org/licenses/gpl-3.0.html";
        const license = "<small>" + _("This program comes with absolutely no warranty.\nSee the <a href=\"%s\">%s</a> for details.").format(licenseLink, licenseName) + "</small>";

        const aboutLabel = new Gtk.Label({
            wrap:       true, justify:    Gtk.Justification.CENTER, use_markup: true, label:
                name + "\n\n" + version + "\n\n" + description + "\n\n" + link + "\n\n" + license + "\n",
        });

        vbox.append(aboutLabel);

        const creditBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 2 * MARGIN, margin_bottom: 2 * MARGIN, margin_start: 2 * MARGIN, margin_end: 2 * MARGIN, spacing: 5 });
        const leftBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, hexpand: true });
        const rightBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, hexpand: true });
        leftBox.append(new Gtk.Label({
            wrap:       true, valign:     Gtk.Align.START, halign:     Gtk.Align.END, justify:    Gtk.Justification.RIGHT,
            use_markup: true, label:      "<small>" + _("Created by") + "</small>",
        }));
        rightBox.append(new Gtk.Label({
            wrap:       true, valign:     Gtk.Align.START, halign:     Gtk.Align.START, justify:    Gtk.Justification.LEFT,
            use_markup: true, label:      "<small><a href=\"https://codeberg.org/abak\">Abakkk</a></small>",
        }));

        leftBox.append(new Gtk.Label({
            wrap:       true, valign:     Gtk.Align.START, halign:     Gtk.Align.END, justify:    Gtk.Justification.RIGHT,
            use_markup: true, label:      "<small>" + _("Forked by") + "</small>",
        }));
        rightBox.append(new Gtk.Label({
            wrap:       true, valign:     Gtk.Align.START, halign:     Gtk.Align.START, justify:    Gtk.Justification.LEFT,
            use_markup: true, label:      "<small><a href=\"https://github.com/zhrexl\">zhrexl</a></small>",
        }));

        leftBox.append(new Gtk.Label({
            wrap:       true, valign:     Gtk.Align.START, halign:     Gtk.Align.END, justify:    Gtk.Justification.RIGHT,
            use_markup: true, label:      "<small>" + _("Forked by") + "</small>",
        }));
        rightBox.append(new Gtk.Label({
            wrap:       true, valign:     Gtk.Align.START, halign:     Gtk.Align.START, justify:    Gtk.Justification.LEFT,
            use_markup: true, label:      "<small><a href=\"https://github.com/daveprowse\">daveprowse</a></small>",
        }));

        creditBox.append(leftBox);
        creditBox.append(rightBox);
        vbox.append(creditBox);

        // Translators: add your name here or keep it empty, it will be displayed in about page, e.g.
        // msgstr ""
        // "translator1\n"
        // "<a href=\"mailto:translator2@mail.org\">translator2</a>\n"
        // "<a href=\"https://...\">translator3</a>"
        if (_("translator-credits") != "translator-credits" && _("translator-credits") != "") {
            leftBox.append(new Gtk.Label());
            rightBox.append(new Gtk.Label());
            leftBox.append(new Gtk.Label({ wrap: true, valign: Gtk.Align.START, halign: Gtk.Align.END, justify: 1, use_markup: true, label: "<small>" + _("Translated by") + "</small>" }));
            rightBox.append(new Gtk.Label({ wrap: true, valign: Gtk.Align.START, halign: Gtk.Align.START, justify: 0, use_markup: true, label: "<small>" + _("translator-credits") + "</small>" }));
        }
        this.add(aboutGroup);
    }
});

export default AboutPage;
