# Draw On Gnome

[<img src="https://daveprowse.github.io/Draw-On-Gnome/images/dog.png" height="70">](https://extensions.gnome.org/extension/7921/draw-on-gnome/)

Annotate your GNOME™ desktop with **`Super+Alt+D`**.

Documentation is **[here](https://daveprowse.github.io/Draw-On-Gnome/)**.

Want to contribute? Read [this](https://github.com/daveprowse/Draw-On-Gnome/blob/main/CONTRIBUTING.md) first. And thank you to all the contributors! 😎 

## Features

- Draw over applications
- Basic shapes (rectangle, circle, ellipse, line, polygon, polyline, arrow, text, free)
- Basic transformations (move, rotate, resize, mirror)
- Laser pointer, highlighter 
- Blackboard and Grid
- Paste images from local computer
- Keep drawings on desktop background with persistence
- Multi-monitor support
- Save your work with `Ctrl+S`!!

## Installation Options

### Option 1: Install from GNOME Extensions (ver. 50/49/48/47/46)

[<img src="https://daveprowse.github.io/Draw-On-Gnome/images/gnome-extensions.png" height="100">](https://extensions.gnome.org/extension/7921/draw-on-gnome/)

> **IMPORTANT!!**: Currently, this will *only* install to GNOMEv46 through v50. If you need the extension for another version of GNOME, see Option 2.
>
> To check your version of gnome type `gnome-shell --version`.

### Option 2: Use the Automated Script

1. Copy the following command to a *Bash* terminal and press `enter` to run it:

   ```bash
   bash <(wget -qO- https://raw.githubusercontent.com/daveprowse/scripts/refs/heads/main/dog-install.sh)
   ```

   The script will attempt to identify your version of GNOME and install the correct version of the extension automatically. 
   
   > Note: Currently, the script will identify GNOME v50 through v40 and back all the way to v3.xx. 

   > Note: You may need to enter your sudo password during the install. Make sure you are a sudoer!

   > **IMPORTANT!!** Always check scripts before running them! If you are uncomfortable running the script, or cannot run the script, then install manually with an option listed in the [Documentation](https://daveprowse.github.io/Draw-On-Gnome/installation/#option-3-install-manually-from-the-release-or-repository-branch/).

2. Logout and log back in.

3. Enable the extension:

- In the GUI
  - Open the GNOME Extensions App:

      `gnome-extensions-app`

  - Locate Draw On GNOME and enable it.


- In the CLI:

  ```console
  gnome-extensions enable draw-on-gnome@daveprowse.github.io
  ```


   > Note: You can install the Gnome Extensions App with the package `gnome-shell-extensions-prefs` within your Linux distribution.

4. Now go forth and use the tool by pressing `Super + Alt + D`.

   > Note: You can discover the keyboard shortcuts by pressing `Ctrl + F1`.

It's back to the drawing board my friends! Enjoy! 😎

---

## Manual Installs

> Warning!! If you clone the main repository you are getting the latest features, but they have not yet been released, and might not be thoroughly tested. You've been warned!

📖 For manual installation procedures (git clone and tarball) see the **[Documentation](https://daveprowse.github.io/Draw-On-Gnome/installation/)**.

> Documentation is generated using Material for Mkdocs. Check it out:
> [![Built with Material for MkDocs](https://img.shields.io/badge/Material_for_MkDocs-526CFE?style=for-the-badge&logo=MaterialForMkDocs&logoColor=white)](https://squidfunk.github.io/mkdocs-material/)

---

## Deep Dive Tutorial

[![WATCH THE VIDEO HERE](https://img.youtube.com/vi/3d7UrRNri6Q/0.jpg)](https://www.youtube.com/watch?v=3d7UrRNri6Q)

---

Thanks to the original author and past maintainers:

- Forked from: https://github.com/zhrexl/DrawOnYourScreen2
- Original work: https://codeberg.org/som/DrawOnYourScreen
