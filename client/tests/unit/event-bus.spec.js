import eventBus from '@/services/event-bus';

describe('Event Bus', () => {
  it('should be a Vue instance', () => {
    expect(eventBus).toBeDefined();
    expect(eventBus.$on).toBeDefined();
    expect(eventBus.$emit).toBeDefined();
    expect(eventBus.$off).toBeDefined();
  });

  it('should emit and listen to events', (done) => {
    const testEvent = 'test-event';
    const testData = { message: 'Hello' };

    eventBus.$on(testEvent, (data) => {
      expect(data).toEqual(testData);
      done();
    });

    eventBus.$emit(testEvent, testData);
  });

  it('should remove listeners', (done) => {
    const testEvent = 'remove-test';
    let callCount = 0;

    const handler = () => {
      callCount++;
    };

    eventBus.$on(testEvent, handler);
    eventBus.$emit(testEvent);

    eventBus.$off(testEvent, handler);
    eventBus.$emit(testEvent);

    setTimeout(() => {
      expect(callCount).toBe(1);
      done();
    }, 50);
  });
});
