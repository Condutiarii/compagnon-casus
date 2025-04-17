'use strict';

/**
 * Manages the insertion and maintenance of dynamic CSS rules.
 */
class StyleManager {
  /**
   * @param {string[]} cssRules - List of CSS rules to insert.
   */
  constructor(cssRules = []) {
    this.cssRules = cssRules;
    this.styleElement = null;
  }

  /**
   * Inserts CSS rules into the document in an encapsulated manner.
   * Creates a dedicated style element to avoid conflicts and ensure the order of insertion.
   */
  insertCSSRules() {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.type = 'text/css';
      document.head.appendChild(this.styleElement);
    }
    const sheet = this.styleElement.sheet;
    // First, clear any existing rules if necessary
    while (sheet.cssRules.length) {
      sheet.deleteRule(0);
    }
    this.cssRules.forEach(rule => {
      sheet.insertRule(rule, sheet.cssRules.length);
    });
  }

  /**
   * Allows dynamically adding a CSS rule.
   * @param {string} rule - The CSS rule to add.
   */
  addRule(rule) {
    this.cssRules.push(rule);
    this.insertCSSRules();
  }
}

/**
 * Applies user preferences to forum elements.
 */
class PreferenceStyler {
  static BASE_CSS = '.casus-no-post { opacity: 0.33; }';
  static LINE_SELECTOR = 'dl.row-item';
  static BOX_SELECTOR = '.responsive-hide.left-box';
  static ICON_SELECTOR = 'i.icon';
  static TOPIC_SELECTOR = '.topictitle';
  static THEME_SELECTOR = 'a:not([class])';
  static SHADOW_STYLE = 'text-shadow: 1px 0 0 rgba(0, 0, 0, 1),-1px 0 0 rgba(0, 0, 0, 1),0 1px 0 rgba(0, 0, 0, 1),0 -1px 0 rgba(0, 0, 0, 1);';
  static ORIGINAL_ICON = 'fa-file';

  /**
   * @param {object} preferences - User preferences.
   */
  constructor(preferences) {
    this.preferences = preferences;
    this.styleManager = new StyleManager([PreferenceStyler.BASE_CSS]);
    this.styleManager.insertCSSRules();
    this.index = 0;
  }

  /**
   * Applies styles to all targeted elements.
   */
  applyStyles() {
    document.querySelectorAll(PreferenceStyler.LINE_SELECTOR).forEach(item => {
      const box = item.querySelector(PreferenceStyler.BOX_SELECTOR);
      const title = item.querySelector(PreferenceStyler.TOPIC_SELECTOR);
      if (!box || !title) {
        return;
      }
      const thematic = box.querySelector(PreferenceStyler.THEME_SELECTOR);
      if (!thematic) {
        return;
      }
      const icon = item.querySelector(PreferenceStyler.ICON_SELECTOR);
      const themeName = thematic.textContent.trim();
      const topic = this.preferences.topics?.[themeName];
      const mode = this.preferences.modes?.[themeName];
      const color = this.preferences.colors?.[themeName];

      if (topic === 'hidden') {
        item.classList.add('casus-no-post');
      } else if (topic === 'highlight') {
        const className = this.addClass(topic, mode, color);
        switch (mode) {
          case 'full-line':
            this.changeDisplay(item, icon, className, color);
            break;
          case 'highlight-title':
            this.changeDisplay(title, icon, className, color);
            break;
          case 'color-title':
            this.changeDisplay(title, icon, className, color, 'fa-exclamation-triangle');
            break;
          default:
            title.classList.add(className);
        }
      }
    });
  }

  /**
   * Changes the display of the forum thread line.
   * @param {Element} item - The element to style.
   * @param {Element} icon - The icon to style.
   * @param {string} className - The CSS class name to add.
   * @param {string} color - The color to apply.
   * @param {string} [iconType=''] - The icon type to use.
   */
  changeDisplay(item, icon, className, color, iconType = '') {
    const style = iconType === '' ? PreferenceStyler.SHADOW_STYLE : '';
    icon.setAttribute('style', `color: ${color}; ${style}`);
    item.classList.add(className);
    if (iconType) {
      icon.classList.remove(PreferenceStyler.ORIGINAL_ICON);
      icon.classList.add(iconType);
    }
  }

  /**
   * Adds a dynamic CSS class for highlighted elements.
   * @param {string} topic - The topic type (highlight, hidden).
   * @param {string} mode - The display mode (full-line, color-title).
   * @param {string} color - The color to apply.
   * @returns {string} - The name of the added CSS class.
   */
  addClass(topic, mode, color) {
    const className = `casus-${mode}-${this.index++}`;
    const type = mode !== 'color-title' ? 'background-' : '';
    this.styleManager.addRule(`.${className} { ${type}color: ${color}; }`);
    return className;
  }
}

/**
 * Orchestrates the management of preferences and the application of styles.
 */
class DisplayManager {
  constructor() {}

  /**
   * Initializes the application: inserts CSS and applies preferences.
   */
  async apply() {
    try {
      const preferences = await browser.storage.sync.get();
      const styler = new PreferenceStyler(preferences);
      styler.applyStyles();

      // Reload open tabs if preferences are modified
      browser.runtime.onMessage.addListener((message) => {
        if (message.action === 'updatePreferences') {
          window.location.reload();
          return Promise.resolve({ response: true });
        }
      });
    } catch (error) {
      console.error('Error applying preferences:', error);
    }
  }

  /**
   * Static factory to create an instance.
   * @returns {DisplayManager} - A new instance of DisplayManager.
   */
  static create() {
    return new DisplayManager();
  }
}

// Apply preferences
DisplayManager.create().apply().catch(console.error);
