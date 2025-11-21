# Color

Part of the beauty of **Draw on Gnome** is that you can use ***any*** color you want! You are only limited by your imagination and the resources available to you.

A basic set of colors are ready for your usage immediately when you open the program. Other "palettes" of colors are available to you based on the standard GNOME schemes. In addition, there is a color picker that will allow you to select any color you can find.

## Using Standard Colors

You can change colors by pressing `Ctrl+1` through `Ctrl+9`. The colors available to you will depend on the palette you select. You can also manipulate these by bringing up the right-click popup menu.

!!! tip

    Consider using a foot switch (for example, [this](https://amzn.to/41jh5uY){target="_blank"}) to switch between your most used colors (or any keyboard shortcuts you like). 
    
    You might also consider the use of a Stream Deck or similar device. If you do, check out this [Linux UI](https://github.com/timothycrosley/streamdeck-ui){target="_blank"} for the Elgato Stream Decks. Thank you Timothy Crosley!

## Color Picker

Here is one awesome function of Draw On Gnome - the *Color Picker*.

Activate it with `Ctrl+0`

Now you will see a dropper tool. Simply hover it over any color on your screen and mouse-click. It will grab that color (or the closest representation it can establish), change to that color, show the hex code on the bottom of the screen, and return to the tool you were using last.

Grab any color in the RGB spectrum that you can display on your screen!

![color-picker](./videos/gif/color-picker.gif)

If you don't want to select a color and simply want to exit the color picker tool, press `Esc`.

This can be great for branding purposes, or just to stay within a particular color scheme.

!!! note "You can also save the color to your clipboard"

    This is a preference that you would have to set beforehand. Go to **Draw On Gnome Settings > Preferences** and scroll down to the *Copy picked color to clipboard* toggle and turn it on.

## Color Fill

By default, fill is disabled. So for example, if you were to make a rectangle, it would show the outline only. To enable/disable fill, either press `Ctrl+Shift+A`, or select the "Fill" option in the right-click menu.

!!! note "Fill Rules are Complex!"

    If you are using the polyline tool, or other tools that have intersecting lines, fill can behave differently depending on the fill rule. In Draw On Gnome, Non-zero(1) is the default rule, and Even-odd(2) is the secondary rule.
     { .annotate }

    1.  :man_raising_hand: For more information on Non-zero see [this link](https://en.wikipedia.org/wiki/Nonzero-rule){target="_blank"}.
    2.  :man_raising_hand: For more information on Even-odd see [this link](https://en.wikipedia.org/wiki/Even%E2%80%93odd_rule){target="_blank"}.

    They can be toggled with the `Ctrl+Shift+*` shortcut, or in the right-click menu.

    !!! warning
    
        Don't ask me to explain Non-zero versus Even-odd rules. I can't... and I won't.

## Palettes

The default palette is simply called "Palette". The colors for this include: {HotPink, Cyan, Yellow, Orangered, Chartreuse, Dark Violet, White, Gray, and Black} and correspond to `Ctrl+1` through `Ctrl+9` respectively. Of course, you can also select them from the right-click pop-up menu. (Simply right-click anywhere on the screen to open that up.)

However, you might want a palette of colors that is a bit more subdued. So, we've included several others from the GNOME Human Interface Guidelines (GNOME HIG). They range from lighter to darker. To select a different palette, you can either:

- Bring up the right-click menu and click the drop down for "Palette". It will look similar to the image below:

    ![palette](./images/palette.png)

- Use the keyboard shortcut method: `Ctrl+/` or `Shift+Ctrl+/`. (This is somewhat glitchy right now and is on the list of things to fix!)

Once you select a different palette you will have a different set of colors associated with `Ctrl+1` through `Ctrl+9`. For example, "GNOME HIG normal" uses these level 3 colors in order: Blue, Green, Yellow, Orange, Red, Purple, Brown, Light, and Dark.

!!! tip

    Personally, I use the "GNOME HIG normal" palette as my default while training or doing presentations. It is more subdued than "Palette" and offers you the colors in a bit more of a logical order. However, if I require a little more pizazz, then I'll jump over to "Palette".

!!! bug

    Currently, you cannot re-order the palettes by drag-and-drop. This is on the [roadmap](roadmap.md)!

### Creating a new Palette

If you would like to make your own color scheme, simply go to **Draw On Gnome Settings > Drawing Page**.

There you will see the **Palettes** section. In "New Palette" click the + sign to create a new palette. Then, next to the new palette that is created, click the Edit button. There you can change the name of the palette, select the colors you desire, and name each of them. "X" out when you are done.

Select the new palette from the right-click menu (or `Ctrl+/`) and utilize `Ctrl+1` through `Ctrl+9` as you normally would.

### Removing a Palette

- Go to **Draw on Gnome Settings > Drawing Page**.
- Click the X for the palette you want to remove.

    !!! warning

        Currently, this cannot be undone in the Draw On Gnome Preferences - Drawing Page. Use with caution! Backup your extension directory before making these types of changes!(1)
        { .annotate }

        1.  :man_raising_hand: This command should do the trick:
        ```console
        sudo cp -r ~/.local/share/gnome-shell/extensions/draw-on-gnome@daveprowse.github.io/ ~/.local/share/gnome-shell/extensions/draw-on-gnome@daveprowse.github.io-backup
        ```
        It's perfectly fine to place the backup in the extensions directory. However, if you want the backup somewhere else, feel free to change the target directory. 🖭


    !!! danger

        It is possible that you could modify the palette configuration within the extension itself (.js files or schema) but this is not recommended as it can break the functionality of the program.
