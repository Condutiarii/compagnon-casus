'use strict';

/**
 * Classe pour suivre le nombre de notifications sur CasusNo.
 */
class OnlineTracker {
  static NOTIFICATION_SELECTOR = '#notification_list_button strong.badge';
  static CASUS_NO_URL = 'https://www.casusno.fr/';
  static UNREAD_POSTS_URL = 'https://www.casusno.fr/search.php?search_id=unreadposts';

  /**
   * Constructeur de la classe OnlineTracker.
   */
  constructor() {
    this.init();
  }

  /**
   * Récupère le nombre de notifications depuis le site.
   * @returns {Promise<string|null>} Le nombre de notifications ou null en cas d'erreur.
   */
  async fetchOnlineNotifications() {
    try {
      const response = await fetch(OnlineTracker.CASUS_NO_URL);
      if (!response.ok) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error('Erreur réseau');
      }
      const html = await response.text();
      return this.parseCount(html);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications :', error);
      return null;
    }
  }

  /**
   * Analyse le HTML pour extraire le nombre de notifications en ligne.
   * @param {string} html - Le contenu HTML de la page.
   * @returns {string} Le nombre de notifications ou "X" si non trouvé.
   */
  parseCount(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const element = doc.querySelector(OnlineTracker.NOTIFICATION_SELECTOR);
    return element?.textContent.trim() || 'X';
  }

  /**
   * Met à jour le badge de l'extension avec le nombre de notifications en ligne.
   * @param {string|null} count - Le nombre de notifications en ligne.
   */
  updateBadge(count) {
    const text = count?.toString() || '?';
    const action = browser.browserAction;

    const color = text === 'X' ? '#555' : '#f00';
    action.setBadgeBackgroundColor({ color }).catch(console.error);
    action.setBadgeTextColor({ color: '#fff' }).catch(console.error);
    action.setBadgeText({ text }).catch(console.error);
  }

  /**
   * Rafraîchit le nombre de notifications et met à jour le badge.
   */
  async refresh() {
    const count = await this.fetchOnlineNotifications();
    if (count) {
      this.updateBadge(count);
    }
  }

  /**
   * Initialise l'extension en configurant les alarmes et les écouteurs d'événements.
   */
  init() {
    // Premier chargement
    this.refresh().catch(console.error);

    browser.storage.sync.get().then(preferences => {
      // Mise à jour périodique
      const refreshRate = preferences.refreshRate ?? 5;
      browser.alarms.create('autoRefresh', { periodInMinutes: refreshRate });
      browser.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'autoRefresh') {
          this.refresh().catch(console.error);
        }
      });
    }).catch(console.error);

    // Mise à jour manuelle au clic
    browser.browserAction.onClicked.addListener(() => {
      this.refresh().catch(console.error);
      browser.tabs.create({ url: OnlineTracker.UNREAD_POSTS_URL }).catch(console.error);
    });

    // Écouter les mises à jour des onglets
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url.includes(OnlineTracker.CASUS_NO_URL)) {
        this.refresh().catch(console.error);
      }
    });
  }
}

// Initialisation de l'extension
new OnlineTracker();
