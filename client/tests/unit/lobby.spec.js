import Lobby from '@/models/data/lobby';
import LobbyStates from '@/constants/lobby-states';
import Client from '@/models/data/client';

describe('Lobby Model', () => {
  let lobby;

  beforeEach(() => {
    lobby = new Lobby({});
  });

  it('should create a lobby with default values', () => {
    expect(lobby.capacity).toBe(5);
    expect(lobby.clients).toEqual({});
    expect(lobby.code).toBeNull();
    expect(lobby.currentGameUuid).toBeNull();
    expect(lobby.games).toEqual({});
    expect(lobby.owner).toBeNull();
    expect(lobby.pointsGoal).toBe(5);
    expect(lobby.previousGameUuid).toBeNull();
    expect(lobby.startTime).toBeNull();
    expect(lobby.state).toBe(LobbyStates.PENDING);
  });

  it('should create a lobby with provided values', () => {
    const payload = {
      capacity: 8,
      code: 'TEST123',
      owner: 'owner-uuid',
      pointsGoal: 10,
      state: LobbyStates.IN_PROGRESS
    };
    const customLobby = new Lobby(payload);
    expect(customLobby.capacity).toBe(8);
    expect(customLobby.code).toBe('TEST123');
    expect(customLobby.owner).toBe('owner-uuid');
    expect(customLobby.pointsGoal).toBe(10);
    expect(customLobby.state).toBe(LobbyStates.IN_PROGRESS);
  });

  it('should determine if lobby is full', () => {
    const client1 = { uuid: '1', spectating: false };
    const client2 = { uuid: '2', spectating: false };
    const client3 = { uuid: '3', spectating: false };

    lobby.capacity = 2;
    lobby.clients = {
      '1': client1,
      '2': client2,
      '3': client3
    };

    expect(lobby.isFull()).toBe(true);
  });

  it('should exclude spectators from full count', () => {
    const client1 = { uuid: '1', spectating: false };
    const client2 = { uuid: '2', spectating: false };
    const spectator = { uuid: '3', spectating: true };

    lobby.capacity = 2;
    lobby.clients = {
      '1': client1,
      '2': client2,
      '3': spectator
    };

    expect(lobby.isFull()).toBe(false);
  });

  it('should check if client is playing', () => {
    const client = { uuid: '1', spectating: false };
    lobby.clients = { '1': client };

    expect(lobby.isClientPlaying('1')).toBe(true);
    expect(lobby.isClientPlaying('2')).toBe(false);
  });

  it('should exclude spectators from playing check', () => {
    const spectator = { uuid: '1', spectating: true };
    lobby.clients = { '1': spectator };

    expect(lobby.isClientPlaying('1')).toBe(false);
  });

  it('should return players list excluding spectators', () => {
    const client1 = { uuid: '1', spectating: false, points: 3, name: 'Alice' };
    const client2 = { uuid: '2', spectating: false, points: 5, name: 'Bob' };
    const spectator = { uuid: '3', spectating: true, points: 0, name: 'Charlie' };

    lobby.clients = {
      '1': client1,
      '2': client2,
      '3': spectator
    };

    const players = lobby.getPlayers();
    expect(players.length).toBe(2);
    expect(players[0].name).toBe('Bob');
    expect(players[1].name).toBe('Alice');
  });

  it('should get newest game', () => {
    const game = { uuid: 'game-123', state: 'IN_PROGRESS' };
    lobby.currentGameUuid = 'game-123';
    lobby.games = {
      'game-123': game
    };

    const newestGame = lobby.getNewestGame();
    expect(newestGame).toEqual(game);
  });

  it('should return null for newest game when no current game', () => {
    expect(lobby.getNewestGame()).toBeUndefined();
  });

  it('should determine if owner can start game', () => {
    lobby.owner = 'owner-123';
    lobby.state = LobbyStates.PENDING;
    lobby.clients = {
      'owner-123': { uuid: 'owner-123', spectating: false },
      'other-123': { uuid: 'other-123', spectating: false }
    };

    expect(lobby.canStart('owner-123')).toBe(true);
  });

  it('should not allow non-owner to start game', () => {
    lobby.owner = 'owner-123';
    lobby.state = LobbyStates.PENDING;
    lobby.clients = {
      'owner-123': { uuid: 'owner-123', spectating: false },
      'other-123': { uuid: 'other-123', spectating: false }
    };

    expect(lobby.canStart('other-123')).toBe(false);
  });

  it('should not allow starting with only one player', () => {
    lobby.owner = 'owner-123';
    lobby.state = LobbyStates.PENDING;
    lobby.clients = {
      'owner-123': { uuid: 'owner-123', spectating: false }
    };

    expect(lobby.canStart('owner-123')).toBe(false);
  });

  it('should not allow starting if lobby is not pending', () => {
    lobby.owner = 'owner-123';
    lobby.state = LobbyStates.IN_PROGRESS;
    lobby.clients = {
      'owner-123': { uuid: 'owner-123', spectating: false },
      'other-123': { uuid: 'other-123', spectating: false }
    };

    expect(lobby.canStart('owner-123')).toBe(false);
  });

  it('should get players by points', () => {
    const client1 = { uuid: '1', spectating: false, points: 3, name: 'Alice' };
    const client2 = { uuid: '2', spectating: false, points: 5, name: 'Bob' };
    const client3 = { uuid: '3', spectating: false, points: 3, name: 'Charlie' };

    lobby.clients = {
      '1': client1,
      '2': client2,
      '3': client3
    };

    const playersWithPoints = lobby.getPlayersMap({ '1': 3, '2': 5, '3': 3 }, 3);
    expect(playersWithPoints.size).toBe(2);
  });
});
