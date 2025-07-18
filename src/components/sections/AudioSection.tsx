import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Play, Square, Volume2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AudioSection = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 22050,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Setup audio analysis
      const audioContext = new AudioContext({ sampleRate: 22050 });
      await audioContext.resume(); // Ensure audio context is running
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Setup media recorder with proper MIME type
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        // Save for later use
        console.log('Audio recording saved:', audioBlob);
      };
      
      mediaRecorder.start(1000); // Record in 1-second chunks
      mediaRecorderRef.current = mediaRecorder;

      setStream(mediaStream);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start audio level monitoring
      const monitorAudio = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel((average / 255) * 100);
        }
      };

      intervalRef.current = setInterval(() => {
        monitorAudio();
        setRecordingDuration(prev => prev + 1);
      }, 100);

      toast({
        title: "Recording started",
        description: "Audio stress analysis is now active",
      });
    } catch (error) {
      console.error('Audio recording error:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access for voice stress detection",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setStream(null);
    setIsRecording(false);
    setAudioLevel(0);
    setRecordingDuration(0);

    toast({
      title: "Recording stopped",
      description: "Audio analysis paused",
    });
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  // Simulated audio features
  const audioFeatures = [
    { name: "Pitch Variation", value: "High", status: "elevated", unit: "Hz" },
    { name: "Voice Tremor", value: "Moderate", status: "concern", unit: "" },
    { name: "Speaking Rate", value: "Fast", status: "elevated", unit: "WPM" },
    { name: "Vocal Intensity", value: "Loud", status: "concern", unit: "dB" },
    { name: "Fundamental Frequency", value: "245", status: "elevated", unit: "Hz" },
    { name: "Jitter", value: "0.8%", status: "normal", unit: "" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-success text-success-foreground';
      case 'elevated': return 'bg-warning text-warning-foreground';
      case 'concern': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 600);
    const secs = Math.floor((seconds % 600) / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2 font-poppins">Audio Stress Analysis</h2>
        <p className="text-muted-foreground">Voice pattern analysis for stress detection</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Audio Recording Card */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Audio Recording
            </CardTitle>
            <CardDescription>
              Record and analyze voice patterns for stress indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Waveform Visualization */}
              <div className="relative bg-muted rounded-lg p-6 h-32">
                {isRecording ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-end gap-1">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-primary rounded-full transition-all duration-200"
                          style={{
                            width: '4px',
                            height: `${Math.random() * 40 + 10}px`,
                            opacity: audioLevel > i * 5 ? 1 : 0.3,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MicOff className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Audio not recording</p>
                    </div>
                  </div>
                )}
                
                {isRecording && (
                  <div className="absolute top-2 right-2 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                    <span className="text-sm font-medium">{formatDuration(recordingDuration)}</span>
                  </div>
                )}
              </div>

              {/* Audio Level Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Audio Level</span>
                  <span className="text-sm text-muted-foreground">{Math.round(audioLevel)}%</span>
                </div>
                <Progress value={audioLevel} className="h-2" />
              </div>

              {/* Controls */}
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                className="w-full"
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audio Features Card */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Voice Features
            </CardTitle>
            <CardDescription>
              Real-time analysis of vocal stress indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {audioFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{feature.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {feature.value} {feature.unit}
                    </span>
                    <Badge className={`text-xs ${getStatusColor(feature.status)}`}>
                      {feature.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MFCC Analysis Info */}
      <Card className="bg-gradient-primary text-white shadow-glow border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">MFCC-based CNN Model</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Audio Processing</h4>
              <ul className="space-y-1 text-white/80">
                <li>• 16kHz sampling rate</li>
                <li>• Pre-emphasis filtering</li>
                <li>• Windowing & FFT</li>
                <li>• Mel-frequency scaling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Feature Extraction</h4>
              <ul className="space-y-1 text-white/80">
                <li>• 13 MFCC coefficients</li>
                <li>• Delta & delta-delta features</li>
                <li>• Spectral centroid</li>
                <li>• Zero-crossing rate</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Model Output</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Stress probability</li>
                <li>• Emotion classification</li>
                <li>• Arousal level</li>
                <li>• Confidence metrics</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm">
              <strong>Integration Point:</strong> The MFCC-based CNN model will process audio segments 
              to extract stress-related features and provide real-time voice stress analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};