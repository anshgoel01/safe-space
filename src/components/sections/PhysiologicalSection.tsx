import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Watch, Activity, Thermometer, Zap, Wifi, WifiOff, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhysiologicalData {
  eda: number;
  bvp: number;
  temp: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  timestamp: number;
}

export const PhysiologicalSection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<PhysiologicalData>({
    eda: 0,
    bvp: 0,
    temp: 0,
    accelX: 0,
    accelY: 0,
    accelZ: 0,
    timestamp: 0
  });
  const [dataHistory, setDataHistory] = useState<PhysiologicalData[]>([]);
  const { toast } = useToast();

  // Simulate ESP32 data fetching
  const connectToDevice = async () => {
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(true);
      
      toast({
        title: "Device connected",
        description: "ESP32 wearable device is now streaming data",
      });

      // Start data simulation
      const interval = setInterval(() => {
        const newData: PhysiologicalData = {
          eda: Math.random() * 10 + 2, // 2-12 μS
          bvp: Math.random() * 40 + 60, // 60-100 BPM
          temp: Math.random() * 4 + 34, // 34-38°C
          accelX: (Math.random() - 0.5) * 2, // -1 to 1 g
          accelY: (Math.random() - 0.5) * 2,
          accelZ: Math.random() * 0.2 + 0.9, // 0.9-1.1 g (mostly gravity)
          timestamp: Date.now()
        };
        
        setData(newData);
        setDataHistory(prev => [...prev.slice(-19), newData]); // Keep last 20 readings
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to connect to ESP32 device",
        variant: "destructive",
      });
    }
  };

  const disconnectDevice = () => {
    setIsConnected(false);
    setData({
      eda: 0,
      bvp: 0,
      temp: 0,
      accelX: 0,
      accelY: 0,
      accelZ: 0,
      timestamp: 0
    });
    
    toast({
      title: "Device disconnected",
      description: "Physiological monitoring stopped",
    });
  };

  // Determine stress levels based on values
  const getStressLevel = (metric: string, value: number) => {
    switch (metric) {
      case 'eda':
        if (value > 8) return 'high';
        if (value > 5) return 'medium';
        return 'low';
      case 'bvp':
        if (value > 85) return 'high';
        if (value > 75) return 'medium';
        return 'low';
      case 'temp':
        if (value > 37) return 'high';
        if (value > 36) return 'medium';
        return 'low';
      default:
        return 'low';
    }
  };

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'high': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatValue = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2 font-poppins">Physiological Monitoring</h2>
        <p className="text-muted-foreground">Real-time biometric data from ESP32 wearable device</p>
      </div>

      {/* Connection Status */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Device Connection
          </CardTitle>
          <CardDescription>
            ESP32-based wearable device status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <Wifi className="w-6 h-6 text-success" />
                  <div>
                    <p className="font-medium">Connected</p>
                    <p className="text-sm text-muted-foreground">Streaming data at 1Hz</p>
                  </div>
                </>
              ) : (
                <>
                  <WifiOff className="w-6 h-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Disconnected</p>
                    <p className="text-sm text-muted-foreground">No device connected</p>
                  </div>
                </>
              )}
            </div>
            
            <Button
              variant={isConnected ? "destructive" : "default"}
              onClick={isConnected ? disconnectDevice : connectToDevice}
            >
              {isConnected ? "Disconnect" : "Connect Device"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Data Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* EDA Card */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              EDA (Skin Conductance)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {formatValue(data.eda)} μS
                </div>
                <Badge className={`mt-2 ${getStatusColor(getStressLevel('eda', data.eda))}`}>
                  {getStressLevel('eda', data.eda)} stress
                </Badge>
              </div>
              <Progress value={(data.eda / 12) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Normal range: 2-6 μS
              </p>
            </div>
          </CardContent>
        </Card>

        {/* BVP Card */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              BVP (Heart Rate)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {formatValue(data.bvp, 0)} BPM
                </div>
                <Badge className={`mt-2 ${getStatusColor(getStressLevel('bvp', data.bvp))}`}>
                  {getStressLevel('bvp', data.bvp)} stress
                </Badge>
              </div>
              <Progress value={(data.bvp / 100) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Resting range: 60-80 BPM
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Temperature Card */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-primary" />
              Skin Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {formatValue(data.temp, 1)}°C
                </div>
                <Badge className={`mt-2 ${getStatusColor(getStressLevel('temp', data.temp))}`}>
                  {getStressLevel('temp', data.temp)} stress
                </Badge>
              </div>
              <Progress value={((data.temp - 32) / 8) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Normal range: 34-36°C
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accelerometer Data */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="w-5 h-5 text-primary" />
            Accelerometer Data
          </CardTitle>
          <CardDescription>
            3-axis movement and orientation data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">X-Axis</p>
              <p className="text-2xl font-bold">{formatValue(data.accelX)} g</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">Y-Axis</p>
              <p className="text-2xl font-bold">{formatValue(data.accelY)} g</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">Z-Axis</p>
              <p className="text-2xl font-bold">{formatValue(data.accelZ)} g</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Stream Preview */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle>Data Stream</CardTitle>
          <CardDescription>
            Real-time physiological data stream preview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm max-h-32 overflow-y-auto">
            {isConnected ? (
              dataHistory.slice(-5).map((reading, index) => (
                <div key={index} className="text-xs mb-1">
                  [{new Date(reading.timestamp).toLocaleTimeString()}] 
                  EDA: {formatValue(reading.eda)} | 
                  BVP: {formatValue(reading.bvp, 0)} | 
                  TEMP: {formatValue(reading.temp, 1)} | 
                  ACC: [{formatValue(reading.accelX)}, {formatValue(reading.accelY)}, {formatValue(reading.accelZ)}]
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No data - device not connected</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Neural Network Integration Info */}
      <Card className="bg-gradient-primary text-white shadow-glow border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Feedforward Neural Network</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Input Features</h4>
              <ul className="space-y-1 text-white/80">
                <li>• EDA (μS)</li>
                <li>• BVP/Heart Rate (BPM)</li>
                <li>• Skin Temperature (°C)</li>
                <li>• Accelerometer (3-axis)</li>
                <li>• Feature derivatives</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Network Architecture</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Input layer: 10 neurons</li>
                <li>• Hidden layers: 64, 32, 16</li>
                <li>• Output layer: 2 neurons</li>
                <li>• ReLU activation</li>
                <li>• Dropout: 0.3</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Output</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Stress probability</li>
                <li>• Relaxation probability</li>
                <li>• Confidence score</li>
                <li>• Anomaly detection</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm">
              <strong>Integration Point:</strong> The feedforward neural network will process physiological 
              signals to detect stress patterns and provide real-time stress level classification.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};