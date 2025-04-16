# Compagnon Casus

## Extension Web Firefox

### Comment tester ?

1. Récupéré l'[archive des sources](https://github.com/Condutiarii/compagnon-casus/archive/refs/heads/master.zip) et la décompresser dans le répertoire de votre choix
2. Ouvrir la page de debug sur firefox en tapant **about:debugging**
3. Se rendre sur la section **Ce Firefox** (menu de gauche)
4. Cliquer sur le bouton **Charger un module complémentaire temporaire** en haut de cette page (section **Extensions temporaires**)
5. Lorsque la boîte de dialogue d'ouverture de fichier apparaît, trouver le fichier manifest.json compris dans l'archive

Vous pouvez désormais tester l'extension tant que vous ne fermez pas votre navigateur.

### Fonctionnalités

Il est nécessaire d'avoir une session ouverte sur le site [CasusNo](https://www.casusno.fr/) pour pleinement exploiter l'extension

#### Ouverture d'un onglet

En cliquant sur l'icône de l'extension, elle ouvre la page des *Messages non lus* dont le lien est disponible dans le menu **Raccourcis**.

Si aucune session n'est ouverte, le site redirige vers la page de connexion.

#### Surveillance des notifications

L'icône de l'extension affiche un badge qui permet de connaître le nombre de notifications sur votre compte.
![connecté](/images/notification.png)

Si aucune session n'est ouverte le badge est de couleur grise avec un X blanc indiquant la déconnexion.
![deconnecté](/images/disconnect.png)

La page d'options permet de paramétrer la fréquence du rafraichissement du badge en minutes. Par défaut sur 5 mn.
![frequence](/images/time_options.png)

#### Coloration des sujets souhaités

La page d'options récupère les principales thématiques du site CasusNo et propose sur chacun d'eux une manière de modifier leur apparence sur la page des *messages non lus*
![options](/images/options.png)

Type d'affichage de la thématique ciblée :

1. Visible : Rien ne change, affichage habituel
2. Masqué : Le sujet est toujours visible, mais suffisamment estompé pour devenir discret à la lecture.
3. En évidence : Permet de configurer une modification de l'affichage :
   1. Ligne complète : Le fond de la ligne est recoloré selon la couleur choisie (privilégier les tons clairs)
   2. Surlignage du titre : Idem mais cette fois sur le titre uniquement, comme l'application d'un surligneur.
   3. Coloration du titre : Seule la couleur du titre est modifiée (privilégier les tons foncés)

Une fois enregistrées, la page des *messages non lus* sera traitée selon ces paramètres.
![resultats](/images/results.png)

