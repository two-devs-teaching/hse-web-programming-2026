import TodoItem from '../TodoItem';

import styles from './index.module.css';

export default function TodoList({ todos, onToggle }) {
    return (
        <section aria-labelledby="todos-heading">
            <h2 id="todos-heading" className={styles.visuallyHidden}>Tasks</h2>

            <ul className={styles.list}>
                {todos.map(todo => (
                    <TodoItem key={todo.id} todo={todo} onToggle={onToggle} />
                ))}
            </ul>
        </section>
    );
}
