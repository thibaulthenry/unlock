import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)
Vue.prototype.$i

const messages = {
  gb: {
    buttons: {
      lobby: {
        capacity: 'Players number',
        code: 'Lobby code',
        create: 'Create',
        join: 'Join',
        leave: 'Leave',
        pointsGoal: 'Points required for victory',
        spectate: 'Spectate',
        start: 'Start'
      },
    },
    display: {
      names: {
        GameFallingApples: 'Falling Apples',
        GameSpaceVegetables: 'Space Vegetables'
      },
      tips: {
        lobby: {
          pending: 'The owner of the lobby is the only one who can start the game if there are at least two players.\nIf the lobby is full, the game will start automatically',
          starting: 'Players can still join the lobby.\n{slots} slots left',
          startingFull: 'Lobby is full, no slot left',
          startingImminent: 'Lobby is locked.\nThe game will start in a few seconds'
        },
        game: {
          GameFallingApples: 'Collect 7 apples before other players by moving your mouse',
          GameSpaceVegetables: 'Shoot the central vegetable by clicking the left button and dragging mouse'
        }
      }
    },
    errors: {
      overflow: 'At most 20 characters long',
      required: 'Required field'
    },
    languages: {
      fr: 'French',
      gb: 'English'
    },
    lobby: {
      states: {
        pending: 'Waiting additional players',
        starting: 'Start-up in progress',
        startingImminent: 'Imminent start-up',
        game: {
          starting: 'Pre-game preparation',
          started: 'Game in progress',
        },
        ended: 'Game over',
      }
    },
    settings: {
      ladder: 'Leaderboard',
      name: 'Player nickname',
      owner: 'Lobby owner',
      points: 'Keys'
    },
    snackbar: {
      error: {
        connectionFailed: 'Connection failed',
        connectionLost: 'Connection lost',
        connectionServerUnreachable: 'Unable to reach connection server',
        lobbyAlreadyStarted: 'Game has already started on this lobby',
        lobbyCodeMissing: 'Enter a lobby code to join a game',
        lobbyFull: 'Lobby is full',
        lobbyInterrupted: 'Game has been interrupted because remaining players have left',
        lobbyUnknown: 'Unable to find the lobby',
        packetsLost: 'Some information packets are unreadable'
      },
      info: {
        lobbyEmpty: 'All players have left the game',
      }
    }
  },
  fr: {
    buttons: {
      lobby: {
        capacity: 'Nombre de joueurs',
        code: 'Code du lobby',
        create: 'Créer',
        join: 'Rejoindre',
        leave: 'Quitter',
        pointsGoal: 'Nombre de points requis pour la victoire',
        spectate: 'Regarder',
        start: 'Démarrer'
      },
    },
    display: {
      names: {
        GameFallingApples: 'Chute de pommes',
        GameSpaceVegetables: 'Légumes de l\'espace'
      },
      tips: {
        lobby: {
          pending: 'Le propriétaire du lobby est le seul à pouvoir démarrer la partie s\'il y a au moins deux joueurs.\nSi le lobby est plein, la partie démarrera automatiquement',
          starting: 'Des joueurs peuvent encore rejoindre le lobby.\n{slots} places restantes',
          startingFull: 'Le lobby est complet, aucune place restante',
          startingImminent: 'Le lobby est verrouillé.\nDémarrage du jeu dans quelques secondes'
        },
        game: {
          GameFallingApples: 'Récoltez 7 pommes avant les autres joueurs en déplaçant votre souris',
          GameSpaceVegetables: 'Tirez pour éliminer le légume central en cliquant sur la touche gauche de votre souris et en la déplaçant',
        }
      }
    },
    errors: {
      overflow: 'Au maximum 20 caractères',
      required: 'Champ requis'
    },
    languages: {
      fr: 'Français',
      gb: 'Anglais'
    },
    lobby: {
      states: {
        pending: 'En attente de joueurs supplémentaires',
        starting: 'Démarrage en cours',
        startingImminent: 'Démarrage imminent',
        game: {
          starting: 'Préparation d\'avant jeu',
          started: 'Jeu en cours',
        },
        ended: 'Partie terminée',
      }
    },
    settings: {
      ladder: 'Classement',
      name: 'Pseudo de joueur',
      owner: 'Propriétaire du lobby',
      points: 'Clefs'
    },
    snackbar: {
      error: {
        connectionFailed: 'Impossible de se connecter',
        connectionLost: 'Connexion avec le serveur perdue',
        connectionServerUnreachable: 'Impossible de joindre le serveur de connexion',
        lobbyAlreadyStarted: 'La partie a déjà commencé sur ce lobby',
        lobbyCodeMissing: 'Renseignez un code de lobby pour rejoindre une partie',
        lobbyFull: 'Le lobby est complet',
        lobbyInterrupted: 'La partie a été interrompue car les joueurs restants se sont déconnectés',
        lobbyUnknown: 'Impossible de retrouver le lobby',
        packetsLost: 'Certains paquets d\'information sont illisibles'
      },
      info: {
        lobbyEmpty: 'Tous les joueurs ont quitté la partie'
      }
    }
  }
}

export default new VueI18n({locale: 'fr', messages})
