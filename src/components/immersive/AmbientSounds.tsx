import { useEffect, useRef } from 'react';

interface AmbientSoundsProps {
  sound: 'none' | 'rain' | 'library' | 'lofi';
  volume: number;
}

// Audio URLs - using free ambient sounds
const SOUND_URLS: Record<string, string> = {
  rain: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
  library: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3',
  lofi: 'https://assets.mixkit.co/active_storage/sfx/2462/2462-preview.mp3',
};

export function AmbientSounds({ sound, volume }: AmbientSoundsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (sound === 'none') {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    const url = SOUND_URLS[sound];
    if (!url) return;

    // Create or reuse audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.crossOrigin = 'anonymous';
    }

    const audio = audioRef.current;

    // Only change source if different sound
    if (audio.src !== url) {
      audio.src = url;
    }

    // Set up Web Audio API for smooth volume control
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContextRef.current.createMediaElementSource(audio);
        gainNodeRef.current = audioContextRef.current.createGain();
        source.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        // Fallback to direct volume control
        console.log('Web Audio API not available, using direct volume');
      }
    }

    // Set volume
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current!.currentTime);
    } else {
      audio.volume = volume;
    }

    // Play with fade in
    const playWithFade = async () => {
      try {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        if (gainNodeRef.current) {
          gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
          gainNodeRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current!.currentTime + 1);
        }

        await audio.play();
      } catch (err) {
        console.log('Audio playback blocked by browser');
      }
    };

    playWithFade();

    return () => {
      // Fade out on cleanup
      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.5);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
          }
        }, 500);
      } else if (audio) {
        audio.pause();
      }
    };
  }, [sound]);

  // Update volume when it changes
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    } else if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // This component doesn't render anything visible
  return null;
}

export default AmbientSounds;
