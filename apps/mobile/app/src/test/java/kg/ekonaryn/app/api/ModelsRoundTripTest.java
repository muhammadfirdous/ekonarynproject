package kg.ekonaryn.app.api;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.google.gson.Gson;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import kg.ekonaryn.app.api.models.Material;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.api.models.User;

/**
 * Pin Gson's deserialization against the JSON shape the API actually returns.
 * Field-name drift on the server (e.g. renaming `accountStatus` →
 * `account_status`) would break the model silently — these tests catch that.
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 33)
public class ModelsRoundTripTest {

    private final Gson gson = new Gson();

    @Test
    public void user_parsesEveryDocumentedField_includingNullables() {
        String json = "{"
                + "\"id\":\"u1\","
                + "\"name\":\"Alice\","
                + "\"phone\":\"+996700000010\","
                + "\"email\":\"a@b.co\","
                + "\"role\":\"WORKER\","
                + "\"address\":\"12 Lenin\","
                + "\"points\":42,"
                + "\"accountStatus\":\"ACTIVE\","
                + "\"statusReason\":null,"
                + "\"emailVerifiedAt\":null,"
                + "\"phoneVerifiedAt\":\"2026-05-08T08:00:00Z\","
                + "\"idNumber\":\"AN1234\","
                + "\"idDocumentUrl\":\"/uploads/1.jpg\","
                + "\"serviceAreas\":\"[\\\"Center\\\"]\","
                + "\"vehicleType\":\"motorcycle\","
                + "\"vehiclePlate\":\"01KG999\","
                + "\"vehicleCapacityKg\":150.5,"
                + "\"maxConcurrentOrders\":3,"
                + "\"onShift\":true,"
                + "\"createdAt\":\"2026-05-01T00:00:00Z\""
                + "}";
        User u = gson.fromJson(json, User.class);
        assertEquals("u1", u.id);
        assertEquals("WORKER", u.role);
        assertEquals(42, u.points);
        assertEquals("ACTIVE", u.accountStatus);
        assertNull(u.statusReason);
        assertEquals(150.5, u.vehicleCapacityKg, 0.0001);
        assertEquals(Integer.valueOf(3), u.maxConcurrentOrders);
        assertEquals(Boolean.TRUE, u.onShift);
    }

    @Test
    public void user_roundTripsThroughGson_withoutLossOnFieldsWePopulate() {
        User u = new User();
        u.id = "u-rt";
        u.name = "Bob";
        u.phone = "+996700100002";
        u.role = "RESIDENT";
        u.points = 7;
        String json = gson.toJson(u);
        User back = gson.fromJson(json, User.class);
        assertEquals(u.id, back.id);
        assertEquals(u.name, back.name);
        assertEquals(u.phone, back.phone);
        assertEquals(u.role, back.role);
        assertEquals(u.points, back.points);
    }

    @Test
    public void pickupRequest_parsesNestedMaterialAndCollectionInfo() {
        String json = "{"
                + "\"id\":\"r1\","
                + "\"status\":\"completed\","
                + "\"address\":\"12 Lenin\","
                + "\"estimatedQty\":7.5,"
                + "\"notes\":\"Call first\","
                + "\"material\":{\"id\":\"m1\",\"name\":\"PET\",\"nameRu\":\"ПЭТ\",\"buyingPrice\":5,\"unit\":\"kg\"},"
                + "\"collection\":{\"actualWeightKg\":7.2,\"collectedAt\":\"2026-05-08T10:00:00Z\"}"
                + "}";
        PickupRequest r = gson.fromJson(json, PickupRequest.class);
        assertEquals("completed", r.status);
        assertEquals(7.5, r.estimatedQty, 0.0001);
        assertNotNull(r.material);
        assertEquals("PET", r.material.name);
        assertNotNull(r.collection);
        assertEquals(7.2, r.collection.actualWeightKg, 0.0001);
        assertEquals("2026-05-08T10:00:00Z", r.collection.collectedAt);
    }

    @Test
    public void pickupRequest_handlesAbsentNestedFields() {
        String json = "{\"id\":\"r2\",\"status\":\"pending\",\"address\":\"x\",\"estimatedQty\":3}";
        PickupRequest r = gson.fromJson(json, PickupRequest.class);
        assertEquals("pending", r.status);
        assertNull(r.material);
        assertNull(r.collection);
        assertNull(r.notes);
    }

    @Test
    public void material_parsesAllPriceFields_andOptionalDescription() {
        String json = "{"
                + "\"id\":\"m1\",\"name\":\"PET\",\"nameRu\":\"ПЭТ\",\"nameKy\":\"PET-Ky\","
                + "\"buyingPrice\":5,\"sellingPrice\":10,\"unit\":\"kg\",\"description\":\"Bottles only\""
                + "}";
        Material m = gson.fromJson(json, Material.class);
        assertEquals("ПЭТ", m.nameRu);
        assertEquals("PET-Ky", m.nameKy);
        assertEquals(5.0, m.buyingPrice, 0.0001);
        assertEquals(10.0, m.sellingPrice, 0.0001);
        assertEquals("Bottles only", m.description);
    }

    @Test
    public void material_descriptionIsNullable() {
        String json = "{\"id\":\"m1\",\"name\":\"X\",\"nameRu\":\"X\",\"nameKy\":\"X\",\"buyingPrice\":1,\"sellingPrice\":2,\"unit\":\"kg\",\"description\":null}";
        Material m = gson.fromJson(json, Material.class);
        assertNull(m.description);
    }

    @Test
    public void user_unknownFieldsAreSilentlyIgnored() {
        // The API may add new fields over time; old clients should not blow up.
        String json = "{\"id\":\"u1\",\"name\":\"X\",\"phone\":\"+996700000001\",\"role\":\"ADMIN\",\"points\":0,\"futureField\":42}";
        User u = gson.fromJson(json, User.class);
        assertEquals("u1", u.id);
        // No exception is itself the assertion; the extra field is dropped.
        assertTrue(true);
    }
}
