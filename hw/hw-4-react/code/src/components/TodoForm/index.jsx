import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import MicrophoneIcon from '../MicrophoneIcon';

import styles from './index.module.css';

import classNames from 'classnames';
import { useState } from 'react';

export default function TodoForm({ onAdd }) {
    const [title, setTitle] = useState('');
    const { isRecording, error, startRecording } = useSpeechRecognition(setTitle);

    function handleSubmit(event) {
        event.preventDefault();

        if (onAdd(title)) {
            setTitle('');
        }
    }

    return (
        <div className={styles.field}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <input
                    name="todo"
                    aria-label="New task"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                />

                <button
                    type="button"
                    aria-label="Voice input"
                    aria-pressed={isRecording}
                    className={classNames({ [styles.recording]: isRecording })}
                    disabled={isRecording}
                    onClick={startRecording}
                >
                    <MicrophoneIcon />
                </button>

                <button type="submit">Add</button>
            </form>

            {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
    );
}
