# Version History

Version history for Draw on Gnome (and it's previous name - DrawOnYourScreen)

> Note: You can also see the version history at the [releases page](https://github.com/daveprowse/Draw-On-Gnome/releases){target="_blank"}

## v4.0 - Nov, 2025

- Approved by E.G.O. !!!
- Supports GNOME v48 and v49
- Using E.G.O. version numbering so we have skipped from 1.6 to 4.0.
  - Minor releases will be posted on GitHub (such as 4.1, 4.2, etc...)
  - Major release numbers (such as 5.0) will be reserved for new E.G.O. submissions.

## v1.6 - Oct, 2025

- Updated to support GNOMEv49. Addresses #36 - Thanks to @aabrame !! 
- Added language support.
- Minor modifications in ui

Rock on! 🎸

## v1.5 - Oct, 2025

- Version 1.5. Works with all GNOME 48 point releases between .0 and .5. 
- Fixes problem with GNOME 48.3 and 48.4 due to GNOME code change. 
- Incorporated all E.G.O. requests (see issue #16 ). Too many to list here.

This one is being submitted to E.G.O. Yay! Hope they accept it!

♥️♥️♥️

## v1.4 - Oct, 2025

- Issue #22 - Fixed translations filenames (thanks @carvalhods)
- Issue #32 - DOG Crashes after using Text Tool. This is fixed for GNOME 48.5 and later.

## v1.3 - Mar, 2025

- Version 1.3 - only works on GNOMEv48.
- Fixed other session crash when moving or resizing - Issue #17. Both moving `Ctrl+M` and resizing `Ctrl+X` should work.
- Added new translations for pt_BR - thanks @carvalhods !!
- Trademarked 1st instance of GNOME in README and documentation.

## v1.2 - Mar, 2025

- Fixed session crash - Issue #17 - thanks to @litemotiv !!!

> Note: This is for GNOME v48 only. GNOME v47 and v46 users should use [this](https://github.com/daveprowse/Draw-On-Gnome/releases/tag/D.O.G.-ver-1.1) and the install instructions for that are [here](https://daveprowse.github.io/Draw-On-Gnome/installation/#gnome-v47-and-v46)

## v1.1 - Mar, 2025

- Second set of E.G.O. edits. More to come.
- Name change to **Draw-on-Gnome** to avoid trademark issues.
- Works with GNOME Versions 46 through 48-rc3. (For GNOME V48 full release see version 1.2.)

Thanks again to everyone involved in the project! 👨‍💻

## v1.0 - March, 2025

**GNOMEv48, v47, and v46 versions of Draw On Gnome**:

- Set up GNOME version 48 usage.
- Re-branded the tool.
  - Name change from DrawOnYourScreen3 to Draw On Gnome.
  - Restarted version numbering from 1.
- Fixed and rebuilt translations.

---

## v15.0 - November 2024

**GNOMEv47 and v46 version of DOYS**:

- Configured JS for backward compatibility with GNOMEv46
- Included arrow tool (thanks to extrememicro!)
- Fixed main palette white issue (thanks to adaschma!)
- Also built separate GNOMEv47 and GNOMEv46 versions available via individual branches (different code)
- Verified functionality of GNOMEv47 (Debian SID - November 2024 using 47.0 and 47.1)
- Verified backward compatibility and functionality of GNOMEv46 (Ubuntu 24.04 and Debian SID)

## v14.0 - November 2024

**GNOMEv45 version of DOYS**:

- Built a v45 version based on v42 plus older commits from DOYS2 
- Verified functionality on Fedora 39 and Ubuntu 23.10
- Not backward, or forward, compatible with other GNOME versions.

## v13.0 - November 2024

**GNOMEv42-v44 version of DOYS3**.

- Updated the GNOMEv42 version to incorporate various commits
- Added support for GNOMEv43 and v44
- Verified functionality on GNOMEv42 (Fedora 36 and Ubuntu 22.04), v43 (Debian 12), and v44 (Ubuntu 23.04 and Fedora 38).

### November 2024

- daveprowse took over as maintainer
- Decided on 3 separate versions for GNOMEv42-44, v45, and v46-47.
0 They are version 13, 14, and 15 respectively. This catches up the releases and is more easily compatible with E.G.O. versioning rules.

## v12.7 - March 2023

- Released version for GNOMEv42
- Temporarily stored on E.G.O. but removed for unknown reason.

## v12.2 - April 2022

- Initial Support for GNOME v42

## v12 - March 2022

- Removed Intermediate Points (Improved Perfomance)
- Fixed broken stylus/two cursors on Wayland 

### 2022

- zhrexl took over as maintainer

## v11.1 - April 2021

- Not to erase the text when pressing "Escape" #60

## v11 - February 2021

- GS 40 compatibility (40.beta)
- Gtk4 port (preferences)
- Toggle animations (background, grid and square area)
- Multi-line text elements
- Start a new line with "Enter" (text tool)
- Add "centered" text alignment
- Convenient marks for rotation and stretch transformations

## v10 - October 2020

- Fix multi-monitor support #52

## v9 - October 2020

- Split the drawing area in several layers (performance)
- Start a new line with "Shift + Enter" (text tool)

## v8.1 - October 2020

- Fix unsanitized GType names #46
- Quick free drawings are smoother #45
- Transformations are undoable/redoable

## v8 - September 2020

Nothing.

## v7 - September 2020

- Can import GIMP palettes.
- Can color SVG images.
- Integrate color picker (GS buit-in or Color Picker extension).

## v6.4 - September 2020

- Prepare GS 3.38 compatibility.
- Add tooltips to sub-menu buttons also.
- Fix drawing directory monitoring when it does not exist yet.
- Fix text entry / ibus candidate popup position.

## v6.3 - September 2020

- Replace user stylesheet with proper drawing settings
- Multi-palettes
- Possibility to add insertable images from the clipboard
- Image directory is configurable
- Thumbnails in "Open drawing" sub-menu
- Drawings can be directly inserted as an image.
- Add a lot of icons in the menu and the OSD notifications
- Group menu items at the bottom
- Add tooltips to menu buttons
- New "Persistent over toggles' setting #42

## v6.2 - August 2020

- Show the text entry when ibusCandidatePopup is used
- Regroup first menu items
- Center grid overlay
- Image shape
- Extend font family choices
- Fix sub-menu scroll view adjustment

## v6.1 - June 2020

- Fix empty media-keys settings case #28
- Fix label color in OSD and menu #31
- Fix OSD width
- Fix "Hide panel and dock"
- Small menu on small monitor
- Start a new text line with the `Enter` key #30
- IBus inputs #29 #34
- Non-latin and emoji characters rendered
- GS keyboard is now available to type text
- Grid overlay
- Polygon and polyline shapes
- Move, resize and mirror tools
- Fill rule and text alignment style attributes
- An optional fourth control point for Bézier curves
- Keybinding to toggle modeless/modal #6 #9 #20 #24 #33
  (ungrabs keyboard and mouse while drawing remains at the top)
- Attributes are now persistent through drawing mode toggling #27

## v6 - March 2020

- GS 3.36 compatibility

## v5.1 - March 2020

- Add "Open" and "Save drawing"
- Change some keyboard shortcuts
- Replace "smoothed stroke" preference with `Ctrl` key modifier
- Add `space` key modifier to ignore pointer movement #20
- User style is now stored in user data directory (`user.css`)
- Customizable square area size #22

## v5 - December 2019

- Improve pointer cursor
- Add 3.24 version as supported
- Use maxLevel in line-width OSD
- Small fix with text shape that displayed keybindings

## v4.1 - October 2019

- GS 3.34 compatibility
- Create drawing menu on demand
- Allow 0 px line width because stroke lines cannot have color with some transparency

## v4 - April 2019

- Add drawing menu
- Add panel indicator
- Prefs to disable indicator and notifications
- Change middle click action

## v3 - March 2019

- Fix area container integration #1
- Add persistence

## v2 - March 2019

- Add transformations
- Add square area

## v1 - March 2019

* Initial release
