package kg.ekonaryn.app.api;

public class ApiException extends Exception {
    public final int code;
    public ApiException(int code, String message) {
        super(message);
        this.code = code;
    }
}
