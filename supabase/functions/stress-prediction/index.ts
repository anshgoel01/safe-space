import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DASS-21 Questions for reference
const dass21Questions = [
  "I found it hard to wind down",
  "I was aware of dryness of my mouth", 
  "I couldn't seem to experience any positive feeling at all",
  "I experienced breathing difficulty (e.g., rapid breathing)",
  "I found it difficult to work up the initiative to do things",
  "I tended to over-react to situations",
  "I experienced trembling (e.g., in the hands)",
  "I felt that I was using a lot of nervous energy",
  "I was worried about situations in which I might panic",
  "I felt that I had nothing to look forward to",
  "I found myself getting agitated",
  "I found it difficult to relax",
  "I felt down-hearted and blue",
  "I was intolerant of anything that kept me from getting on",
  "I felt I was close to panic",
  "I was unable to become enthusiastic about anything",
  "I felt I wasn't worth much as a person",
  "I felt that I was rather touchy",
  "I was aware of the action of my heart in the absence of physical exertion",
  "I felt scared without any good reason",
  "I felt that life was meaningless"
];

// Mock prediction functions (replace with actual ONNX inference)
function predictFacial(imageData: string): { label: string, confidence: number } {
  // TODO: Implement actual ONNX inference
  const mockConfidence = Math.random() * 0.4 + 0.3; // 0.3-0.7
  return {
    label: mockConfidence > 0.5 ? "Stressed" : "Not Stressed",
    confidence: mockConfidence
  };
}

function predictAudio(audioData: string): { label: string, confidence: number } {
  // TODO: Implement actual ONNX inference with MFCC extraction
  const mockConfidence = Math.random() * 0.4 + 0.3;
  return {
    label: mockConfidence > 0.5 ? "Stressed" : "Not Stressed", 
    confidence: mockConfidence
  };
}

function predictPhysio(eda: number, bvp: number, temp: number, x: number, y: number, z: number): { label: string, confidence: number } {
  // TODO: Implement actual ONNX inference with scaling
  // For now, simple heuristic based on EDA and BVP
  const normalizedEda = Math.min(eda / 10, 1); // Assuming EDA range 0-10
  const normalizedBvp = Math.min(bvp / 100, 1); // Assuming BVP range 0-100
  const stressScore = (normalizedEda * 0.6 + normalizedBvp * 0.4);
  
  return {
    label: stressScore > 0.5 ? "Stressed" : "Not Stressed",
    confidence: stressScore
  };
}

function predictDass21(responses: number[]): { label: string, confidence: number } {
  if (responses.length !== 21) {
    throw new Error("Expected 21 responses for DASS-21");
  }
  
  // Calculate DASS-21 subscales (multiply by 2 for full-scale equivalent)
  const depressionIndices = [2, 4, 9, 12, 15, 18, 20];
  const anxietyIndices = [1, 3, 6, 8, 14, 17, 19];
  const stressIndices = [0, 5, 7, 10, 11, 13, 16];
  
  const depression = depressionIndices.reduce((sum, i) => sum + responses[i], 0) * 2;
  const anxiety = anxietyIndices.reduce((sum, i) => sum + responses[i], 0) * 2;
  const stress = stressIndices.reduce((sum, i) => sum + responses[i], 0) * 2;
  
  // Simple threshold-based classification
  const totalScore = depression + anxiety + stress;
  const maxPossible = 21 * 3 * 2; // 21 questions, max 3 points each, multiplied by 2
  const normalizedScore = totalScore / maxPossible;
  
  return {
    label: normalizedScore > 0.4 ? "Stressed" : "Not Stressed",
    confidence: normalizedScore
  };
}

function getStressConfidence(label: string, confidence: number): number {
  return label.toLowerCase() === 'stressed' ? confidence : 1.0 - confidence;
}

function agreementFusion(confidences: number[]): number {
  const M = confidences.length;
  const agreeScores: number[] = [];
  
  for (let i = 0; i < M; i++) {
    let totalAgree = 0;
    for (let j = 0; j < M; j++) {
      if (i !== j) {
        totalAgree += (1 - Math.abs(confidences[i] - confidences[j]));
      }
    }
    agreeScores.push(totalAgree / (M - 1));
  }
  
  const numerator = agreeScores.reduce((sum, score, i) => sum + (score * confidences[i]), 0);
  const denominator = agreeScores.reduce((sum, score) => sum + score, 0);
  
  return numerator / denominator;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      imageData, 
      audioData, 
      physiological, 
      surveyResponses 
    } = await req.json();

    console.log('Received prediction request');

    // Individual predictions
    const facialResult = predictFacial(imageData);
    const audioResult = predictAudio(audioData);
    const physioResult = predictPhysio(
      physiological.eda,
      physiological.bvp, 
      physiological.temp,
      physiological.x,
      physiological.y,
      physiological.z
    );
    const surveyResult = predictDass21(surveyResponses);

    // Convert to stress confidences
    const confidences = [
      getStressConfidence(facialResult.label, facialResult.confidence),
      getStressConfidence(audioResult.label, audioResult.confidence),
      getStressConfidence(physioResult.label, physioResult.confidence),
      getStressConfidence(surveyResult.label, surveyResult.confidence)
    ];

    // Fusion
    const fusedScore = agreementFusion(confidences);
    const finalLabel = fusedScore >= 0.5 ? "Stressed" : "Not Stressed";

    const result = {
      individual: {
        facial: facialResult,
        audio: audioResult,
        physiological: physioResult,
        survey: surveyResult
      },
      fusion: {
        label: finalLabel,
        confidence: fusedScore,
        agreeementScore: confidences.reduce((sum, conf, i, arr) => {
          return sum + arr.reduce((innerSum, otherConf, j) => {
            return i !== j ? innerSum + (1 - Math.abs(conf - otherConf)) : innerSum;
          }, 0) / (arr.length - 1);
        }, 0) / confidences.length
      },
      modalityData: confidences.map((conf, i) => ({
        modality: ['Facial', 'Audio', 'Physiological', 'Survey'][i],
        stressProbability: conf,
        confidence: conf,
        status: conf > 0.6 ? 'High' : conf > 0.4 ? 'Medium' : 'Low'
      }))
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in stress-prediction function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});