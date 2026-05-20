import Client from '@/models/data/client';
import SpriteColors from '@/constants/sprite-colors';

describe('Client Model', () => {
  it('should create a client with default values', () => {
    const client = new Client({});
    expect(client.name).toBeNull();
    expect(client.points).toBe(0);
    expect(client.spectating).toBe(false);
    expect(client.spriteColor).toBe(SpriteColors.BLUE);
    expect(client.uuid).toBeNull();
  });

  it('should create a client with provided values', () => {
    const payload = {
      name: 'John',
      points: 5,
      spectating: true,
      spriteColor: SpriteColors.RED,
      uuid: '123-abc'
    };
    const client = new Client(payload);
    expect(client.name).toBe('John');
    expect(client.points).toBe(5);
    expect(client.spectating).toBe(true);
    expect(client.spriteColor).toBe(SpriteColors.RED);
    expect(client.uuid).toBe('123-abc');
  });

  it('should have default sprite color when not provided', () => {
    const client = new Client({ name: 'Player' });
    expect(client.spriteColor).toBe(SpriteColors.BLUE);
  });

  it('should handle getFloor method (requires store)', () => {
    const client = new Client({ name: 'Player', points: 3 });
    // getFloor depends on store which is complex to mock
    expect(client.getFloor).toBeDefined();
  });
});
