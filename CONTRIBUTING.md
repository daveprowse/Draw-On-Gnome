# Contributing to Draw On Gnome

Thank you for your interest in contributing to **Draw On Gnome**! This document outlines the guidelines and process for submitting contributions.

Have questions or want to discuss ideas first? Join the [Discord Server](https://discord.com/invite/mggw8VGzUp) or start a [Discussion on GitHub](https://github.com/daveprowse/Draw-On-Gnome/discussions/categories/ideas).

---

## Before You Start

Please check the [Roadmap](https://daveprowse.github.io/Draw-On-Gnome/roadmap/) to see what is already planned, in progress, or being discussed. If your idea is already listed, feel free to take a shot at it and open a PR. If it is something new, open a Discussion first so we can talk through the approach before you invest time writing code.

---

## The Most Important Requirement: Cross-Version Testing

Draw On Gnome supports **GNOME 46, 47, 48, 49, and 50**. This is non-negotiable — the extension must work reliably across all supported versions.

**Please test your code on as many of these GNOME versions as you can before submitting a PR.** At minimum, test on the version you developed on and note clearly which versions you tested in your PR description.

### Why This Matters

- In general, there are many distros that use varying levels of GNOME. 
- Ubuntu 24.04 LTS ships GNOME 46 — a huge user base
- Ubuntu 26.04 LTS ships GNOME 50
- Breakage on any supported version affects real users

### Common Cross-Version Pitfalls

- **JavaScript syntax** — avoid modern JS features that older GJS versions don't support. No nullish coalescing (`??`), no optional chaining (`?.`). Use traditional ternary operators and null checks instead.
- **Clutter/Cogl API differences** — `Clutter.Color` vs `Cogl.Color` varies by version. Check `utils.js` for existing compatibility patterns.
- **Cursor API differences** — handled in `areamanager.js`, follow the existing version-check pattern.
- **St widget lifecycle** — be careful with widget initialization order.

---

## Code Guidelines

### No GTK or GDK in Main Extension Files

The extension runs in the GNOME Shell process. GTK and GDK are **not available** here and will cause immediate crashes. These libraries are only permitted in:

- `prefs.js`
- Files inside the `ui/` directory

Main extension files (`area.js`, `areamanager.js`, `helper.js`, `menu.js`, `elements.js`, etc.) may only use:

```javascript
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
// etc.
```

### Logging

Follow the [GJS Extension Port Guide for GNOME 45+](https://gjs.guide/extensions/upgrading/gnome-shell-45.html#logging):

- **Never** use bare `log()` calls
- Use `console.debug()` for debug messages (ideally remove before submitting)
- Use `console.warn()` for warnings
- Use `console.error()` for errors
- Keep `logError(e)` for caught exceptions — this is correct and acceptable

### Clean Up After Yourself

If your contribution adds new widgets, signal handlers, keybindings, or other resources, make sure they are properly destroyed or disconnected in the appropriate `disable()` or `destroy()` method. Memory leaks and lingering handlers will cause issues for users.

### No `schemas/gschemas.compiled`

Do not include a compiled schema file in your PR. It is not needed for GNOME 45+ and will cause a rejection from the GNOME Extensions store reviewer.

---

## Submitting a Pull Request

1. Fork the repository and create your branch from `main`
2. Make your changes
3. Test across as many supported GNOME versions as possible
4. In your PR description, include:
   - What the change does
   - Which GNOME versions you tested on
   - Any known limitations or areas that need further testing
5. Keep PRs focused — one feature or fix per PR where possible

---

## What Happens After You Submit

Pull requests are evaluated and tested across all supported GNOME versions (46–50) before merging. This takes time. The maintainer may:

- Merge your PR as-is
- Merge a modified version of your PR (e.g. reverting a specific change that conflicts with existing behavior) and close the original PR with a note
- Request changes via review comments
- Close the PR if it conflicts with the project direction

Please be patient — cross-version testing across multiple VMs takes time, and this is a one-person maintainer project.

---

## License

By contributing, you agree that your code will be licensed under the [GNU General Public License v3 or later](https://www.gnu.org/licenses/gpl-3.0.html), consistent with the rest of the project.

---

Thanks again for contributing. Every improvement helps the community of GNOME users who rely on this tool! 🎨