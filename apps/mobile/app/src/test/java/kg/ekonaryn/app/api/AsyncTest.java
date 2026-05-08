package kg.ekonaryn.app.api;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowLooper;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Async runs work on a background pool and posts the result back via
 * ApiClient.postMain (which uses the main looper Handler). Robolectric's
 * ShadowLooper drives the main looper synchronously so we can observe the
 * callback from the same test thread.
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 33)
public class AsyncTest {

    @Test
    public void run_invokesOnSuccess_withWorkResult() throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> capture = new AtomicReference<>();
        Async.run(
                () -> "hello",
                v -> { capture.set(v); done.countDown(); },
                err -> { fail("unexpected error path: " + err.getMessage()); }
        );
        // The work runs on a background thread; once it posts back, ShadowLooper
        // needs to flush the main-thread Runnable so the callback executes.
        flushMainUntil(done);
        assertEquals("hello", capture.get());
    }

    @Test
    public void run_invokesOnError_whenWorkThrows() throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<Exception> capture = new AtomicReference<>();
        Exception oops = new RuntimeException("boom");
        Async.run(
                () -> { throw oops; },
                v -> { fail("unexpected success: " + v); },
                err -> { capture.set(err); done.countDown(); }
        );
        flushMainUntil(done);
        assertSame(oops, capture.get());
    }

    @Test
    public void run_swallowsErrorPath_whenOnErrorIsNull() throws Exception {
        CountDownLatch successLatch = new CountDownLatch(1);
        AtomicReference<String> success = new AtomicReference<>();
        // First, prove the code path doesn't crash with null OnError.
        Async.run(
                () -> { throw new RuntimeException("ignore me"); },
                v -> { fail("should not succeed"); },
                null
        );
        // Then verify a follow-up successful call still works (pool isn't poisoned).
        Async.run(
                () -> "ok",
                v -> { success.set(v); successLatch.countDown(); },
                err -> { fail("unexpected error: " + err.getMessage()); }
        );
        flushMainUntil(successLatch);
        assertEquals("ok", success.get());
    }

    /**
     * Spin the main looper until either the latch counts down or 2s pass.
     * Async.run hops to a background thread and then posts back via Handler;
     * the Robolectric shadow needs to be told to drain pending Runnables.
     */
    private void flushMainUntil(CountDownLatch latch) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 2_000;
        while (latch.getCount() > 0 && System.currentTimeMillis() < deadline) {
            ShadowLooper.idleMainLooper(50, TimeUnit.MILLISECONDS);
        }
        if (latch.getCount() > 0) fail("callback did not fire within 2s");
    }
}
