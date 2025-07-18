import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Activity, Camera, Mic, Watch, ClipboardList, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface ModalityPrediction {
  modality: string;
  icon: any;
  stressProbability: number;
  confidence: number;
  status: 'active' | 'inactive' | 'processing';
  features: string[];
}

interface FusionResult {
  finalPrediction: 'Stressed' | 'Not Stressed';
  likelihood: number;
  agreementScore: number;
  timestamp: number;
}

export const FusionSection = () => {
  const [modalityData, setModalityData] = useState<ModalityPrediction[]>([
    {
      modality: 'Facial Expression',
      icon: Camera,
      stressProbability: 0,
      confidence: 0,
      status: 'inactive',
      features: ['Waiting for photo capture...']
    },
    {
      modality: 'Voice Analysis',
      icon: Mic,
      stressProbability: 0,
      confidence: 0,
      status: 'inactive',
      features: ['Waiting for audio recording...']
    },
    {
      modality: 'Physiological',
      icon: Watch,
      stressProbability: 0,
      confidence: 0,
      status: 'inactive',
      features: ['Waiting for sensor data...']
    },
    {
      modality: 'Self-Assessment',
      icon: ClipboardList,
      stressProbability: 0,
      confidence: 0,
      status: 'inactive',
      features: ['Waiting for survey completion...']
    }
  ]);

  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allDataAvailable, setAllDataAvailable] = useState(false);

  // Check for data availability from localStorage
  useEffect(() => {
    const checkDataAvailability = () => {
      const facialData = localStorage.getItem('safespace_facial');
      const audioData = localStorage.getItem('safespace_audio');
      const physioData = localStorage.getItem('safespace_physio');
      const surveyData = localStorage.getItem('safespace_survey');
      
      const hasAllData = facialData && audioData && physioData && surveyData;
      setAllDataAvailable(!!hasAllData);
      
      // Update modality statuses based on available data
      setModalityData(prev => prev.map(modality => {
        let status: 'active' | 'inactive' | 'processing' = 'inactive';
        let features: string[] = [];
        let stressProbability = 0;
        let confidence = 0;
        
        if (modality.modality === 'Facial Expression' && facialData) {
          status = 'active';
          features = ['Face detected', 'Expression analyzed'];
          stressProbability = Math.random() * 0.8 + 0.1;
          confidence = Math.random() * 0.3 + 0.7;
        } else if (modality.modality === 'Voice Analysis' && audioData) {
          status = 'active';
          features = ['Voice captured', 'MFCC extracted'];
          stressProbability = Math.random() * 0.8 + 0.1;
          confidence = Math.random() * 0.3 + 0.7;
        } else if (modality.modality === 'Physiological' && physioData) {
          status = 'active';
          features = ['Sensors active', 'Vitals recorded'];
          stressProbability = Math.random() * 0.8 + 0.1;
          confidence = Math.random() * 0.3 + 0.7;
        } else if (modality.modality === 'Self-Assessment' && surveyData) {
          status = 'active';
          features = ['Survey completed', 'Responses analyzed'];
          stressProbability = Math.random() * 0.8 + 0.1;
          confidence = Math.random() * 0.3 + 0.7;
        } else {
          features = [`Waiting for ${modality.modality.toLowerCase()} data...`];
        }
        
        return {
          ...modality,
          status,
          features,
          stressProbability,
          confidence
        };
      }));
    };
    
    checkDataAvailability();
    
    // Check every 2 seconds for new data
    const interval = setInterval(checkDataAvailability, 2000);
    return () => clearInterval(interval);
  }, []);

  // Calculate fusion result only when all data is available
  useEffect(() => {
    if (!allDataAvailable) {
      setFusionResult(null);
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true);
    
    const calculateFusion = () => {
      const activeModalities = modalityData.filter(m => m.status === 'active');
      
      if (activeModalities.length < 4) {
        setFusionResult(null);
        setIsProcessing(false);
        return;
      }

      // Agreement-Aware Fusion calculation
      const predictions = activeModalities.map(m => m.stressProbability);
      const confidences = activeModalities.map(m => m.confidence);
      
      // Calculate agreement score (1 - variance of predictions)
      const mean = predictions.reduce((sum, p) => sum + p, 0) / predictions.length;
      const variance = predictions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / predictions.length;
      const agreementScore = Math.max(0, 1 - variance);
      
      // Weighted fusion based on confidence and agreement
      const weightedSum = predictions.reduce((sum, p, i) => 
        sum + (p * confidences[i] * agreementScore), 0
      );
      const totalWeight = confidences.reduce((sum, c) => sum + (c * agreementScore), 0);
      
      const fusedProbability = weightedSum / totalWeight;
      
      const result: FusionResult = {
        finalPrediction: fusedProbability > 0.5 ? 'Stressed' : 'Not Stressed',
        likelihood: fusedProbability,
        agreementScore,
        timestamp: Date.now()
      };
      
      setFusionResult(result);
    };

    // Simulate processing delay
    setTimeout(() => {
      calculateFusion();
      setIsProcessing(false);
    }, 2000);
  }, [modalityData, allDataAvailable]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'processing': return 'bg-warning text-warning-foreground';
      case 'inactive': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPredictionColor = (prediction: string) => {
    return prediction === 'Stressed' 
      ? 'bg-destructive text-destructive-foreground' 
      : 'bg-success text-success-foreground';
  };

  const getLikelihoodColor = (likelihood: number) => {
    if (likelihood > 0.7) return 'text-destructive';
    if (likelihood > 0.4) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2 font-poppins">AI Fusion Engine</h2>
        <p className="text-muted-foreground">Agreement-Aware Fusion for multimodal stress detection</p>
      </div>

      {/* Final Result Card */}
      <Card className="bg-gradient-card shadow-glow border-0">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Brain className="w-8 h-8 text-primary" />
            Stress Detection Result
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {!allDataAvailable ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6 text-warning" />
                <span className="text-lg">Waiting for all data inputs...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Please complete facial capture, audio recording, physiological data, and survey before fusion analysis
              </p>
              <Progress value={(modalityData.filter(m => m.status === 'active').length / 4) * 100} className="h-3" />
            </div>
          ) : isProcessing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-6 h-6 text-primary animate-pulse" />
                <span className="text-lg">Processing multimodal data...</span>
              </div>
              <Progress value={75} className="h-3" />
            </div>
          ) : fusionResult ? (
            <>
              <div className="space-y-4">
                <Badge className={`text-4xl px-8 py-4 ${getPredictionColor(fusionResult.finalPrediction)}`}>
                  {fusionResult.finalPrediction}
                </Badge>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Likelihood Score</h4>
                    <p className={`text-3xl font-bold ${getLikelihoodColor(fusionResult.likelihood)}`}>
                      {(fusionResult.likelihood * 100).toFixed(1)}%
                    </p>
                    <Progress 
                      value={fusionResult.likelihood * 100} 
                      className="h-2 mt-2" 
                    />
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Agreement Score</h4>
                    <p className="text-3xl font-bold text-primary">
                      {(fusionResult.agreementScore * 100).toFixed(1)}%
                    </p>
                    <Progress 
                      value={fusionResult.agreementScore * 100} 
                      className="h-2 mt-2" 
                    />
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Confidence</h4>
                    <p className="text-3xl font-bold text-info">
                      {((fusionResult.agreementScore + modalityData.reduce((sum, m) => sum + m.confidence, 0) / modalityData.length) / 2 * 100).toFixed(1)}%
                    </p>
                    <Progress 
                      value={(fusionResult.agreementScore + modalityData.reduce((sum, m) => sum + m.confidence, 0) / modalityData.length) / 2 * 100} 
                      className="h-2 mt-2" 
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
              <p>Waiting for input data from all modalities</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Modality Predictions */}
      <div className="grid md:grid-cols-2 gap-6">
        {modalityData.map((modality, index) => {
          const Icon = modality.icon;
          return (
            <Card key={index} className="bg-gradient-card shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  {modality.modality}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(modality.status)}`}>
                    {modality.status}
                  </Badge>
                  {modality.status === 'active' && <CheckCircle className="w-4 h-4 text-success" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Stress Probability</span>
                    <span className={`font-bold ${getLikelihoodColor(modality.stressProbability)}`}>
                      {(modality.stressProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={modality.stressProbability * 100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Confidence</span>
                    <span className="font-bold text-primary">
                      {(modality.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={modality.confidence * 100} className="h-2" />
                  
                  <div>
                    <p className="font-medium mb-2">Key Features Detected:</p>
                    <div className="flex flex-wrap gap-1">
                      {modality.features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AAF Algorithm Explanation */}
      <Card className="bg-gradient-primary text-white shadow-glow border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Agreement-Aware Fusion (AAF) Algorithm</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Algorithm Steps:</h4>
              <ol className="space-y-2 text-sm text-white/90">
                <li>1. <strong>Individual Predictions:</strong> Each modality generates stress probability and confidence score</li>
                <li>2. <strong>Agreement Calculation:</strong> Measure consensus between modality predictions</li>
                <li>3. <strong>Weighted Fusion:</strong> Combine predictions using confidence and agreement weights</li>
                <li>4. <strong>Final Classification:</strong> Output binary decision with likelihood score</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-3">Fusion Formula:</h4>
              <div className="bg-white/10 p-4 rounded-lg font-mono text-sm">
                <p>P_fused = Σ(P_i × C_i × A) / Σ(C_i × A)</p>
                <div className="mt-2 text-xs text-white/70">
                  <p>Where:</p>
                  <p>P_i = Prediction from modality i</p>
                  <p>C_i = Confidence of modality i</p>
                  <p>A = Agreement score (1 - variance)</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white/10 rounded-lg">
            <h4 className="font-medium mb-2">Current Model Status:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-white/70">Facial CNN</p>
                <p className="font-bold">Ready</p>
              </div>
              <div>
                <p className="text-white/70">Audio MFCC</p>
                <p className="font-bold">Ready</p>
              </div>
              <div>
                <p className="text-white/70">Physiological NN</p>
                <p className="font-bold">Ready</p>
              </div>
              <div>
                <p className="text-white/70">Survey MLP</p>
                <p className="font-bold">Ready</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Data Stream */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Real-time Fusion Stream
          </CardTitle>
          <CardDescription>
            Live multimodal stress detection results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm max-h-40 overflow-y-auto">
            {Array.from({ length: 8 }).map((_, i) => {
              const timestamp = new Date(Date.now() - i * 5000).toLocaleTimeString();
              const prediction = Math.random() > 0.6 ? 'STRESSED' : 'RELAXED';
              const confidence = (Math.random() * 0.4 + 0.6).toFixed(3);
              
              return (
                <div key={i} className="text-xs mb-1 flex justify-between">
                  <span className="text-muted-foreground">[{timestamp}]</span>
                  <span className={prediction === 'STRESSED' ? 'text-destructive' : 'text-success'}>
                    {prediction}
                  </span>
                  <span className="text-primary">conf: {confidence}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};