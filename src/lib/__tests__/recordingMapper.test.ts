// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { toWhiteboardRecording, type RecordingData } from '@/lib/services';

function makeRecordingData(overrides: Partial<RecordingData> = {}): RecordingData {
  return {
    id: 'rec_1',
    title: 'Algebra intro',
    description: null,
    duration: 65000,
    teacherId: 'user_1',
    teacherName: 'Mrs. Mensah',
    // Asset URLs arrive HMAC-signed from GET /api/recordings/:id
    thumbnailUrl: '/api/recordings/files/recordings/rec_1/thumbnail.png?sig=abc&exp=123',
    canvasEventsUrl: '/api/recordings/files/recordings/rec_1/events.json?sig=abc&exp=123',
    audioUrl: null,
    webcamUrl: null,
    canvasWidth: 1200,
    canvasHeight: 800,
    initialCanvasJSON: '{"version":"6.0.0","objects":[]}',
    subjectId: null,
    topicId: null,
    isPublic: false,
    viewCount: 3,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T11:00:00Z',
    ...overrides,
  };
}

describe('toWhiteboardRecording', () => {
  it('maps the camelCase API response to the player shape', () => {
    const recording = toWhiteboardRecording(makeRecordingData());

    expect(recording.id).toBe('rec_1');
    expect(recording.title).toBe('Algebra intro');
    expect(recording.description).toBe('');
    expect(recording.duration).toBe(65000);
    expect(recording.teacherId).toBe('user_1');
    expect(recording.teacherName).toBe('Mrs. Mensah');
    expect(recording.canvasEventsUrl).toContain('?sig=');
    expect(recording.thumbnailUrl).toContain('?sig=');
    expect(recording.canvasWidth).toBe(1200);
    expect(recording.canvasHeight).toBe(800);
    expect(recording.initialCanvasJSON).toBe('{"version":"6.0.0","objects":[]}');
    expect(recording.createdAt).toBe('2026-08-01T10:00:00Z');
    expect(recording.updatedAt).toBe('2026-08-01T11:00:00Z');
  });

  it('converts null asset URLs to undefined for the player', () => {
    const recording = toWhiteboardRecording(makeRecordingData());

    expect(recording.audioUrl).toBeUndefined();
    expect(recording.webcamUrl).toBeUndefined();
  });

  it('keeps present asset URLs, including signed query params', () => {
    const recording = toWhiteboardRecording(
      makeRecordingData({
        audioUrl: '/api/recordings/files/recordings/rec_1/audio.webm?sig=def&exp=456',
        webcamUrl: '/api/recordings/files/recordings/rec_1/webcam.webm?sig=def&exp=456',
      }),
    );

    expect(recording.audioUrl).toContain('audio.webm?sig=');
    expect(recording.webcamUrl).toContain('webcam.webm?sig=');
  });
});
