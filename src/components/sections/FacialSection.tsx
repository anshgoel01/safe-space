import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Play, Square, Eye, Frown, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FacialSection = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setIsStreaming(true);
      
      toast({
        title: "Camera activated",
        description: "Ready to capture photo for facial analysis",
      });
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use facial expression detection",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      toast({
        title: "Camera deactivated",
        description: "Facial analysis stopped",
      });
    }
  };

  const capturePhoto = () => {
    if (!isStreaming || !videoRef.current || !canvasRef.current) {
      toast({
        title: "Start camera first",
        description: "Please activate the camera before capturing photo",
        variant: "destructive",
      });
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedPhoto(photoDataUrl);
      
      toast({
        title: "Photo captured",
        description: "Facial expression photo saved for analysis",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Simulated facial features being tracked
  const facialFeatures = [
    { name: "Eyebrow Position", value: "Neutral", status: "normal", icon: Eye },
    { name: "Eye Openness", value: "Wide", status: "elevated", icon: Eye },
    { name: "Mouth Curvature", value: "Slight Frown", status: "concern", icon: Frown },
    { name: "Jaw Tension", value: "Moderate", status: "elevated", icon: AlertTriangle },
    { name: "Facial Symmetry", value: "Balanced", status: "normal", icon: Eye },
    { name: "Micro-expressions", value: "Stress Indicators", status: "concern", icon: AlertTriangle },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-success text-success-foreground';
      case 'elevated': return 'bg-warning text-warning-foreground';
      case 'concern': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2 font-poppins">Facial Expression Analysis</h2>
        <p className="text-muted-foreground">Real-time facial stress detection using computer vision</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video Feed Card */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Live Video Feed
            </CardTitle>
            <CardDescription>
              Webcam stream for facial expression capture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured facial expression"
                    className="w-full h-64 object-cover"
                  />
                ) : isStreaming ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <CameraOff className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Camera not active</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={isStreaming ? "destructive" : "default"}
                  onClick={isStreaming ? stopCamera : startCamera}
                  className="flex-1"
                >
                  {isStreaming ? (
                    <>
                      <CameraOff className="w-4 h-4 mr-2" />
                      Stop Camera
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </>
                  )}
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={capturePhoto}
                  disabled={!isStreaming}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Photo
                </Button>
              </div>
              
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </CardContent>
        </Card>

        {/* Features Analysis Card */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Detected Features
            </CardTitle>
            <CardDescription>
              Real-time analysis of facial stress indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {facialFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{feature.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{feature.value}</span>
                      <Badge className={`text-xs ${getStatusColor(feature.status)}`}>
                        {feature.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ML Model Integration Info */}
      <Card className="bg-gradient-primary text-white shadow-glow border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">CNN Model Integration</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Pre-processing</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Face detection & alignment</li>
                <li>• Image normalization</li>
                <li>• Feature extraction</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Model Architecture</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Convolutional layers</li>
                <li>• Attention mechanisms</li>
                <li>• Dropout regularization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Output Features</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Stress probability</li>
                <li>• Confidence score</li>
                <li>• Feature importance</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm">
              <strong>Integration Point:</strong> The CNN model will be integrated here to process the video frames 
              and output stress detection probabilities in real-time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};