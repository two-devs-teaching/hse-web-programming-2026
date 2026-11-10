import styles from './index.module.css';

import classNames from 'classnames';

export default function TodoItem({ todo, onToggle }) {
    return (
        <li>
            <label className={classNames(styles.todo, { [styles.completed]: todo.completed })}>
                <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => onToggle(todo.id)}
                />

                <span>{todo.title}</span>
            </label>
        </li>
    );
}
