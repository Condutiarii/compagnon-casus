'use strict';

/**
 * Gère l'insertion et la maintenance des règles CSS dynamiques.
 */
class StyleManager {
  /**
   * @param {string[]} cssRules - Liste des règles CSS à insérer.
   */
  constructor(cssRules) {
    this.cssRules = cssRules;
    this.styleElement = null;
  }

  /**
   * Insère les règles CSS dans le document de façon encapsulée.
   * Crée un style dédié pour éviter les conflits et garantir l'ordre d'insertion.
   */
  insertCSSRules() {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.type = 'text/css';
      document.head.appendChild(this.styleElement);
    }
    const sheet = this.styleElement.sheet;
    // Nettoie d'abord les anciennes règles si besoin
    while (sheet.cssRules.length) {
      sheet.deleteRule(0);
    }
    this.cssRules.forEach(rule => {
      sheet.insertRule(rule, sheet.cssRules.length);
    });
  }

  /**
   * Permet d'ajouter dynamiquement une règle CSS.
   * @param {string} rule - La règle CSS à ajouter.
   */
  addRule(rule) {
    this.cssRules.push(rule);
    this.insertCSSRules();
  }
}

/**
 * Applique les préférences utilisateur sur les éléments du forum.
 */
class PreferenceStyler {
  static BASE_CSS = '.casus-no-post { opacity: 0.33; }';
  static LINE_SELECTOR = 'dl.row-item';
  static BOX_SELECTOR = '.responsive-hide.left-box';
  static TOPIC_SELECTOR = '.topictitle';
  static THEME_SELECTOR = 'a:not([class])';

  /**
   * @param {object} preferences - Préférences utilisateur.
   */
  constructor(preferences) {
    this.preferences = preferences;
    this.styleManager = new StyleManager([PreferenceStyler.BASE_CSS]);
    this.styleManager.insertCSSRules();
    this.index = 0;
  }

  /**
   * Applique les styles sur tous les éléments ciblés.
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
            item.classList.add(className);
            break;
          default:
            title.classList.add(className);
        }
      }
    });
  }

  /**
   * Ajoute une classe CSS dynamique pour les éléments en surbrillance.
   * @param {string} topic - Le type de topic (highlight, hidden).
   * @param {string} mode - Le mode d'affichage (full-line, color-title).
   * @param {string} color - La couleur à appliquer.
   * @returns {string} - Le nom de la classe CSS ajoutée.
   */
  addClass(topic, mode, color) {
    const className = `casus-${mode}-${this.index++}`;
    const type = mode !== 'color-title' ? 'background-' : '';
    this.styleManager.addRule(`.${className} { ${type}color: ${color}; }`);
    return className;
  }
}

/**
 * Orchestration de la gestion des préférences et de l'application des styles.
 */
class DisplayManager {
  constructor() {}

  /**
   * Initialise l'application : insère le CSS et applique les préférences.
   */
  async apply() {
    try {
      const preferences = await browser.storage.sync.get();
      const styler = new PreferenceStyler(preferences);
      styler.applyStyles();

      // Recharge les onglets ouverts si les préférences sont modifiées
      browser.runtime.onMessage.addListener((message) => {
        if (message.action === 'updatePreferences') {
          window.location.reload();
          return Promise.resolve({ response: true });
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'application des préférences :', error);
    }
  }

  /**
   * Factory statique pour créer une instance.
   * @returns {DisplayManager} - Une nouvelle instance de DisplayManager.
   */
  static create() {
    return new DisplayManager();
  }
}

// Applique les préférences
DisplayManager.create().apply().catch(console.error);
