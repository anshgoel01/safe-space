import { useState, useEffect } from 'react';
import { Send, Bot, Loader2, RefreshCw, Key, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StressData {
  stressLevel: 'Low' | 'Moderate' | 'High';
  physiological: {
    eda: number;
    bvp: number;
    temp: number;
    accelX: number;
    accelY: number;
    accelZ: number;
  };
  surveyResponses: string[];
  facialIndicators: string;
  vocalIndicators: string;
}

export const AdvisorSection = () => {
  const [apiKey, setApiKey] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);

  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setShowApiInput(false);
    }
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey);
      setShowApiInput(false);
      setError('');
    }
  };

  const generateMockStressData = (): StressData => {
    const stressLevels: ('Low' | 'Moderate' | 'High')[] = ['Low', 'Moderate', 'High'];
    return {
      stressLevel: stressLevels[Math.floor(Math.random() * 3)],
      physiological: {
        eda: Math.random() * 10 + 2,
        bvp: Math.random() * 30 + 60,
        temp: Math.random() * 5 + 35,
        accelX: Math.random() * 2 - 1,
        accelY: Math.random() * 2 - 1,
        accelZ: Math.random() * 2 - 1,
      },
      surveyResponses: [
        "Feeling overwhelmed with work",
        "Sleep quality has been poor",
        "Muscle tension in shoulders"
      ],
      facialIndicators: "Increased eye strain, slight jaw tension detected",
      vocalIndicators: "Elevated pitch variation, faster speech rate"
    };
  };

  const getMockResponse = (stressData: StressData): string => {
    const responses = {
      Low: "Your stress levels appear manageable. Keep up the good work with your current coping strategies! Consider a short walk or some deep breathing to maintain this positive state.",
      Moderate: "I notice some stress indicators. Try the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8. Taking a 5-minute break could help reset your focus.",
      High: "Your readings suggest elevated stress. Please prioritize self-care right now. Consider stepping away from stressors, practicing progressive muscle relaxation, or reaching out to someone you trust."
    };
    return responses[stressData.stressLevel];
  };

  const createPrompt = (stressData: StressData): string => {
    return `You are a supportive AI stress advisor. Based on the following stress assessment data, provide personalized, calm advice in 2-4 sentences max:

Stress Level: ${stressData.stressLevel}
Physiological Data:
- EDA (skin conductance): ${stressData.physiological.eda.toFixed(2)}
- Heart rate variability: ${stressData.physiological.bvp.toFixed(2)}
- Skin temperature: ${stressData.physiological.temp.toFixed(1)}°C
- Movement activity: X:${stressData.physiological.accelX.toFixed(2)}, Y:${stressData.physiological.accelY.toFixed(2)}, Z:${stressData.physiological.accelZ.toFixed(2)}

Survey Responses: ${stressData.surveyResponses.join(', ')}
Facial Indicators: ${stressData.facialIndicators}
Vocal Indicators: ${stressData.vocalIndicators}

Provide supportive, actionable advice to help reduce stress. Be empathetic and concise.`;
  };

  const getAdvice = async () => {
    setLoading(true);
    setError('');
    
    const stressData = generateMockStressData();
    
    try {
      if (!apiKey.trim()) {
        // Use mock response
        setTimeout(() => {
          setResponse(getMockResponse(stressData));
          setLoading(false);
        }, 1500);
        return;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a supportive, calm AI stress advisor. Always respond with empathy and provide practical, actionable advice in 2-4 sentences.'
            },
            {
              role: 'user',
              content: createPrompt(stressData)
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      setResponse(data.choices[0].message.content);
      
    } catch (err) {
      console.error('Error calling OpenAI API:', err);
      setError('Unable to connect to AI advisor. Using offline recommendation.');
      setResponse(getMockResponse(stressData));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI Stress Advisor
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get personalized advice based on your real-time stress assessment data from our multimodal analysis.
        </p>
      </div>

      {showApiInput && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Key className="h-5 w-5 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">OpenAI API Key (Optional)</h3>
              <p className="text-sm text-blue-700 mb-4">
                Enter your OpenAI API key for personalized AI responses, or continue without one to use offline recommendations.
              </p>
              <div className="flex space-x-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={saveApiKey} variant="outline">
                  Save
                </Button>
                <Button 
                  onClick={() => setShowApiInput(false)} 
                  variant="ghost"
                  size="sm"
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Stress Summary */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Bot className="h-5 w-5 mr-2 text-blue-600" />
            Current Assessment
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Stress Level:</span>
              <span className="font-medium text-orange-600">Moderate</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EDA:</span>
              <span>5.2 μS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heart Rate Variability:</span>
              <span>72 BPM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Skin Temperature:</span>
              <span>36.8°C</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-gray-600 text-xs">
                <strong>Recent Indicators:</strong> Slight muscle tension detected, elevated vocal stress markers
              </p>
            </div>
          </div>
          
          <Button 
            onClick={getAdvice}
            disabled={loading}
            className="w-full mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Advice...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Get AI Advice
              </>
            )}
          </Button>
        </Card>

        {/* AI Response */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center">
              <Bot className="h-5 w-5 mr-2 text-green-600" />
              AI Recommendations
            </h3>
            {response && !loading && (
              <Button 
                onClick={getAdvice}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Ask Again
              </Button>
            )}
          </div>
          
          <div className="min-h-32 p-4 bg-gray-50 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Analyzing your stress data...</span>
              </div>
            ) : response ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">{response}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-gray-500">
                <Bot className="h-8 w-8 mr-2" />
                <span>Click "Get AI Advice" to receive personalized recommendations</span>
              </div>
            )}
          </div>
          
          {!apiKey && !showApiInput && (
            <div className="mt-4 text-xs text-gray-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Using offline recommendations. Add OpenAI API key for personalized responses.
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowApiInput(true)}
                className="ml-1 h-auto p-1 text-xs underline"
              >
                Add Key
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};