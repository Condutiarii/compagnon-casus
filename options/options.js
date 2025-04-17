'use strict';

/**
 * Class to manage topics.
 */
class TopicManager {
  static DEFAULT_COLOR = '#1c1b22';
  static HIGHLIGHT_COLOR = '#e4dcbd';
  static DISPLAY_OPTION = {
    visible: 'Visible',
    hidden: 'Masqué',
    highlight: 'En évidence',
  };
  static MODE_OPTION = {
    'full-line': 'Ligne complète',
    'highlight-title': 'Surlignage du titre',
    'color-title': 'Coloration du titre',
  };

  /**
   * Creates a container for a given topic.
   * @param {string} sectionName - The name of the section.
   * @param {object} preferences - User preferences.
   * @returns {HTMLDivElement} - The HTML container.
   */
  create(sectionName, preferences) {
    const topic = preferences.topics?.[sectionName] || 'visible';
    const color = preferences.colors?.[sectionName] || TopicManager.DEFAULT_COLOR;
    const mode = preferences.modes?.[sectionName] || 'full-line';

    const displayElement = this.createDisplayElement(sectionName, topic);
    const modeElement = this.createModeElement(sectionName, topic, mode);
    const colorElement = this.createColorElement(sectionName, topic, color);
    const topicElement = this.createTopicElement(sectionName);

    const container = document.createElement('div');
    container.append(displayElement, modeElement, colorElement, topicElement);

    this.setupSelectEventListener(displayElement, modeElement, colorElement);

    return container;
  }

  /**
   * Creates a selection element for display options.
   * @param {string} sectionName - The name of the section.
   * @param {string} selectedTopic - The selected topic.
   * @returns {HTMLSelectElement} - The selection element.
   */
  createDisplayElement(sectionName, selectedTopic) {
    const select = document.createElement('select');
    select.id = sectionName;

    Object.entries(TopicManager.DISPLAY_OPTION).forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      option.selected = value === selectedTopic;
      select.add(option);
    });

    return select;
  }

  /**
   * Creates a selection element for modes.
   * @param {string} sectionName - The name of the section.
   * @param {string} topic - The selected topic.
   * @param {string} selectedMode - The selected mode.
   * @returns {HTMLSelectElement} - The selection element.
   */
  createModeElement(sectionName, topic, selectedMode) {
    const select = document.createElement('select');
    select.dataset.selectId = sectionName;
    select.disabled = topic !== 'highlight';

    Object.entries(TopicManager.MODE_OPTION).forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      option.selected = value === selectedMode;
      select.add(option);
    });

    return select;
  }

  /**
   * Creates an element for color selection.
   * @param {string} sectionName - The name of the section.
   * @param {string} topic - The selected topic.
   * @param {string} highlightColor - The highlight color.
   * @returns {HTMLInputElement} - The color input element.
   */
  createColorElement(sectionName, topic, highlightColor) {
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.disabled = topic !== 'highlight';
    colorInput.value = this.getColorValue(topic, highlightColor);
    colorInput.dataset.selectId = sectionName;
    colorInput.classList.toggle('is-' + topic);

    return colorInput;
  }

  /**
   * Creates an element to display the topic name.
   * @param {string} sectionName - The name of the section.
   * @returns {HTMLLabelElement} - The label element.
   */
  createTopicElement(sectionName) {
    const label = document.createElement('label');
    label.textContent = sectionName;
    return label;
  }

  /**
   * Sets up event listeners for selection elements.
   * @param {HTMLSelectElement} selectElement - The selection element.
   * @param {HTMLSelectElement} modeElement - The mode selection element.
   * @param {HTMLInputElement} colorElement - The color input element.
   */
  setupSelectEventListener(selectElement, modeElement, colorElement) {
    selectElement.addEventListener('change', () => {
      const selectedValue = selectElement.value || 'full-line';

      modeElement.disabled = selectedValue !== 'highlight';
      modeElement.value = selectedValue !== 'highlight' ? 'full-line' : modeElement.value ?? 'full-line';
      colorElement.disabled = selectedValue !== 'highlight';
      colorElement.value = this.getColorValue(selectedValue, TopicManager.HIGHLIGHT_COLOR);
      colorElement.classList.toggle('is-visible', selectedValue === 'visible');
      colorElement.classList.toggle('is-hidden', selectedValue === 'hidden');
      colorElement.classList.toggle('is-highlight', selectedValue === 'highlight');
    });
  }

  /**
   * Gets the color value based on the topic.
   * @param {string} topic - The selected topic.
   * @param {string} highlightColor - The highlight color.
   * @returns {string} - The color value.
   */
  getColorValue(topic, highlightColor) {
    switch (topic) {
      case 'highlight':
        return highlightColor;
      case 'hidden':
      case 'visible':
      default:
        return TopicManager.DEFAULT_COLOR;
    }
  }
}

/**
 * Class to manage user preferences.
 */
class PreferencesManager {
  static NOTIFICATION_DURATION = 2000;

  /**
   * Constructor for the PreferencesManager class.
   */
  constructor() {
    this.topicManager = new TopicManager();
  }

  /**
   * Prepares options by fetching data from the server.
   * @returns {Promise<void>}
   */
  async prepareOptions() {
    try {
      const response = await fetch('https://www.casusno.fr/');
      const htmlContent = await response.text();
      const doc = new DOMParser().parseFromString(htmlContent, 'text/html');

      const sectionsContainer = document.getElementById('sections');
      const preferences = await browser.storage.sync.get();

      const time = preferences.refreshRate ?? 5;
      document.querySelector('#refreshRate').value = time;
      document.querySelector('label[for=refreshRate]').textContent = `Période de rafraichissement sur ${time} minutes`;

      doc.querySelectorAll('.forumtitle').forEach(title => {
        const sectionName = title.textContent.trim();
        const sectionElement = this.topicManager.create(sectionName, preferences);
        sectionsContainer.appendChild(sectionElement);
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }

  /**
   * Sets up event listeners for UI elements.
   */
  setupEventListeners() {
    document.getElementById('refreshRate').addEventListener('input', (e) => {
      document.querySelector('label[for=refreshRate]').textContent = `Période de rafraichissement sur ${e.target.value} minutes`;
    });

    document.getElementById('save').addEventListener('click', async () => {
      try {
        const preferences = this.collectPreferences();
        await browser.storage.sync.set(preferences);
        this.showNotification('Preferences saved!');

        const tabs = await browser.tabs.query({ url: '*://www.casusno.fr/*' });
        tabs.forEach(tab => {
          browser.tabs.sendMessage(tab.id, { action: 'updatePreferences' })
            .catch(error => console.error('Error saving tabs:', error));
        });

        this.showNotification('Preferences saved.');
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    });

    document.getElementById('reset').addEventListener('click', async () => {
      try {
        await browser.storage.sync.clear();

        const tabs = await browser.tabs.query({ url: '*://www.casusno.fr/*' });
        tabs.forEach(tab => browser.tabs.sendMessage(tab.id, { action: 'updatePreferences' }));

        window.location.reload();
      } catch (error) {
        console.error('Error resetting preferences:', error);
      }
    });
  }

  /**
   * Collects user preferences from the UI.
   * @returns {{topics: {}, colors: {}, modes: {}, refreshRate: number}} - The collected preferences.
   */
  collectPreferences() {
    const preferences = { topics: {}, colors: {}, modes: {}, refreshRate: 5 };

    document.querySelectorAll('select').forEach(select => {
      preferences.topics[select.id] = select.value;
      preferences.refreshRate = parseInt(document.getElementById('refreshRate').value);

      if (select.value === 'highlight') {
        const color = document.querySelector(`input[type="color"][data-select-id="${select.id}"]`);
        const mode = document.querySelector(`select[data-select-id="${select.id}"]`);
        preferences.colors[select.id] = color.value;
        preferences.modes[select.id] = mode.value;
      }
    });

    return preferences;
  }

  /**
   * Displays a notification to the user.
   * @param {string} message - The message to display.
   */
  showNotification(message) {
    const notificationElement = document.getElementById('notification');

    notificationElement.textContent = message;
    notificationElement.classList.remove('hidden');

    setTimeout(() => {
      notificationElement.classList.add('hidden');
    }, PreferencesManager.NOTIFICATION_DURATION);
  }
}

// Initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const preferencesManager = new PreferencesManager();
  preferencesManager.prepareOptions().catch(console.error);
});
