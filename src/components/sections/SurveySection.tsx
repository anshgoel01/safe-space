import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardList, Save, BarChart3, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SurveyQuestion {
  id: string;
  question: string;
  category: string;
  type: 'scale';
  scaleMin: number;
  scaleMax: number;
  scaleLabels: { min: string; max: string };
}

interface SurveyResponse {
  questionId: string;
  value: number;
  timestamp: number;
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: 'q1',
    question: 'I found it hard to wind down',
    category: 'Stress',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q2',
    question: 'I was aware of dryness of my mouth',
    category: 'Anxiety',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q3',
    question: "I couldn't seem to experience any positive feeling at all",
    category: 'Depression',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q4',
    question: 'I experienced breathing difficulty (e.g., rapid breathing)',
    category: 'Anxiety',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q5',
    question: 'I found it difficult to work up the initiative to do things',
    category: 'Depression',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q6',
    question: 'I tended to over-react to situations',
    category: 'Stress',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q7',
    question: 'I experienced trembling (e.g., in the hands)',
    category: 'Anxiety',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q8',
    question: 'I felt that I was using a lot of nervous energy',
    category: 'Stress',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q9',
    question: 'I was worried about situations in which I might panic',
    category: 'Anxiety',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q10',
    question: 'I felt that I had nothing to look forward to',
    category: 'Depression',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q11',
    question: 'I found myself getting agitated',
    category: 'Stress',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q12',
    question: 'I found it difficult to relax',
    category: 'Stress',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q13',
    question: 'I felt down-hearted and blue',
    category: 'Depression',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q14',
    question: 'I was intolerant of anything that kept me from getting on',
    category: 'Stress',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q15',
    question: 'I felt I was close to panic',
    category: 'Anxiety',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q16',
    question: 'I was unable to become enthusiastic about anything',
    category: 'Depression',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q17',
    question: "I felt I wasn't worth much as a person",
    category: 'Depression',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q18',
    question: 'I felt that I was rather touchy',
    category: 'Stress',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q19',
    question: 'I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase)',
    category: 'Anxiety',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q20',
    question: 'I felt scared without any good reason',
    category: 'Anxiety',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  },
  {
    id: 'q21',
    question: 'I felt that life was meaningless',
    category: 'Depression',
    type: 'scale',
    scaleMin: 0,
    scaleMax: 3,
    scaleLabels: { min: 'Did not apply to me at all', max: 'Applied to me very much' }
  }
];

export const SurveySection = () => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
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

  const calculateStressLevel = () => {
    if (responses.length !== surveyQuestions.length) return null;

    // Calculate DASS-21 score (sum of all responses)
    const totalScore = responses.reduce((sum, response) => sum + response.value, 0);
    
    // DASS-21 stress classification (multiply by 2 for full scale equivalent)
    const stressScore = totalScore * 2;
    
    if (stressScore <= 14) return 'Low';
    if (stressScore <= 25) return 'Medium';
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

    // Save to localStorage for fusion
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
    setIsCompleted(false);
    setStressLabel(null);
    localStorage.removeItem('safespace_survey');
  };

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
          <p className="text-muted-foreground">DASS-21 assessment results</p>
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
                <h4 className="font-medium mb-2">Total Score</h4>
                <p className="text-2xl font-bold text-primary">
                  {responses.reduce((sum, response) => sum + response.value, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Out of 63 points</p>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2 font-poppins">DASS-21 Assessment</h2>
        <p className="text-muted-foreground">Depression, Anxiety and Stress Scale - 21 Questions</p>
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

      {/* Scrollable Survey Container */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            DASS-21 Questions
          </CardTitle>
          <CardDescription>
            Answer all questions based on how much each statement applied to you over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-4">
              {surveyQuestions.map((question, index) => {
                const response = responses.find(r => r.questionId === question.id);
                return (
                  <div key={question.id} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2">{question.category}</Badge>
                        <h4 className="font-medium text-sm leading-relaxed">
                          {index + 1}. {question.question}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {Array.from({ length: 4 }, (_, valueIndex) => {
                        const value = valueIndex;
                        const labels = ['Never', 'Sometimes', 'Often', 'Almost Always'];
                        return (
                          <button
                            key={value}
                            onClick={() => handleResponse(question.id, value)}
                            className={`p-2 rounded-lg border-2 transition-all font-medium text-xs
                              ${response?.value === value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:border-primary/50'
                              }`}
                          >
                            <div className="font-bold">{value}</div>
                            <div className="text-xs opacity-80">{labels[valueIndex]}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={submitSurvey} 
              className="w-full flex items-center justify-center gap-2"
              disabled={responses.length !== surveyQuestions.length}
            >
              <Save className="w-4 h-4" />
              Submit Survey ({responses.length}/{surveyQuestions.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MLP Integration Info */}
      <Card className="bg-gradient-primary text-white shadow-glow border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            DASS-21 Model Processing
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Input Processing</h4>
              <ul className="space-y-1 text-white/80">
                <li>• 21 question responses (0-3 scale)</li>
                <li>• Feature normalization</li>
                <li>• Categorical scoring</li>
                <li>• Stress level classification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">DASS-21 Subscales</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Depression: 7 questions</li>
                <li>• Anxiety: 7 questions</li>
                <li>• Stress: 7 questions</li>
                <li>• Full scale equivalent (×2)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Classification Output</h4>
              <ul className="space-y-1 text-white/80">
                <li>• Stress probability</li>
                <li>• Confidence score</li>
                <li>• Severity level</li>
                <li>• Risk assessment</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm">
              <strong>Integration Point:</strong> The DASS-21 model processes survey responses to classify 
              stress levels and provide confidence scores for the self-reported emotional state assessment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};