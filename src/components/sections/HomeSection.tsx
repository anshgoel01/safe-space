import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Mic, Watch, ClipboardList, Brain, Shield } from 'lucide-react';

export const HomeSection = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4 font-poppins">
          SafeSpace
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Real-time multimodal stress detection using advanced AI and physiological monitoring
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Facial Expression Card */}
        <Card className="bg-gradient-card shadow-card border-0 hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">Facial Expression</CardTitle>
            </div>
            <CardDescription>
              Real-time facial expression analysis using computer vision
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">CNN Model</Badge>
              <Badge variant="outline" className="text-xs">WebRTC</Badge>
              <p className="text-sm text-muted-foreground">
                Captures micro-expressions, jaw tension, and facial stress indicators
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Audio Analysis Card */}
        <Card className="bg-gradient-card shadow-card border-0 hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mic className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">Audio Analysis</CardTitle>
            </div>
            <CardDescription>
              Voice stress detection through acoustic features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">MFCC</Badge>
              <Badge variant="outline" className="text-xs">Pitch Analysis</Badge>
              <p className="text-sm text-muted-foreground">
                Analyzes voice patterns, pitch variations, and vocal stress cues
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Physiological Monitoring Card */}
        <Card className="bg-gradient-card shadow-card border-0 hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Watch className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">Physiological Data</CardTitle>
            </div>
            <CardDescription>
              Real-time biometric monitoring from wearable device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">EDA</Badge>
              <Badge variant="outline" className="text-xs">BVP</Badge>
              <Badge variant="outline" className="text-xs">Temperature</Badge>
              <p className="text-sm text-muted-foreground">
                Monitors heart rate, skin conductance, and body temperature
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Survey Assessment Card */}
        <Card className="bg-gradient-card shadow-card border-0 hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">Self-Assessment</CardTitle>
            </div>
            <CardDescription>
              WorkStress3D instant questionnaire for self-reported state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">Likert Scale</Badge>
              <Badge variant="outline" className="text-xs">Validated Questions</Badge>
              <p className="text-sm text-muted-foreground">
                Captures subjective stress levels and emotional state
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Fusion Card */}
        <Card className="bg-gradient-card shadow-card border-0 hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">AI Fusion Engine</CardTitle>
            </div>
            <CardDescription>
              Agreement-Aware Fusion for multimodal stress detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">AAF Algorithm</Badge>
              <Badge variant="outline" className="text-xs">ML Ensemble</Badge>
              <p className="text-sm text-muted-foreground">
                Combines all inputs for accurate stress level prediction
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security Card */}
        <Card className="bg-gradient-card shadow-card border-0 hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">Privacy First</CardTitle>
            </div>
            <CardDescription>
              Secure, local processing with data protection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">Local Storage</Badge>
              <Badge variant="outline" className="text-xs">No Cloud Upload</Badge>
              <p className="text-sm text-muted-foreground">
                All data processed locally for maximum privacy protection
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-primary text-white shadow-glow border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-2">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">1</div>
              <p>Collect multimodal data from all sensors</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">2</div>
              <p>Process each input through specialized AI models</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">3</div>
              <p>Fuse predictions using Agreement-Aware algorithm</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">4</div>
              <p>Provide real-time stress level assessment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};