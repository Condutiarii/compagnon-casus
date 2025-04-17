'use strict';

/**
 * Class to track the number of notifications on CasusNo.
 */
class OnlineTracker {
  static NOTIFICATION_SELECTOR = '#notification_list_button strong.badge';
  static CASUS_NO_URL = 'https://www.casusno.fr/';
  static UNREAD_POSTS_URL = 'https://www.casusno.fr/search.php?search_id=unreadposts';

  /**
   * Constructor for the OnlineTracker class.
   */
  constructor() {
    this.init();
  }

  /**
   * Fetches the number of notifications from the site.
   * @returns {Promise<string|null>} The number of notifications or null in case of an error.
   */
  async fetchOnlineNotifications() {
    try {
      const response = await fetch(OnlineTracker.CASUS_NO_URL);
      if (!response.ok) {
        throw new Error('Network error');
      }
      const html = await response.text();
      return this.parseCount(html);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return null;
    }
  }

  /**
   * Parses the HTML to extract the number of online notifications.
   * @param {string} html - The HTML content of the page.
   * @returns {string} The number of notifications or "X" if not found.
   */
  parseCount(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const element = doc.querySelector(OnlineTracker.NOTIFICATION_SELECTOR);
    return element?.textContent.trim() || 'X';
  }

  /**
   * Updates the extension's badge with the number of online notifications.
   * @param {string|null} count - The number of online notifications.
   */
  updateBadge(count) {
    const text = count < 1 ? '' : count?.toString() || '?';
    const action = browser.browserAction;

    const color = text === 'X' ? '#555' : '#d90000';
    action.setBadgeBackgroundColor({ color }).catch(console.error);
    action.setBadgeTextColor({ color: '#fff' }).catch(console.error);
    action.setBadgeText({ text }).catch(console.error);
  }

  /**
   * Refreshes the number of notifications and updates the badge.
   */
  async refresh() {
    const count = await this.fetchOnlineNotifications();
    if (count) {
      this.updateBadge(count);
    }
  }

  /**
   * Initializes the extension by setting up alarms and event listeners.
   */
  init() {
    // Initial load
    this.refresh().catch(console.error);

    browser.storage.sync.get().then(preferences => {
      // Periodic update
      this.createOrUpdateAlarm(preferences.refreshRate ?? 5);
      browser.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'autoRefresh') {
          this.refresh().catch(console.error);
        }
      });
    }).catch(console.error);

    // Manual update on click
    browser.browserAction.onClicked.addListener(() => {
      this.refresh().catch(console.error);
      browser.tabs.create({ url: OnlineTracker.UNREAD_POSTS_URL }).catch(console.error);
    });

    // Listen for tab updates
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url.includes(OnlineTracker.CASUS_NO_URL)) {
        this.refresh().catch(console.error);
      }
    });

    // Handle changes to the refresh rate
    browser.storage.sync.onChanged.addListener((changes) => {
      if (changes.refreshRate) {
        this.createOrUpdateAlarm(changes.refreshRate.newValue);
      }
    });
  }

  /**
   * Updates the alarm.
   * @param {number} refreshRate - The refresh rate in minutes.
   */
  createOrUpdateAlarm(refreshRate) {
    browser.alarms.clear('autoRefresh').catch(console.error);
    browser.alarms.create('autoRefresh', { periodInMinutes: refreshRate });
  }
}

// Initialize the extension
new OnlineTracker();
