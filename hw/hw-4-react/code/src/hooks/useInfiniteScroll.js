import { useEffect, useRef, useState } from 'react';

export function useInfiniteScroll(todos, pageSize = 10) {
    const [page, setPage] = useState({ limit: pageSize, firstId: todos[0]?.id });
    const [isLoading, setIsLoading] = useState(false);
    const sentinelRef = useRef(null);

    const firstIndex = todos.findIndex(todo => todo.id === page.firstId);
    const visibleCount = page.limit + Math.max(0, firstIndex);
    const hasMore = visibleCount < todos.length;

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!hasMore || !sentinel || !('IntersectionObserver' in window)) {
            return;
        }

        let timeout;
        let pending = false;

        const observer = new IntersectionObserver((entries) => {
            if (!entries.some(entry => entry.isIntersecting) || pending) {
                return;
            }

            pending = true;
            setIsLoading(true);

            timeout = window.setTimeout(() => {
                setPage({ limit: visibleCount + pageSize, firstId: todos[0]?.id });
                setIsLoading(false);
            }, 1500);
        }, { rootMargin: '50px', threshold: 0.1 });

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
            window.clearTimeout(timeout);
        };
    }, [hasMore, visibleCount, pageSize, todos]);

    function loadMore() {
        setPage({ limit: visibleCount + pageSize, firstId: todos[0]?.id });
        setIsLoading(false);
    }

    return {
        todos: todos.slice(0, visibleCount),
        sentinelRef,
        hasMore,
        isLoading: hasMore && isLoading,
        loadMore
    };
}
