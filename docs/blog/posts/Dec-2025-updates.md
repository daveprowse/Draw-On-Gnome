---
draft: true
authors:
  - daveprowse
date: 2025-12-04
categories:
  - Updates  
---

# December 2025 Updates

Here are the updates! And there's a bunch! Including the new Laser Pointer feature, image pasting fix, dashed line fix, line thickness fix, polygon fix, and hovering tool tips addition! Oh YEAH!! 👍👍

## The Laser Pointer has Arrived!

Now we have a working laser pointer. Rockin' 🎸

That required a lot more work than I initially thought. But it is done. Tested on GNOMEv49.1 and v48.5.
Use `Ctrl+Q` to toggle it. Then simply move the mouse or stylus to move the laser around. `Ctrl+Q` to toggle it back off and return to the drawing tool. Even got the right-click menu option to work while in laser mode.

This functionality can be found as early as version 4.1...

**Summary:**

✅ Created a laser pointer tool with Google Slides-style visual effect

✅ Trail fade - disappears when mouse stops (tunable at 50-100ms, I have it at 100 now, but might reduce it based on feedback...)

✅ `Ctrl+Q` toggle - enables/disables laser, returns to drawing tool

✅ Right-click menu - stops laser and opens menu correctly

Note: `Ctrl+Q` might seem like an odd choice, but it works with left-hand only. Plus, we are running out of shortcuts! Think *"Q" > Star Trek > Phasers > Lasers*. Pretty weak connection, but there it is...

Enjoy everyone! 👍

## Dashed line fix

This was nonfunctional for a while. Now it works with `Ctrl+.` or by right-clicking for the popup menu and selecting the "Dashed Line" toggle. 

Not sure what happened to the code over the years, because dotted lines used to work. Anyway, I configured a dynamic solution in area.js that uses a multiplier of the line thickness to calculate a proportional amount of pixels for the dashes and the gaps. See below:

```js
let dashLength = Math.max(this.currentLineWidth * 3, 8);
let gapLength = Math.max(this.currentLineWidth * 2, 4);
```

If anyone wants a larger gap size, we could change it to (2,6), (2,6).

> Note for posterity: This was my debug line to see the issue: 

```js
console.log(`DEBUG: dashedLine=${this.dashedLine}, dashArray=[${this.dashArray}], dashOffset=${this.dashOffset}`);`
```

## Line Thickness Fix

Now it is set to a minumum of 1, whereas it was previously set to 0 (which would make invisible drawings!). It now works in the right-click menu slider, with `Ctrl+mousewheel`, and with `Ctrl+Shift++`/`Ctrl+-`.

**Problem: **The extension was allowing for a line thickness of zero which was causing us all kinds of headaches. It was easy to set the thickness to zero with `Ctrl+mousewheel` without even noticing it. And then it would stay at zero even if you restarted the extension (or the computer). 

I repaired the problem by modifying the following line in the `incrementLineWidth()` method to `1`:

```js
this.currentLineWidth = Math.max(this.currentLineWidth + increment, 1);
```

My debug test for this was in the `_addSliderItem` method in the `if` and the `else` sections:

```js
console.log(`DEBUG SLIDER: value=${slider.value}, calculated=${Math.round(slider.value * 50)}, final=${target[targetProperty]}, SHELL_VERSION=${SHELL_MAJOR_VERSION}`);
```

That was an easy one. 

## Polygon/Polyline Fix

I believe that state management was being affected in the extension because of the dashed line issue or the line thickness issue (my guess is the dashed line issue). Once those were fixed, the polygon issue went away. Very interesting, but something I will keep an eye on...

## Added Hover Tooltips to the eight buttons in the Right-click Menu

This was gnawing at me for some time. Now we have hovering tool tips that describe what each of the eight tool buttons do in the right-click menu. I also color coded the buttons so they show distinct colors when hovering on them. Fun! This work was all conducted inside of `menu.js`.

## Fixed the image pasting function

Now you can paste images into your drawing properly. Currently it only works with locally stored images, you can't grab from the Internet ... yet. I removed the scaling feature while pasting the image. It would skew the image. I thought the better workflow would be to paste the image at original size, and then use the Resize tool (`Ctrl+X`) to size it as necessary.

**Summary:**

✅ Image rendering in GNOME 47+ - Using Gdk.cairo_set_source_pixbuf() to bridge GdkPixbuf to Cairo

✅ Paste at original size - Images maintain aspect ratio, resizable with tools

✅ No stroking on images - Removed the cr.stroke() that was covering painted pixels

✅ Clean, minimal changes - After massive testing with a backup of the extension, this fix only modifies 3 files

## More fixes

- Repaired the `Ctrl+F1` shortcuts window. Used a lot of JS regex and was able to fix many problems there. Also removed a lot of outdated code. Today, GNOME only uses `printscreen` and the screenshot app opens. So I also removed the SYSTEM section for shortcuts. 
- Fixed a lot of issues in the schema and recompiled.
- Did some more work on the "mirror" tool. It is a strange tool that needs more thought.

---
