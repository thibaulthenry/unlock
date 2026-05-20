import store from '@/services/store';
import Client from '@/models/data/client';
import Lobby from '@/models/data/lobby';

describe('Vuex Store', () => {
  beforeEach(() => {
    // Reset store state between tests
    store.commit('SET_CLIENT', { client: { name: 'Player' } });
    store.commit('SET_DRAWER', { drawer: true });
    store.commit('SET_FOOTER_MINIMIZED', { footerMinimized: false });
  });

  describe('Client Mutations', () => {
    it('should set client name', () => {
      const testClient = { name: 'TestPlayer', uuid: '123' };
      store.commit('SET_CLIENT', { client: testClient });
      expect(store.state.client.name).toBe('TestPlayer');
    });

    it('should initialize client if not exists', () => {
      store.commit('SET_CLIENT', { client: { name: 'NewClient' } });
      expect(store.state._client).toBeDefined();
    });
  });

  describe('UI Mutations', () => {
    it('should toggle drawer', () => {
      expect(store.state.drawer).toBe(true);
      store.commit('SET_DRAWER', { drawer: false });
      expect(store.state.drawer).toBe(false);
    });

    it('should toggle footer minimized state', () => {
      expect(store.state.footerMinimized).toBe(false);
      store.commit('SET_FOOTER_MINIMIZED', { footerMinimized: true });
      expect(store.state.footerMinimized).toBe(true);
    });
  });

  describe('Lobby Mutations', () => {
    it('should set lobby capacity', () => {
      store.commit('SET_LOBBY_CAPACITY', { lobbyCapacity: 10 });
      expect(store.state.lobby.capacity).toBe(10);
    });

    it('should set lobby points goal', () => {
      store.commit('SET_LOBBY_POINTS_GOAL', { lobbyPointsGoal: 20 });
      expect(store.state.lobby.pointsGoal).toBe(20);
    });

    it('should set lobby code', () => {
      store.commit('SET_LOBBY_CODE', { lobbyCode: 'TESTCODE' });
      expect(store.state.lobby.code).toBe('TESTCODE');
    });
  });

  describe('Snackbar Mutations', () => {
    it('should show notification', () => {
      store.commit('SET_SNACKBAR', { 
        show: true, 
        message: 'Test', 
        color: '#000' 
      });
      expect(store.state.snackbar.show).toBe(true);
      expect(store.state.snackbar.message).toBe('Test');
      expect(store.state.snackbar.color).toBe('#000');
    });

    it('should hide notification', () => {
      store.commit('SET_SNACKBAR', { 
        show: false, 
        message: '', 
        color: '' 
      });
      expect(store.state.snackbar.show).toBe(false);
    });
  });

  describe('Scene Inputs', () => {
    it('should set scene inputs', () => {
      const inputs = {
        keyboard: { up: true, down: false, left: false, right: false, space: false },
        mouse: { leftClick: false, middleClick: false, rightClick: false, slide: false }
      };
      store.commit('SET_SCENE_INPUTS', { inputs });
      expect(store.state.sceneInputs.keyboard.up).toBe(true);
    });

    it('should reset scene inputs when null', () => {
      store.commit('SET_SCENE_INPUTS', { inputs: null });
      expect(store.state.sceneInputs.keyboard.up).toBe(false);
      expect(store.state.sceneInputs.mouse.leftClick).toBe(false);
    });
  });

  describe('Notifications Actions', () => {
    it('should dispatch notifyInfo', () => {
      store.dispatch('notifyInfo', 'Test message');
      expect(store.state.snackbar.show).toBe(true);
      expect(store.state.snackbar.message).toBe('Test message');
      expect(store.state.snackbar.color).toBe('#00b8d5');
    });

    it('should dispatch notifyError', () => {
      store.dispatch('notifyError', 'Error message');
      expect(store.state.snackbar.show).toBe(true);
      expect(store.state.snackbar.message).toBe('Error message');
      expect(store.state.snackbar.color).toBe('#630000');
    });
  });
});
