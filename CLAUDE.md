# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Caffeine is a GNOME desktop app (GJS + GTK4 + libadwaita) that keeps the system from suspending while its window is open. App ID / D-Bus name / resource path: `codes.tamado.Caffeine` / `/codes/tamado/Caffeine`. Licensed GPL-3.0-or-later; source files carry the GPL header.

## Build & run

Built with Meson; distributed as a Flatpak (manifest: `codes.tamado.Caffeine.json`, GNOME runtime 51). Note that the devcontainer image does not include `meson`, `gjs`, or `flatpak-builder` — these must be run on a host with them installed.

```sh
# Native build
meson setup _build
meson compile -C _build
meson test -C _build          # validates .desktop, metainfo, and gschema files (skipped if validators are missing)
meson install -C _build

# Flatpak (manifest uses a local "dir" source, so it builds the working tree)
flatpak-builder --user --install --force-clean build codes.tamado.Caffeine.json
flatpak run codes.tamado.Caffeine
```

There are no unit tests or linters configured; `meson test` only runs the data-file validators defined in `data/meson.build`.

## Architecture

- **Launcher**: `src/codes.tamado.Caffeine.in` is configured by Meson into a `gjs -m` script that calls `imports.package.init(...)` and dynamically imports `resource:///codes/tamado/Caffeine/js/main.js`. JS is never loaded from the filesystem at runtime.
- **GResources**: two bundles are compiled and installed to `$datadir/caffeine/`:
  - `codes.tamado.Caffeine.src.gresource.xml` — JS modules under `/codes/tamado/Caffeine/js/`
  - `codes.tamado.Caffeine.data.gresource.xml` — UI templates under `/codes/tamado/Caffeine/`

  **Adding a new JS file or `.ui` file requires registering it in the corresponding gresource XML**, and files with translatable strings must also be added to `po/POTFILES.in`.
- **`src/main.js`**: `CaffeineApplication` (`Adw.Application`) — defines `app.quit` (Ctrl+Q) and `app.about` actions, creates the window on activate. Calls `pkg.initGettext()` so `_()` is available globally.
- **`src/window.js` + `src/window.ui`**: `CaffeineWindow` (`Adw.ApplicationWindow`) bound to the UI template via `GObject.registerClass({ Template })`. The core behavior lives here: on construction it calls `application.inhibit(..., Gtk.ApplicationInhibitFlags.SUSPEND, ...)` and releases the cookie on `destroy`. `_inhibitCookie === 0` means "not inhibiting"; guards prevent stacking or double-releasing cookies.
- **`data/`**: desktop file, AppStream metainfo, D-Bus service, (currently empty) GSettings schema, and icon. `.in` files are processed by Meson (i18n merge or `configure_file`).

## Conventions

- GObject classes are defined with `GObject.registerClass` and exported as `const`; private members use a leading underscore (`_startInhibit`).
- Imports use `gi://` URIs; `main.js` pins versions (`Gtk?version=4.0`, `Adw?version=1`), other modules import unversioned.
- Version `0.1.0` is duplicated in `meson.build` and the About dialog in `main.js` — update both together.
