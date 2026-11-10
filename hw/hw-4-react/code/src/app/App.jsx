import favicon from '../assets/favicon.png';
import InfiniteScroll from '../components/InfiniteScroll';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useLocalStorageTodos } from '../hooks/useLocalStorageTodos';

import styles from './App.module.css';
import './global.module.css';

export default function App() {
    const { todos, error, addTodo, toggleTodo } = useLocalStorageTodos();
    const pagination = useInfiniteScroll(todos);

    return (
        <main className={styles.page}>
            <div className={styles.todoList}>
                <header className={styles.header}>
                    <img src={favicon} alt="" />
                    <h1>Todo Today</h1>
                </header>

                <TodoForm onAdd={addTodo} />

                {error && <p role="alert">{error}</p>}

                <TodoList todos={pagination.todos} onToggle={toggleTodo} />
                <InfiniteScroll {...pagination} />
            </div>
        </main>
    );
}
