import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DASS-21 survey questions (matching Python code exactly)
const dass21Questions = [
  "I found it hard to wind down",                               // Q1 (Stress)
  "I was aware of dryness of my mouth",                         // Q2 (Anxiety)
  "I couldn't seem to experience any positive feeling at all", // Q3 (Depression)
  "I experienced breathing difficulty (e.g., rapid breathing)", // Q4 (Anxiety)
  "I found it difficult to work up the initiative to do things",// Q5 (Depression)
  "I tended to over-react to situations",                       // Q6 (Stress)
  "I experienced trembling (e.g., in the hands)",               // Q7 (Anxiety)
  "I felt that I was using a lot of nervous energy",            // Q8 (Stress)
  "I was worried about situations in which I might panic",      // Q9 (Anxiety)
  "I felt that I had nothing to look forward to",               // Q10 (Depression)
  "I found myself getting agitated",                            // Q11 (Stress)
  "I found it difficult to relax",                              // Q12 (Stress)
  "I felt down-hearted and blue",                               // Q13 (Depression)
  "I was intolerant of anything that kept me from getting on",  // Q14 (Stress)
  "I felt I was close to panic",                                // Q15 (Anxiety)
  "I was unable to become enthusiastic about anything",         // Q16 (Depression)
  "I felt I wasn't worth much as a person",                     // Q17 (Depression)
  "I felt that I was rather touchy",                            // Q18 (Stress)
  "I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase)", // Q19 (Anxiety)
  "I felt scared without any good reason",                      // Q20 (Anxiety)
  "I felt that life was meaningless"                            // Q21 (Depression)
];

// Mock facial stress prediction
function predictFacial(imageData: string): { label: string, confidence: number } {
  const mockConfidence = Math.random() * 0.4 + 0.3; // 0.3-0.7
  return {
    label: mockConfidence > 0.5 ? "Stressed" : "Not Stressed",
    confidence: mockConfidence
  };
}

// Mock audio stress prediction
function predictAudio(audioData: string): { label: string, confidence: number } {
  const mockConfidence = Math.random() * 0.4 + 0.3;
  return {
    label: mockConfidence > 0.5 ? "Stressed" : "Not Stressed", 
    confidence: mockConfidence
  };
}

// Mock physiological stress prediction (matching Python structure)
function predictPhysio(eda: number, bvp: number, temp: number, x: number, y: number, z: number): { label: string, confidence: number } {
  try {
    // Simulate the same logic as Python predict_physio function
    let prediction = 0.0;
    
    // EDA contribution (normalized)
    prediction += (eda / 10.0) * 0.3;
    
    // BVP contribution (normalized)
    prediction += ((bvp - 60) / 40.0) * 0.25;
    
    // Temperature contribution (normalized)
    prediction += ((temp - 34) / 4.0) * 0.2;
    
    // Accelerometer magnitude contribution
    const accelMagnitude = Math.sqrt(x*x + y*y + z*z);
    prediction += (accelMagnitude / 2.0) * 0.25;
    
    // Clamp prediction between 0 and 1
    prediction = Math.max(0, Math.min(1, prediction));
    
    const label = prediction >= 0.5 ? "Stressed" : "Not Stressed";
    const confidence = prediction >= 0.5 ? prediction : 1 - prediction;
    
    return { label, confidence };
  } catch (error) {
    console.error('Physio Prediction Error:', error);
    return { label: "Error", confidence: 0.0 };
  }
}

// DASS-21 stress prediction (matching Python structure)
function predictDass21(responses: number[]): { label: string, confidence: number } {
  try {
    if (responses.length !== 21) {
      throw new Error("Expected 21 responses for DASS-21");
    }
    
    // Calculate total score
    const totalScore = responses.reduce((sum, response) => sum + response, 0);
    
    // Simulate neural network prediction (binary classification)
    const prediction = Math.min(1.0, totalScore / 42.0); // Normalize to 0-1
    
    const label = prediction >= 0.5 ? "Stressed" : "Not Stressed";
    const confidence = prediction >= 0.5 ? prediction : 1 - prediction;
    
    return { label, confidence };
  } catch (error) {
    console.error('DASS-21 Prediction Error:', error);
    return { label: "Error", confidence: 0.0 };
  }
}

// Convert prediction result to unified stress confidence score (matching Python)
function getStressConfidence(label: string, confidence: number): number {
  if (label.toLowerCase() === 'stressed') {
    return confidence;
  } else {
    return 1.0 - confidence;
  }
}

// Agreement-based fusion algorithm (matching Python exactly)
function agreementFusion(confidences: number[]): number {
  const M = confidences.length;
  const agreeScores: number[] = [];
  
  // Calculate agreement scores for each modality
  for (let i = 0; i < M; i++) {
    let totalAgree = 0;
    for (let j = 0; j < M; j++) {
      if (i !== j) {
        totalAgree += (1 - Math.abs(confidences[i] - confidences[j]));
      }
    }
    const agreeI = totalAgree / (M - 1);
    agreeScores.push(agreeI);
  }
  
  // Weighted fusion based on agreement scores
  const numerator = agreeScores.reduce((sum, agree, i) => sum + agree * confidences[i], 0);
  const denominator = agreeScores.reduce((sum, agree) => sum + agree, 0);
  
  return numerator / denominator;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, audioData, physiological, surveyResponses } = await req.json();

    // Individual modality predictions (matching Python function calls)
    const facialResult = predictFacial(imageData || "");
    const audioResult = predictAudio(audioData || "");
    
    // Extract physiological parameters in the same order as Python
    const physioResult = predictPhysio(
      physiological?.eda || 0,
      physiological?.bvp || 0,
      physiological?.temp || 0,
      physiological?.x || 0,
      physiological?.y || 0,
      physiological?.z || 0
    );
    
    // DASS-21 survey prediction
    const surveyResult = predictDass21(surveyResponses || Array(21).fill(0));

    // Fusion calculation (matching Python logic)
    const confidences = [
      getStressConfidence(audioResult.label, audioResult.confidence),
      getStressConfidence(facialResult.label, facialResult.confidence), 
      getStressConfidence(physioResult.label, physioResult.confidence),
      getStressConfidence(surveyResult.label, surveyResult.confidence)
    ];
    
    const fusedScore = agreementFusion(confidences);
    const fusedLabel = fusedScore >= 0.5 ? "🧠 Stressed" : "🙂 Not Stressed";

    // Return comprehensive results (matching Python output structure)
    return new Response(JSON.stringify({
      individual_predictions: {
        audio: audioResult,
        facial: facialResult,
        physiological: physioResult,
        survey: surveyResult
      },
      fusion_result: {
        label: fusedLabel,
        confidence: fusedScore,
        fused_score: fusedScore
      },
      modality_data: {
        audio: { 
          detected_features: ["mfcc_features", "voice_stress_patterns"],
          input_shape: "38x98x1"
        },
        facial: { 
          detected_features: ["emotion_analysis", "facial_expressions"],
          input_shape: "48x48x1"
        },
        physiological: { 
          eda: physiological?.eda || 0,
          bvp: physiological?.bvp || 0,
          temp: physiological?.temp || 0,
          x: physiological?.x || 0,
          y: physiological?.y || 0,
          z: physiological?.z || 0,
          input_features: 6
        },
        survey: { 
          total_questions: 21, 
          responses_provided: surveyResponses?.length || 0,
          dass21_categories: ["Depression", "Anxiety", "Stress"]
        }
      },
      confidences: confidences,
      dass21_questions: dass21Questions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in stress-prediction function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});