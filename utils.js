export const UUID = 'draw-on-gnome@daveprowse.github.io';
export const CURATED_UUID = UUID.replace(/@/gi, '_at_').replace(/[^a-z0-9+_-]/gi, '_');

/**
 * Parse GNOME Shell version string to a comparable number
 * Converts version strings like "45.2" or "46.0" to numeric values
 * @param {string} versionString - Version string (default: current shell version)
 * @returns {number} - Numeric version for comparison
 */
export function parseShellVersion(versionString) {
    const parts = versionString.split('.');
    const major = parseInt(parts[0], 10) || 0;
    const minor = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
    // Returns major.minor as a float (e.g., "45.2" becomes 45.02)
    return major + (minor / 100);
}

/**
 * Get only the major version number
 * @param {string} versionString - Version string
 * @returns {number} - Major version number
 */
export function getShellMajorVersion(versionString) {
    return parseInt(versionString.split('.')[0], 10) || 0;
}

// Only import Config in the shell context, not in prefs
let PACKAGE_VERSION;
try {
    const Config = await import('resource:///org/gnome/shell/misc/config.js');
    PACKAGE_VERSION = Config.PACKAGE_VERSION;
} catch (e) {
    // We're in prefs context, Config is not available
    // This is okay - prefs don't need version checks
    PACKAGE_VERSION = '0.0';
}

// Export parsed version for convenience
export const SHELL_VERSION = parseShellVersion(PACKAGE_VERSION);
export const SHELL_MAJOR_VERSION = getShellMajorVersion(PACKAGE_VERSION);