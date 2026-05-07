package kg.ekonaryn.app.api.models;

public class PickupRequest {
    public String id;
    public String status;
    public String address;
    public double estimatedQty;
    public String notes;
    public String createdAt;
    public Material material;
    public User resident;
    public CollectionInfo collection;

    public static class CollectionInfo {
        public double actualWeightKg;
        public String collectedAt;
    }
}
