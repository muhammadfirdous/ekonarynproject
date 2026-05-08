package kg.ekonaryn.app.api.models;

public class User {
    public String id;
    public String name;
    public String phone;
    public String email;
    public String role;
    public String address;
    public int points;

    // Account lifecycle
    public String accountStatus;
    public String statusReason;
    public String emailVerifiedAt;
    public String phoneVerifiedAt;

    // Worker fields
    public String idNumber;
    public String idDocumentUrl;
    public String serviceAreas; // JSON array string
    public String vehicleType;
    public String vehiclePlate;
    public Double vehicleCapacityKg;
    public Integer maxConcurrentOrders;
    public Boolean onShift;

    public String createdAt;
}
