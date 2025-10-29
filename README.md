# Draw On Gnome

Annotate your GNOME™ desktop with **`Super+Alt+D`**.

Documentation is **[here](https://daveprowse.github.io/Draw-On-Gnome/)**. For news, click **[here](https://daveprowse.github.io/Draw-On-Gnome/blog/)**.

Thank you to all the contributors! 😎

## Features

- Draw over applications
- Basic shapes (rectangle, circle, ellipse, line, curve, polygon, polyline, arrow, text, image, free)
- Basic transformations (move, rotate, resize, stretch, mirror, inverse)
- Blackboard and Grid
- Keep drawings on desktop background with persistence
- Multi-monitor support
- Save your work with `Ctrl+S`!!

## Installation

> Note: We are working on getting the extension approved by GNOME so that it will be listed on https://extensions.gnome.org (E.G.O.) 

> Stay tuned! Click [here](https://daveprowse.github.io/Draw-On-Gnome/blog/) for updates.

---

1. Copy the following command to a *Bash* terminal and press `enter` to run it:

   ```bash
   bash <(wget -qO- https://raw.githubusercontent.com/daveprowse/scripts/refs/heads/main/dog-install.sh)
   ```

   The script will attempt to identify your version of GNOME and install the correct version of the extension automatically. 
   
   > Note: Currently, the script will identify GNOME v49 through v40 and back all the way to v3.xx.

   > Note: Note: You may need to enter your sudo password during the install. Make sure you are a sudoer!

   > **IMPORTANT!!** Always check scripts before running them! If you are uncomfortable running the script, or cannot run the script, then install manually with an option listed in the [Documentation](https://daveprowse.github.io/Draw-On-Gnome/installation/).

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

📖 For manual installation procedures (git clone and tarball) see the **[Documentation](https://daveprowse.github.io/Draw-On-Gnome/installation/)**.

> Documentation is generated using Material for Mkdocs. Check it out:
> [![Built with Material for MkDocs](https://img.shields.io/badge/Material_for_MkDocs-526CFE?style=for-the-badge&logo=MaterialForMkDocs&logoColor=white)](https://squidfunk.github.io/mkdocs-material/)

---

Thanks to the original author and past maintainers:

- Forked from: https://github.com/zhrexl/DrawOnYourScreen2
- Original work: https://codeberg.org/som/DrawOnYourScreen
