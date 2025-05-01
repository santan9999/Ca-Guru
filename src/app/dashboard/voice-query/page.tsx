'use client';

import { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export default function VoiceQueryPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [detectedSubject, setDetectedSubject] = useState('');
  const [responseFormat, setResponseFormat] = useState('default');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition if available in the browser
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // Set to Indian English

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setError(`Error: ${event.error}. Please try again.`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Function to toggle listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError('');
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Function to process the transcript
  const processTranscript = async () => {
    if (!transcript.trim()) {
      setError('Please speak something before submitting.');
      return;
    }

    setIsProcessing(true);
    setAnswer('');
    setDetectedSubject('');

    try {
      // Call the voice query API
      const response = await fetch('/api/voice-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process voice query');
      }

      const data = await response.json();
      setAnswer(data.answer);
      setDetectedSubject(data.detectedSubject);
      setResponseFormat(data.format || 'default');
      
      // Update progress
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity: {
            type: 'question_answered',
            subject: data.detectedSubject,
            isCorrect: true // Assuming the user got value from the answer
          }
        }),
      });
      
    } catch (error) {
      console.error('Error processing voice query:', error);
      setError('Sorry, there was an error processing your query. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processTranscript();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Voice Query</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-center mb-6">
          <button
            onClick={toggleListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            <span className="sr-only">{isListening ? 'Stop Listening' : 'Start Listening'}</span>
            {isListening ? (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" strokeWidth={2} />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Transcript</div>
          <div className="min-h-24 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            {transcript ? transcript : (
              <span className="text-gray-400 dark:text-gray-500">
                {isListening ? 'Listening...' : 'Click the microphone button to start speaking'}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={processTranscript}
            disabled={!transcript.trim() || isProcessing}
            className={`px-4 py-2 rounded-md transition-colors ${!transcript.trim() || isProcessing
              ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Submit'}
          </button>
        </div>
      </div>
      
      {answer && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {detectedSubject && detectedSubject !== 'general' && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                {detectedSubject.charAt(0).toUpperCase() + detectedSubject.slice(1).replace('-', ' ')}
              </span>
            </div>
          )}
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Answer</div>
          <div className="prose dark:prose-invert max-w-none">
            <MarkdownRenderer content={answer} format={responseFormat} />
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>Was this answer helpful? Your feedback helps us improve.</p>
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                👍 Yes
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                👎 No
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Voice Query Tips</h2>
        <ul className="space-y-2 text-gray-600 dark:text-gray-300">
          <li>• Speak clearly and at a moderate pace for best results</li>
          <li>• Mention the subject area in your question (e.g., "In taxation, what is...")</li>
          <li>• Ask one question at a time for more accurate answers</li>
          <li>• If the transcript isn't accurate, click the microphone button to try again</li>
        </ul>
      </div>
    </div>
  );
}