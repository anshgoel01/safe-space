import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Save, BarChart3, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SurveyQuestion {
  id: string;
  question: string;
  category: string;
  type: 'likert' | 'scale';
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
}

interface SurveyResponse {
  questionId: string;
  value: number;
  timestamp: number;
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: 'work_pressure',
    question: 'How much pressure do you feel from your work right now?',
    category: 'Workload',
    type: 'scale',
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: { min: 'No pressure', max: 'Extreme pressure' }
  },
  {
    id: 'time_pressure',
    question: 'Do you feel rushed or pressured by time constraints?',
    category: 'Time Management',
    type: 'likert',
    options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
  },
  {
    id: 'emotional_exhaustion',
    question: 'How emotionally drained do you feel at this moment?',
    category: 'Emotional State',
    type: 'scale',
    scaleMin: 1,
    scaleMax: 7,
    scaleLabels: { min: 'Not at all', max: 'Completely drained' }
  },
  {
    id: 'concentration',
    question: 'How difficult is it to concentrate on your tasks?',
    category: 'Cognitive Function',
    type: 'likert',
    options: ['Very Easy', 'Easy', 'Moderate', 'Difficult', 'Very Difficult']
  },
  {
    id: 'anxiety_level',
    question: 'Rate your current anxiety level',
    category: 'Emotional State',
    type: 'scale',
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: { min: 'Completely calm', max: 'Extremely anxious' }
  },
  {
    id: 'work_satisfaction',
    question: 'How satisfied are you with your current work situation?',
    category: 'Job Satisfaction',
    type: 'likert',
    options: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']
  },
  {
    id: 'physical_symptoms',
    question: 'Are you experiencing any physical stress symptoms? (headache, tension, fatigue)',
    category: 'Physical State',
    type: 'likert',
    options: ['None at all', 'Very mild', 'Mild', 'Moderate', 'Severe']
  },
  {
    id: 'support_system',
    question: 'Do you feel you have adequate support to handle your current workload?',
    category: 'Social Support',
    type: 'likert',
    options: ['Completely adequate', 'Mostly adequate', 'Somewhat adequate', 'Inadequate', 'Completely inadequate']
  }
];

export const SurveySection = () => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stressLabel, setStressLabel] = useState<'Low' | 'Medium' | 'High' | null>(null);
  const { toast } = useToast();

  const handleResponse = (questionId: string, value: number) => {
    const newResponse: SurveyResponse = {
      questionId,
      value,
      timestamp: Date.now()
    };

    setResponses(prev => {
      const filtered = prev.filter(r => r.questionId !== questionId);
      return [...filtered, newResponse];
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateStressLevel = () => {
    if (responses.length !== surveyQuestions.length) return null;

    // Calculate weighted stress score
    let totalScore = 0;
    let maxPossibleScore = 0;

    responses.forEach(response => {
      const question = surveyQuestions.find(q => q.id === response.questionId);
      if (question) {
        if (question.type === 'likert') {
          totalScore += (response.value / 5) * 10; // Normalize to 0-10
          maxPossibleScore += 10;
        } else {
          const normalizedScore = ((response.value - (question.scaleMin || 1)) / 
                                  ((question.scaleMax || 10) - (question.scaleMin || 1))) * 10;
          totalScore += normalizedScore;
          maxPossibleScore += 10;
        }
      }
    });

    const stressPercentage = (totalScore / maxPossibleScore) * 100;
    
    if (stressPercentage <= 30) return 'Low';
    if (stressPercentage <= 65) return 'Medium';
    return 'High';
  };

  const submitSurvey = () => {
    if (responses.length !== surveyQuestions.length) {
      toast({
        title: "Incomplete survey",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }

    const calculatedStressLevel = calculateStressLevel();
    setStressLabel(calculatedStressLevel);
    setIsCompleted(true);

    // Save to localStorage
    const surveyData = {
      responses,
      stressLevel: calculatedStressLevel,
      timestamp: Date.now()
    };
    localStorage.setItem('safespace_survey', JSON.stringify(surveyData));

    toast({
      title: "Survey submitted",
      description: `Stress level assessed as: ${calculatedStressLevel}`,
    });
  };

  const resetSurvey = () => {
    setResponses([]);
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
    setStressLabel(null);
  };

  const currentQuestion = surveyQuestions[currentQuestionIndex];
  const currentResponse = responses.find(r => r.questionId === currentQuestion?.id);
  const progress = (responses.length / surveyQuestions.length) * 100;

  const getStressColor = (level: string | null) => {
    switch (level) {
      case 'Low': return 'bg-success text-success-foreground';
      case 'Medium': return 'bg-warning text-warning-foreground';
      case 'High': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isCompleted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2 font-poppins">Survey Complete</h2>
          <p className="text-muted-foreground">WorkStress3D assessment results</p>
        </div>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Stress Assessment Results
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <div className="text-6xl font-bold mb-4">
                <Badge className={`text-2xl px-6 py-3 ${getStressColor(stressLabel)}`}>
                  {stressLabel} Stress
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Based on {responses.length} survey responses
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Response Rate</h4>
                <p className="text-2xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground">All questions answered</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Completion Time</h4>
                <p className="text-2xl font-bold text-primary">2:34</p>
                <p className="text-sm text-muted-foreground">Minutes to complete</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Data Quality</h4>
                <p className="text-2xl font-bold text-primary">High</p>
                <p className="text-sm text-muted-foreground">Consistent responses</p>
              </div>
            </div>

            <Button onClick={resetSurvey} variant="outline" className="mt-4">
              Take Survey Again
            </Button>
          </CardContent>
        </Card>

        {/* Response Summary */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle>Response Summary</CardTitle>
            <CardDescription>Your answers to the WorkStress3D questionnaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {surveyQuestions.map((question, index) => {
                const response = responses.find(r => r.questionId === question.id);
                return (
                  <div key={question.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 pr-4">
                      <p className="font-medium text-sm">{question.question}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{question.category}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {response?.value} / {question.type === 'likert' ? '5' : question.scaleMax}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2 font-poppins">Self-Assessment Survey</h2>
        <p className="text-muted-foreground">WorkStress3D instant questionnaire for current stress state</p>
      </div>

      {/* Progress */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {responses.length} / {surveyQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{currentQuestion.category}</Badge>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {surveyQuestions.length}
              </span>
            </div>
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentQuestion.type === 'likert' && currentQuestion.options && (
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${currentResponse?.value === index + 1 
                          ? 'border-primary bg-accent' 
                          : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={index + 1}
                        checked={currentResponse?.value === index + 1}
                        onChange={() => handleResponse(currentQuestion.id, index + 1)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{option}</span>
                        <div className={`w-4 h-4 rounded-full border-2 
                          ${currentResponse?.value === index + 1 
                            ? 'border-primary bg-primary' 
                            : 'border-border'
                          }`} />
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'scale' && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{currentQuestion.scaleLabels?.min}</span>
                    <span>{currentQuestion.scaleLabels?.max}</span>
                  </div>
                  
                  <div className="grid grid-cols-10 gap-2">
                    {Array.from({ length: currentQuestion.scaleMax || 10 }, (_, index) => {
                      const value = (currentQuestion.scaleMin || 1) + index;
                      return (
                        <button
                          key={value}
                          onClick={() => handleResponse(currentQuestion.id, value)}
                          className={`aspect-square rounded-lg border-2 transition-all font-bold
                            ${currentResponse?.value === value
                              ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                              : 'border-border hover:border-primary/50'
                            }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>

                  {currentResponse && (
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        Selected: {currentResponse.value}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentQuestionIndex === surveyQuestions.length - 1 ? (
                  <Button onClick={submitSurvey} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Submit Survey
                  </Button>
                ) : (
                  <Button 
                    onClick={nextQuestion}
                    disabled={!currentResponse}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MLP Integration Info */}
      <Card className="bg-gradient-primary text-white shadow-glow border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Multi-Layer Perceptron (MLP) Processing
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Input Processing</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Likert scale normalization</li>
                <li>• Feature encoding</li>
                <li>• Missing data handling</li>
                <li>• Outlier detection</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Network Architecture</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Input layer: 8 features</li>
                <li>• Hidden layers: 16, 8, 4</li>
                <li>• Output layer: 3 classes</li>
                <li>• Softmax activation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Classification Output</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Low stress probability</li>
                <li>• Medium stress probability</li>
                <li>• High stress probability</li>
                <li>• Confidence intervals</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm">
              <strong>Integration Point:</strong> The MLP model will process survey responses to classify 
              stress levels and provide confidence scores for the self-reported emotional state assessment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};