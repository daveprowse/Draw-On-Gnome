At times you might need to troubleshoot issues with Draw On Gnome. This page shows some ways that you can go about identifying and potentially fixing problems with the extension.

!!! bug "Bugs, Issues, Comments?"

    If you encounter a problem that is not covered in this section, please post it [here](https://github.com/daveprowse/Draw-On-Gnome/issues){target="_blank"}.

## Disabling the Extension

If you are experiencing issues that you think are related to the Draw On Gnome extension, try disabling the extension and then checking the logs for errors.

To disable the extension you have two options:

- In the CLI: type `gnome-extensions disable draw-on-gnome@daveprowse.github.io`
- In the GUI: Use the `gnome-extensions-app` program and click the toggle to disable Draw On Gnome.

## Logging & Analysis

To see the basic details of the Draw On Gnome extension:

`gnome-extensions show draw-on-gnome@daveprowse.github.io`

To check the logs for Draw On Gnome, try the following options in the terminal:

`journalctl -f /usr/bin/gnome-shell`

or:

`journalctl -f -o cat /usr/bin/gnome-shell`

or:

`journalctl -f -o cat /usr/bin/gnome-shell 2>&1 | grep -i "draw-on-gnome"`

or something similar.

This will give any important errors/messages about the GNOME shell in general. In some cases, you might need to preface the command with `sudo`. The beauty of the `-f` parameter is that it will run continuously until you stop it. During that time you can run the extension and track any errors that might be occurring.

Other options:

`journalctl -b | grep draw-on-gnome`

`journalctl -b -l -n 3000`

If you find an issue, please report it [here](https://github.com/daveprowse/Draw-On-Gnome/issues){target="_blank"}. However, please examine the current open (and closed) Issues before you submit a new one - it might already exist.

> Note: If using `console.log` for debugging, run the `journalctl -f | grep DEBUG` command while testing the extension.

## Removing a current installation of Draw On Gnome

Sometimes, an extension can fail or behave in a buggy manner. This could be for several reasons. If this happens, the best practice is to remove the extension entirely and reinstall it.

There are a couple of ways to remove the Draw On Gnome extension:

1. Using the CLI

    In the Terminal type `gnome-extensions uninstall draw-on-gnome@daveprowse.github.io`

2. Using the gnome-extensions-app program

    - Install the program if isn't already there, for example: `sudo apt install gnome-extensions-app`
    - Open the program `gnome-extensions-app`, locate the extension, click the vertical three dots button and select "Remove".

3. Removing it manually.

    - `sudo rm -r ~/.local/share/gnome-shell/extensions/draw-on-gnome@daveprowse.github.io`
    - Be sure to check the `extensions` directory for any remnant files.
    > Note: If you have an older version of the extension, it might go under a different name. Check the `extensions` directory for any other names that it might go by.

    !!! warning "Backup your current extension!"

        I recommend backing up the extension before removing it.
        Do this by copying it and renaming it.

        For example, in `~/.local/share/gnome-shell/extensions` type the following command:
        
        ```
        cp -r draw-on-gnome@daveprowse.github.io draw-on-gnome@daveprowse.github.io.bak
        ```

Then, reinstall. Installation methods can be found [here](./installation.md).

---

!!! note "Older versions of the program should be removed."

    If you ran an older version of Draw On Your Screen, then I recommend removing it before installing the new version of Draw On Gnome. If not, you could see issues/conflicts with the schema and saved configurations.

---

## Modifying Extension Settings and Troubleshooting with dconf

Aside from modifying Draw On Gnome settings within the Preferences page, you can also go to the dconf editor. To use this tool, do the following:

1. Install the dconf-editor: `sudo apt install dconf-editor`
2. Run it: `dconf-editor`
3. Navigate to the following path: `/org/gnome/shell/extensions/draw-on-gnome`

From there you can customize your extension. Not only are all of the configurations available that are listed in the Preferences page, but you can also make in-depth modifications that go beyond the Preferences page, for example within the "Drawing" directory.

You can also use this tool to fix some issues that might occur with the extension. 

!!! example "BONUS: Any changes you make to an extension can be "watched" in real time using `dconf-cli`."

    - Install it (if not already there): `sudo apt install dconf-cli`
    - Watch changes in real time with this command: `dconf watch /`
    > Note: Also, you can view the content in the CLI, example: `dconf list /org/gnome/shell/extensions`

> Note: /org and dconf use GSettings (the dconf database) instead of a typical file location in Linux. 
> The path to the DB is `~/.config/dconf/user`.

## Specific Issues

Here are some specific issues that you might encounter.

### Right-click Menu Loses Functionality

If the top and bottom icons don't appear, and the drop down menus won't display:

- Check the scaling in GNOME. Anything higher than 150% scaling could cause this issue.
- Check the resolution settings.
- Check if any other extensions are interfering with Draw On Gnome. Disable all other extensions and see if the issue persists.

### Other Drawing Apps can cause Conflicts

If you use other drawing apps it is possible that they can conflict with Draw On Gnome. One reported example was with the Flatpak version of `gromit-mpx`. In these cases I suggest using the `apt` package manager to install the other program. Uninstall and reinstall if necessary.