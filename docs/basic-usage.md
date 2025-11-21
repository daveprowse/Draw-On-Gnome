# Basic Usage

After the **Draw On Gnome** extension is installed and enabled, press `Super + Alt +D` to start using it.

You should briefly see a message on the bottom of the screen that shows that you have entered "Drawing Mode".

![intro-message](./images/intro-message.png)

The shortcut `Super + Alt + D` toggles the program on and off.

You will also note that the keyboard shortcurt `Ctrl + F1` will reveal *all* shortcuts. Use it to get past the learning curve of the plethora of shortcuts available to you!

!!! note

    Click [here](shortcuts.md) for the link to the shortcuts page.

---

## Drawing Mode

By default, you are placed in standard "drawing mode" where you can write on the screen with a stylus/tablet or with your mouse. If you ever need to return to this mode, press `Ctrl + P`. Think "P" like "pen" or "pencil".

- To increase line width: `Ctrl +`
- To decrease line width: `Ctrl -`

> Or, use `Ctrl+MouseWheel`, or right-click for the popup menu and use the slider. You'll find plenty of other great options in that menu.

## Eraser

To use the eraser tool, press and hold the `Shift` key. Simultaneously, click and hold the primary mouse button and move the mouse wherever you want to erase. The best way to use this is with Drawing Mode `Ctrl + P` (and adjust the line thickness as needed), but it works with some of the other modes as well.

## Colors

Press `Ctrl+1` through `Ctrl+9` to change the color of your drawing.

This applies to using the pen, line, arrow, rectangle, ellipse, text, and other tools.

Press `Ctrl+0` to use the Color Picker. (More information [here](color.md#color-picker).)

## Shapes

Press `Ctrl+R` to draw a rectangle.

Press `Ctrl+E` to draw an ellipse.

Press `Ctrl+L` to draw a straight line.

Press `Ctrl+A` to draw a straight line with arrow head.

Press `Ctrl+Y` to draw a polygon. (Use the `Enter` key to mark vertices.)

Press `Ctrl+U` to draw a polyline.

## Text

Press `Ctrl+T` to type text. 

When you do so, you can click and drag to specify the size and location of the initial text.

!!! tip

    Changing the color while in text mode will change all of the text you just typed. 
    
    To type separate pieces of text in different colors, press the `Esc` key between typed sections.

When you finish with the text tool and you want to use another tool, press the shortcut key for that tool. In some cases you might need to press the `Esc` key first.

## Moving and Resizing

You can move or resize any of the previous objects mentioned.

To **move** and object, press `Ctrl + M` and hover on the object. Click and drag to move it where you wish. You must hover the cursor directly on the line, the perimeter of the shape, or the actual text that you want to move. When you do so, the cursor will change from a standard pointer to a 4-way directional cursor.

To **resize** and object, press `Ctrl + X` and hover on the object. Click and drag to make the object bigger or smaller. Again, you must hover the cursor directly on the line, the perimeter of the shape, or the actual text that you want to resize.

## Image Pasting

Copy a locally stored image and paste it into your drawing! 

To do this:

1. Make sure the extension is off.
2. Find an image on your local computer, right-click on it and copy it.
3. Open the extension (`Super+ALT+D`)
4. Press `Ctrl+V`, and then click and drag to paste it onto the screen. The extension will place the image on the screen at the exact pixel size and resolution as the original. 

Awesome fun!

- You can then move the image (`Ctrl+M`) or resize it (`Ctrl+X`) as you see fit.
- If you want to paste the image again, press `Ctrl+I`, then click and drag to paste.
- If you want to use another previously pasted image, right-click for the menu and click the image drop-down, you should see a list of the images you have pasted so far in this session.
- If you wish to paste a new image from your computer, close out of the extension, copy the new image, open the extension, and paste it in with `Ctrl+V`!! 

The fun never ends!

## Background and Grid

Press `Ctrl+B` to initiate the background option.

Press `Ctrl+G` to overlay a grid. This works best with the background feature.

!!! note

    The background and grid options have set colors but you can modify those in **Extensions > Draw On Gnome Settings > Drawing Page**.

## Laser Pointer

Use `Ctrl+Q` to toggle it. Then simply move the mouse or stylus to move the laser around. `Ctrl+Q` to toggle it back off and return to the drawing tool. 

## The Right-Click Menu

While working in Draw On Gnome, right-click the screen and you will be presented with the pop-up menu as shown below. From here you can manually select any of the options mentioned on this page. You can also:

- Hide the panel and dash in Linux
- Create a "Square" drawing area
- Save or open drawings
- and more!

Play around with it a little bit to learn what options are available to you!

![right-click-menu](./images/right-click-menu.png)

There are eight action buttons in the menu (four on the top, and four on the bottom). These have the following functions:

**Top** (from left to right)

- Undo
- Redo
- Erase (deletes the last drawn element, and can continue backwards in time)
- Smooth (smooths out the last free-drawn line)

**Bottom** (from left to right)

- Save
- Export to SVG (saves an .svg file to `~/Pictures`)
- Opens the Preferences page (exits out of D.O.G.)
- Shows the Shortcuts/Help (can also be done with `Ctrl+F1`)

## Saving and Opening Files

Press `Ctrl+S` to save your file with an automatically generated name. You can also go to the pop-up menu and save your file there with a name of your choice.

Files are saved by default to: `/home/<user>/.local/share/draw-on-gnome`

!!! warning

    Draw On Gnome does not auto-save! You need to press `Ctrl+S` to save. And do it often!!

To open files, select from a list of drawings in the pop-up menu. 

> Note: You can also press `Ctrl+O` to open the latest drawing. Use `Ctrl+O` or `Ctrl+Shift+O` to cycle through the history of drawings. However, this functionality is somewhat broken. It is supposed to cycle through the drawing and show each one as you continually press `Ctrl+O` but it stopped working around the GNOMEv45 update. It is on the roadmap.

## Opening the Preferences Page

The Preferences page is where you can go to configure global settings and set keyboard shortcuts.

The preferences page functions outside of the extension. However, you can access it from the CLI, the GNOME shell (GUI) or from *within* the extension itself:

**CLI**

```
gnome-extensions prefs draw-on-gnome@daveprowse.github.io
```

**GUI**

1. Open `gnome-extensions-app`

    !!! tip annotate

        :man_raising_hand: You can install the Gnome Extensions App package within your Linux distribution:
    
          - in most Linux: `sudo dnf install gnome-extensions-app`
          - otherwise: `sudo apt install gnome-shell-extensions-prefs`

2. Click the three vertical dots next to Draw-On-Gnome.
3. Click Settings.

Then click


**From within Draw-On-Gnome**

Right-click for the pop-up menu, then click the 2nd icon from the right on the bottom of the window. That will disable Draw On Gnome and open the Preferences page.

!!! note "Access the Drawing Page Too!"

    The window that contains the "Preferences" tab also has the Drawing Page where you can work with Palettes, Area, and Tools. You will also see an informational "About" tab.

## REMEMBER! USE SHORTCUTS!

Keyboard shortcuts are the key to using this tool effectively with a drawing tablet.

Access the list with `Ctrl+F1`.
