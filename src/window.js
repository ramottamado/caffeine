/* window.js
 *
 * Copyright 2026 Tamado Sitohang
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

export const CaffeineWindow = GObject.registerClass({
    GTypeName: 'CaffeineWindow',
    Template: 'resource:///codes/tamado/Caffeine/window.ui',
    InternalChildren: ['label'],
}, class CaffeineWindow extends Adw.ApplicationWindow {
    _inhibitCookie = 0;  // 0 means not inhibited

    constructor(application) {
        super({ application });

        this.connect('destroy', () => this._releaseInhibit());

        this._startInhibit();
    }

    _startInhibit() {
        if (this._inhibitCookie !== 0)
            return;  // already inhibiting, don't stack cookies

        this._inhibitCookie = this.application.inhibit(
            this,                                    // window (can be null)
            Gtk.ApplicationInhibitFlags.SUSPEND,     // prevent suspend
            'Caffeine is keeping the system awake'   // reason shown to the user
        );
    }

    _releaseInhibit() {
        if (this._inhibitCookie === 0)
            return;  // nothing to release

        this.application.uninhibit(this._inhibitCookie);
        this._inhibitCookie = 0;
    }
});

