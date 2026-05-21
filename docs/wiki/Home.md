# Bienvenue dans le wiki d'Unlock

**Unlock** est un party game multijoueur en temps réel : jusqu'à 5
axolotls prisonniers d'un donjon tentent de s'échapper en gagnant des
mini-jeux pour récolter des clés.

Ce wiki regroupe la documentation pour les joueurs, les contributeurs et
les opérateurs.

## Pages

### Pour jouer

- [[How to play|How-to-play]] — règles, contrôles, déroulement d'une partie.
- [[Mini-jeux|Mini-games]] — description détaillée de chaque mini-jeu.

### Pour développer

- [[Développement local|Local-development]] — lancer la stack complète sur
  sa machine en moins d'une minute.
- [[Architecture|Architecture]] — stack, structure du code, protocole
  client ↔ serveur.
- [[Contrat des packets|Packets]] — référence des messages WebSocket
  échangés.

### Pour opérer

- [[Redéploiement cloud|Cloud-deployment]] — exécuter `deploy.sh` pour
  redéployer toute la stack sur GCP.
- [[Variables d'environnement|Environment-variables]] — référence des env
  vars consommées par le client, le serveur et `deploy.sh`.

## Ressources

- Code source : [thibaulthenry/unlock](https://github.com/thibaulthenry/unlock)
- Production : <https://unlock-db.web.app>
- Issues : [GitHub Issues](https://github.com/thibaulthenry/unlock/issues)
