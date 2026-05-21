# Comment jouer

## Démarrer une partie

1. Va sur <https://unlock-db.web.app> (ou ton instance locale).
2. Choisis ton **pseudo**, ajuste la **capacité** du lobby (2–10 joueurs)
   et le **nombre de clés requises** pour gagner (`pointsGoal`, 2–20).
3. Entre un **code de lobby** (n'importe quelle chaîne) et clique
   **Rejoindre**.
4. Partage le code avec tes amis pour qu'ils te rejoignent.
5. Quand au moins **deux joueurs** sont présents, le **propriétaire** du
   lobby (couronne dorée) peut cliquer **DÉMARRER**.

## Salle d'attente

![Salle d'attente avec 2 joueurs](../screenshots/02-lobby-waiting.png)

- Le panneau de gauche affiche le **classement** en temps réel (joueurs,
  clés gagnées, couronne du propriétaire).
- Le panneau central affiche la **scène Phaser** : ton axolotl et ceux
  des autres dans le lobby.
- Le panneau du bas affiche l'**état du lobby**, le bouton DÉMARRER et
  les boutons de contrôle.

## Compte à rebours

Quand l'hôte clique DÉMARRER :

1. **20 secondes** de compte à rebours.
2. **8 secondes** avant le démarrage, le lobby se verrouille : plus
   personne ne peut rejoindre. Une **cage** descend sur les axolotls.

![Démarrage imminent](../screenshots/03-lobby-starting.png)

## Pendant un mini-jeu

- Le titre et la règle du mini-jeu sont affichés en bas du panneau.
- Les **contrôles disponibles** sont surlignés en vert (les touches
  inutiles restent grisées). C'est la **clé du gameplay** : on ne peut
  utiliser que les inputs autorisés pour chaque mini-jeu.
- La barre de progression dorée du haut indique le **temps restant**.
- Pour gagner la manche, tu dois remplir l'objectif **avant les autres
  joueurs** (ou **avant le timeout** selon le mini-jeu).

Voir [[Mini-jeux|Mini-games]] pour le détail de chaque mode.

## Entre les manches

- Les **gagnants** de la manche montent d'un étage et reçoivent une clé
  (visible dans le classement).
- Les **perdants** trébuchent dans une trappe et se retrouvent sur la
  scène **Pre-Game Fall**.
- 15 secondes plus tard, le mini-jeu suivant démarre.

## Fin de partie

Quand un joueur atteint le `pointsGoal`, la partie s'arrête immédiatement.
L'**EndScene** se charge : tu vois l'axolotl du gagnant traverser le
couloir du donjon vers la porte de sortie.

![Le gagnant rejoint la porte](../screenshots/06-end-final.png)

Bouton **QUITTER** pour revenir à l'accueil.

## Contrôles

| Action               | Clavier (FR/EN)           | Souris (jeux à clic)  |
| -------------------- | ------------------------- | --------------------- |
| Haut                 | ↑ / Z (W en EN)           | —                     |
| Bas                  | ↓ / S                     | —                     |
| Gauche               | ← / Q (A en EN)           | —                     |
| Droite               | → / D                     | —                     |
| Tirer / Action       | Espace                    | Clic gauche / droit   |

Les inputs **non disponibles pour le mini-jeu en cours sont grisés**
dans la barre de contrôle.
