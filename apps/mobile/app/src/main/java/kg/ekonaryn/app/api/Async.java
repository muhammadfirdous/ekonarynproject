package kg.ekonaryn.app.api;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Tiny thread-pool wrapper for one-off API calls. */
public final class Async {

    public interface Call<T> {
        T run() throws Exception;
    }

    public interface OnSuccess<T> {
        void onSuccess(T value);
    }

    public interface OnError {
        void onError(Exception e);
    }

    private static final ExecutorService POOL = Executors.newFixedThreadPool(4);

    private Async() {}

    public static <T> void run(Call<T> work, OnSuccess<T> success, OnError error) {
        POOL.execute(() -> {
            try {
                T value = work.run();
                ApiClient.postMain(() -> success.onSuccess(value));
            } catch (Exception e) {
                ApiClient.postMain(() -> {
                    if (error != null) error.onError(e);
                });
            }
        });
    }
}
