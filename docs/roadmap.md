# Roadmap and Todo for Draw on Gnome

Here's the roadmap. The program works very well as is, but could always use some improvement. Plus there are minor bugs, errata, and issues that need to be realized.

**If you have any ideas or suggestions, feel free to post them [here](https://github.com/daveprowse/Draw-On-Gnome/discussions/categories/ideas){target="_blank"}**.

!!! example "Consider committing code to the project!"

    If you are interested in contributing, take a look at the list below and add your distinctiveness to our own!(1)
		{ .annotate }

    1.  :man_raising_hand: You can begin a [pull request here](https://github.com/daveprowse/Draw-On-Gnome/pulls){target="_blank"} or contact me at my [Discord Server](https://discord.com/invite/mggw8VGzUp){target="_blank"} to strike up a conversation.

## Primary Goals

- All done! E.G.O. Approved!
- Working on issues and will submit new ver. 5.0 to E.G.O. in the next few weeks.

## Issues

- After typing text and when selecting another tool, the text blinks for a moment and a log error is written:

```
JS ERROR: TypeError: textEntry.is_finalized is not a function
_stopWriting/<@file:///home/dave3/.local/share/gnome-shell/extensions/draw-on-gnome@daveprowse.github.io/area.js:1100:41
@resource:///org/gnome/shell/ui/init.js:21:20
```

So I have some work to do on `textEntry.is`

- A previously saved file with a highlighter box when opened only shows a white box, not highlighted.

- `Ctrl+/` and `Ctrl+Shift+/` not cycling properly in v15. Interesting that there is another cycling problem. This could be related to the opening of images (which was fixed). Probably similar code.

- After using the text tool, the polygon/polyline tools will not create matrices properly. Closing and reopening the extension will reset this. This is a remnant from the after-text-tool error that is 95% fixed. 

- EvenOdd issue for Gnome High Normal and others. Should be white?
	- "Light" works from the menu but not with `Ctrl+F8`
	- Happens when fill is selected (also, related, fill doesn't shut off from toggle properly, only shortcut works right)
- `Ctrl+KP /` shortcut for palettes not cyclicling properly, (rename, it's just `Ctrl+/`)

## Planned Features (long-term)

1. Selection Tool
Currently can only manipulate one element. This is a huge limitation for complex drawings.
2. Freehand Eraser
Fixing mistakes is clunky now. A proper eraser is essential.
3. Snap-to-Grid
Grid exists but doesn't snap. This would make technical drawings so much easier.
4. Rulers & Guides
Standard in every drawing app for a reason.
5. Clipboard Rich Copy
Being able to paste drawings directly into other apps would be a massive workflow improvement.
6. Auto-save feature. As of now, there is no auto-save option. The user needs to manually press `Ctrl + S` to save a drawing.
7. Delete Tool. Currently you can only delete in a LIFO manner. This proposed tool would use a hot-key to activate Delete on any item that was drawn. This one will require some work!

- More development of the "Mirror" tool.
- Blur option - for redacting - see [this link](https://github.com/daveprowse/Draw-On-Gnome/issues/9){target="_blank"}
- Fade out option - (Similar to macOS ScreenBrush) - see [this link](https://github.com/daveprowse/Draw-On-Gnome/issues/23){target="_blank"}
- Whiteboard option with one shortcut (similar to Microsoft Powerpoint option)
- Feature Request - ICONS - see [this link](https://github.com/daveprowse/Draw-On-Gnome/issues/1){target="_blank"}
- Smooth line fix - testing with area.js currently. However, this is *very* dependent on the video card in the user's system, so I'm not sure how much we can accomplish within the confines of the GNOME desktop. 
- Reorder palettes via drag and drop
- Touchscreen support - see [this link](https://github.com/daveprowse/Draw-On-Gnome/issues/3){target="_blank"}

---
