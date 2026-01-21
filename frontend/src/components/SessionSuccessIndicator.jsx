import { useState, useEffect } from 'react';
import { predictSessionSuccess } from '../api/ml';

export default function SessionSuccessIndicator({ mentorId, studentId, skillId, slot }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mentorId && studentId && skillId && slot) {
      loadPrediction();
    }
  }, [mentorId, studentId, skillId, slot]);

  async function loadPrediction() {
    setLoading(true);
    try {
      const data = await predictSessionSuccess({
        mentorId,
        studentId,
        skillId,
        slot: new Date(slot).toISOString()
      });
      
      if (data.success && data.prediction) {
        setPrediction(data.prediction);
      }
    } catch (err) {
      console.error('Failed to predict session success:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
        Analyzing...
      </div>
    );
  }

  if (!prediction) return null;

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return '✓';
      case 'medium':
        return '⚠';
      case 'high':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  const getRiskText = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'High success probability';
      case 'medium':
        return 'Moderate success probability';
      case 'high':
        return 'Consider rescheduling';
      default:
        return 'Success probability';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${getRiskColor(prediction.riskLevel)}`}>
      <span className="text-sm">{getRiskIcon(prediction.riskLevel)}</span>
      <span>{getRiskText(prediction.riskLevel)}</span>
      <span className="font-semibold">
        {Math.round(prediction.successProbability * 100)}%
      </span>
      {prediction.fallback && (
        <span className="text-xs opacity-70">(estimate)</span>
      )}
    </div>
  );
}
