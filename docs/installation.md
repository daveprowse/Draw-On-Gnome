# Installation

There are a couple of ways to install Draw On Gnome. This will depend on your version of GNOME.

!!! note "There are Many GNOME Versions!"

    To find out your version of GNOME open a terminal and type `gnome-shell --version` or go to **Settings > System > About > System Details**(1).
    { .annotate }
    
    1.  :man_raising_hand: Another fun way is to use the `fastfetch` or `neofetch` programs!

## Option 1: Install from GNOME Extensions (ver. 48/49)

[<img src="https://github.com/daveprowse/Draw-On-Gnome/raw/main/media/gnome-extensions.png" width="250">](https://extensions.gnome.org/extension/7921/draw-on-gnome/)

> **IMPORTANT!!**: Currently, this will only install to GNOMEv48 and v49. If you need the extension for another version of GNOME, see Option 2.

## Option 2: Use the Automated Script

This method will work for any version of GNOME from v40 - v49, and v3.24 - v.3.38

1. Copy the following command to your *Bash* terminal and press `enter` to run it:

    ```console
    bash <(wget -qO- https://raw.githubusercontent.com/daveprowse/scripts/refs/heads/main/dog-install.sh)
    ```

    !!! warning

        **IMPORTANT!!** Always check scripts before running them! If you are uncomfortable running the script, or cannot run the script, then install manually with [Option #2](#option-2-install-manually-from-the-release-or-repository-branch) below.

    > Note: The script will identify your version of GNOME and install the correct version of the extension automatically.

    > Note: You may need to enter your sudo password during the install. Make sure you are a sudoer!

2. When the installation process is complete, logout and log back in.

3. Then, enable the extension:

    - **In the GUI**

        - Open the GNOME Extensions App:

            `gnome-extensions-app`

        - Locate Draw On Gnome and enable it.

            !!! tip annotate

                You can install the Gnome Extensions App package within your Linux distribution(1).

            1.  :man_raising_hand: For example:
                - in most Linux: `sudo dnf install gnome-extensions-app`.
                - otherwise: `sudo apt install gnome-shell-extensions-prefs`.
    
    - **In the CLI:**
        
        ```console
        gnome-extensions enable draw-on-gnome@daveprowse.github.io
        ```

        !!! note

            For GNOME version 45 and older you will need to type: <br>
            `gnome-extensions enable draw-on-your-screen3@daveprowse.github.io`

    

4. Use the tool by pressing `Super + Alt + D`. 

Remember that this extension has a minimalist "look". Everything is controlled via keyboard shortcuts.(1) For basic usage, see [this link](basic-usage.md).
{ .annotate }

1.  :man_raising_hand: To view all of the shortcuts while working in the extension press `Ctrl + F1`.

**Have fun!**

---

## Option 3: Install Manually from the Release or Repository Branch

For those of you who would rather install manually, find your version of GNOME and follow the directions.

### GNOME v49/48

1. Download or clone the extension.

    **Download option:**
  
    ```console
    wget https://github.com/daveprowse/Draw-On-Gnome/releases/download/D.O.G.-ver-1.6/Draw-On-Gnome-ver-1-6.tar.xz
    ```

    Then, decompress the tar file:

    ```console
    tar -xvf Draw-On-GNOME-ver-1-6.tar.xz
    ```

    **Clone option (GIVES LATEST WORKING VERSION):**
  
    ```console
    git clone https://github.com/daveprowse/Draw-On-Gnome
    ```

2. Place the directory (the one that contains `metadata.json`) in `~/.local/share/gnome-shell/extensions` (If the extensions directory doesn't exist, create it inside of gnome-shell/.)
3. Change the directory name to `draw-on-gnome@daveprowse.github.io`
4. Restart your session:

    - (Wayland) - Log out and log back in
    - (Xorg) - Type `alt + F2` and `r` to restart the gnome-shell

5. Enable the extension with GNOME Extensions command or application
6. `Super + Alt + D` to test. For basic usage, see [this link](basic-usage.md).

*Issues?* Let us know at [this link](https://github.com/daveprowse/Draw-On-Gnome/issues).

**ENJOY!**

### GNOME v47 and v46

1. Download the extension.

    **Download option:**
  
    ```console
    wget https://github.com/daveprowse/Draw-On-Gnome/releases/download/D.O.G.-ver-1.1/Draw-On-Gnome-ver-1-1.tar.xz
    ```

    Then, decompress the tar file:

    ```console
    tar -xvf Draw-On-GNOME-ver-1-1.tar.xz
    ```

Follow steps 2-6 from the procedure above.

---

### GNOME v45

Download or clone this repository branch

   - Download option:
  
      ```console
      wget https://github.com/daveprowse/Draw-On-Gnome/releases/download/v14.0-GNOME-v45/GNOMEv45.tar.xz
      ```

Then, decompress the tar file: `tar -xvf GNOMEv45.tar.xz`

- Clone option:
  
    ```console
    git clone -b GNOMEv45 https://github.com/daveprowse/Draw-On-Gnome
    ```

Follow steps 2-6 from the procedure above.

### GNOME v42 - 44

Download or clone this repository branch

- Download option:

    ```console
    wget https://github.com/daveprowse/Draw-On-Gnome/releases/download/v13.0-GNOME-v42-v44/GNOMEv42.tar.xz
    ```

    Then, decompress the tar file: `tar -xvf GNOMEv42.tar.xz`

- Clone option:
  
    ```console
    git clone -b GNOMEv42 https://github.com/daveprowse/Draw-On-Gnome
    ```

Follow steps 2-6 from the procedure above.

### GNOME v3.xx, v40, and v41

Download or clone this repository branch

- Download option:

    ```console
    wget https://github.com/daveprowse/Draw-On-Gnome/releases/download/v11.2/GNOMEv41.tar.xz
    ```

    Then, decompress the tar file: `tar -xvf GNOMEv41.tar.xz`

- Clone option:
  
    ```console
    git clone -b GNOMEv41 https://github.com/daveprowse/Draw-On-Gnome
    ```

Follow steps 2-6 from the procedure above.

---
