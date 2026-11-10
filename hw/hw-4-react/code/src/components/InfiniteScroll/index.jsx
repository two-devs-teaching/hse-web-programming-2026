import styles from './index.module.css';

export default function InfiniteScroll({ sentinelRef, hasMore, isLoading, loadMore }) {
    if (!hasMore) {
        return null;
    }

    return (
        <>
            {isLoading && (
                <div className={styles.loading} role="status" aria-label="Loading tasks">
                    <div className={styles.spinner} />
                </div>
            )}

            <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />

            {!('IntersectionObserver' in window) && (
                <button type="button" onClick={loadMore}>Load more</button>
            )}
        </>
    );
}
