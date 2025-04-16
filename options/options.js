'use strict';

/**
 * Classe pour gérer les topics.
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
   * Crée un conteneur pour un topic donné.
   * @param {string} sectionName - Le nom de la section.
   * @param {object} preferences - Les préférences utilisateur.
   * @returns {HTMLDivElement} - Le conteneur HTML.
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
   * Crée un élément de sélection pour afficher les options.
   * @param {string} sectionName - Le nom de la section.
   * @param {string} selectedTopic - Le topic sélectionné.
   * @returns {HTMLSelectElement} - L'élément de sélection.
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
   * Crée un élément de sélection pour les modes.
   * @param {string} sectionName - Le nom de la section.
   * @param {string} topic - Le topic sélectionné.
   * @param {string} selectedMode - Le mode sélectionné.
   * @returns {HTMLSelectElement} - L'élément de sélection.
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
   * Crée un élément pour la sélection de la couleur.
   * @param {string} sectionName - Le nom de la section.
   * @param {string} topic - Le topic sélectionné.
   * @param {string} highlightColor - La couleur de surlignage.
   * @returns {HTMLInputElement} - L'élément d'entrée de couleur.
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
   * Crée un élément pour afficher le nom du topic.
   * @param {string} sectionName - Le nom de la section.
   * @returns {HTMLLabelElement} - L'élément de label.
   */
  createTopicElement(sectionName) {
    const label = document.createElement('label');
    label.textContent = sectionName;
    return label;
  }

  /**
   * Configure les événements pour les éléments de sélection.
   * @param {HTMLSelectElement} selectElement - L'élément de sélection.
   * @param {HTMLSelectElement} modeElement - L'élément de sélection des modes.
   * @param {HTMLInputElement} colorElement - L'élément d'entrée de couleur.
   */
  setupSelectEventListener(selectElement, modeElement, colorElement) {
    selectElement.addEventListener('change', () => {
      const selectedValue = selectElement.value || 'full-line';

      modeElement.disabled = selectedValue !== 'highlight';
      modeElement.value = selectedValue !== 'highlight' ? 'full-line' : selectedValue;
      colorElement.disabled = selectedValue !== 'highlight';
      colorElement.value = this.getColorValue(selectedValue, TopicManager.HIGHLIGHT_COLOR);
      colorElement.classList.toggle('is-visible', selectedValue === 'visible');
      colorElement.classList.toggle('is-hidden', selectedValue === 'hidden');
      colorElement.classList.toggle('is-highlight', selectedValue === 'highlight');
    });
  }

  /**
   * Obtient la valeur de la couleur en fonction du topic.
   * @param {string} topic - Le topic sélectionné.
   * @param {string} highlightColor - La couleur de surlignage.
   * @returns {string} - La valeur de la couleur.
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
 * Classe pour gérer les préférences utilisateur.
 */
class PreferencesManager {
  static NOTIFICATION_DURATION = 2000;

  /**
   * Constructeur de la classe PreferencesManager.
   */
  constructor() {
    this.topicManager = new TopicManager();
  }

  /**
   * Prépare les options en récupérant les données depuis le serveur.
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
      document.querySelector('label[for=refreshRate]').textContent = `Période de rafraîchissement ${time} minutes`;

      doc.querySelectorAll('.forumtitle').forEach(title => {
        const sectionName = title.textContent.trim();
        const sectionElement = this.topicManager.create(sectionName, preferences);
        sectionsContainer.appendChild(sectionElement);
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Erreur lors de la récupération des sections :', error);
    }
  }

  /**
   * Configure les événements pour les éléments de l'interface utilisateur.
   */
  setupEventListeners() {
    document.getElementById('refreshRate').addEventListener('input', (e) => {
      document.querySelector('label[for=refreshRate]').textContent = `Période de rafraîchissement ${e.target.value} minutes`;
    });

    document.getElementById('save').addEventListener('click', async () => {
      try {
        const preferences = this.collectPreferences();
        await browser.storage.sync.set(preferences);
        this.showNotification('Préférences enregistrées !');

        const tabs = await browser.tabs.query({ url: '*://www.casusno.fr/*' });
        tabs.forEach(tab => {
          browser.tabs.sendMessage(tab.id, { action: 'updatePreferences' })
            .catch(error => console.error('Erreur lors de la sauvegarde des tabs :', error));
        });

        this.showNotification('Préférences enregistrées.');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des préférences :', error);
      }
    });

    document.getElementById('reset').addEventListener('click', async () => {
      try {
        await browser.storage.sync.clear();

        const tabs = await browser.tabs.query({ url: '*://www.casusno.fr/*' });
        tabs.forEach(tab => browser.tabs.sendMessage(tab.id, { action: 'updatePreferences' }));

        window.location.reload();
      } catch (error) {
        console.error('Erreur lors de la réinitialisation des préférences :', error);
      }
    });
  }

  /**
   * Collecte les préférences utilisateur depuis l'interface.
   * @returns {{topics: {}, colors: {}, modes: {}, refreshRate: number}} - Les préférences collectées.
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
   * Affiche une notification à l'utilisateur.
   * @param {string} message - Le message à afficher.
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

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  const preferencesManager = new PreferencesManager();
  preferencesManager.prepareOptions().catch(console.error);
});
