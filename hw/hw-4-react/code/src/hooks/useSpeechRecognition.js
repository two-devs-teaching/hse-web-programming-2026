import { useEffect, useRef, useState } from 'react';

export function useSpeechRecognition(onResult) {
    const recognitionRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = 'ru-RU';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsRecording(true);

        recognition.onresult = event => onResult(event.results[0][0].transcript);

        recognition.onerror = event => {
            setError(`Ошибка голосового ввода: ${event.error}`);
            setIsRecording(false);
        };

        recognition.onend = () => setIsRecording(false);

        recognitionRef.current = recognition;

        return () => {
            recognition.onstart = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.abort();
            recognitionRef.current = null;
        };
    }, [onResult]);

    function startRecording() {
        setError('');

        if (!recognitionRef.current) {
            setError('Ваш браузер не поддерживает голосовой ввод');

            return;
        }

        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch {
            setError('Не удалось запустить голосовой ввод');
            setIsRecording(false);
        }
    }

    return {
        isRecording,
        error,
        startRecording
    };
}
