const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  getConfiguracion,
  updateConfiguracion,
  uploadLogo,
  getLogo,
  testEmail,
} = require("../controllers/configController");

router.get("/", getConfiguracion);
router.post("/test-email", testEmail);
router.post("/logo", upload.single("logo"), uploadLogo);
router.get("/logo", getLogo);
router.put("/:clave", updateConfiguracion);

module.exports = router;
